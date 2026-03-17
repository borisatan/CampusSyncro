import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { bulkCreateCategories } from "../services/backendService";
import { ensureUserProfile } from "../services/backendService";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { supabase } from "../utils/supabase";

// Configure WebBrowser to properly complete auth sessions
WebBrowser.maybeCompleteAuthSession();

const NOTIFICATION_FREQUENCY_MAP: Record<string, number> = {
  once: 1,
  three: 3,
  five: 5,
};

/**
 * Persist onboarding data to Supabase after sign-up.
 * Creates categories with budgets, saves income and notification frequency to profile.
 * Exported so AuthContext and callback route can also call it.
 */
export async function persistOnboardingData(userId: string, onboardingData: any) {
  console.log('[persistOnboardingData] Starting data persistence for user:', userId);

  const { selectedCategories, categoryBudgets, estimatedIncome, notificationFrequency } = onboardingData;

  // Step 1: Create categories (errors are logged but don't block profile update)
  if (selectedCategories && selectedCategories.length > 0) {
    console.log('[persistOnboardingData] Creating categories:', selectedCategories);
    try {
      const categoriesToCreate = selectedCategories.map((categoryName: string) => {
        const categoryDef = V3_DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName);
        if (!categoryDef) {
          console.warn(`[persistOnboardingData] Category not found in V3_DEFAULT_CATEGORIES: ${categoryName}`);
          return null;
        }
        const budget = categoryBudgets?.find((b: any) => b.category_name === categoryName);
        return {
          category_name: categoryDef.name,
          icon: categoryDef.icon,
          color: categoryDef.color,
          budget_amount: budget?.budget_amount || null,
          budget_percentage: budget?.budget_percentage || null,
        };
      }).filter(Boolean);

      if (categoriesToCreate.length > 0) {
        await bulkCreateCategories(userId, categoriesToCreate as any);
        console.log('[persistOnboardingData] Categories created successfully');
      }
    } catch (catError: any) {
      console.error('[persistOnboardingData] Error creating categories:', catError.message);
    }
  }

  // Step 2: Update profile with income and notification frequency (always runs)
  try {
    const profileUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (estimatedIncome && estimatedIncome > 0) {
      profileUpdates.manual_income = estimatedIncome;
      profileUpdates.use_dynamic_income = false;
    }

    const frequencyValue = notificationFrequency ? (NOTIFICATION_FREQUENCY_MAP[notificationFrequency] ?? 0) : 0;
    if (frequencyValue > 0) {
      profileUpdates.daily_notification_frequency = frequencyValue;
    }

    if (Object.keys(profileUpdates).length > 1) { // more than just updated_at
      const { error: profileError } = await supabase
        .from('Profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (profileError) {
        console.error('[persistOnboardingData] Error updating profile:', profileError.message);
      } else {
        console.log('[persistOnboardingData] Profile updated successfully');
      }
    }
  } catch (profileError: any) {
    console.error('[persistOnboardingData] Error updating profile:', profileError.message);
  }

  console.log('[persistOnboardingData] Data persistence completed');
}

export default function SignUpScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const { newOnboardingData, setOnboardingDataPersisted, clearOnboardingDataPersisted } = useOnboardingStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert("Missing info", "Please fill all fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Claim the flag BEFORE signUp so that when onAuthStateChange fires
      // (which supabase calls synchronously during signUp before the promise
      // returns), AuthContext sees hasPersistedOnboardingData=true and skips.
      // This makes sign-up.tsx the sole persister for instant-session paths.
      setOnboardingDataPersisted();

      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        clearOnboardingDataPersisted(); // Allow retry
        trackEvent("user_sign_up_failed", { error_message: error.message });
        Alert.alert("Sign up failed", error.message);
        return;
      }

      trackEvent("user_signed_up", { requires_verification: !data.session });

      if (!data.session) {
        // Email verification required — clear the flag we claimed so that
        // AuthContext can persist onboarding data after the user verifies and signs in.
        clearOnboardingDataPersisted();
        setAwaitingVerification(true);
        return;
      }

      if (data.user) {
        // Instant session: flag is already claimed above, we're the sole persister.
        await ensureUserProfile(data.user.id);
        await persistOnboardingData(data.user.id, newOnboardingData);
        identifyUser(data.user.id, {
          email: data.user.email,
          $set_once: { signup_date: new Date().toISOString() },
        });
      }

      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      trackEvent("user_sign_up_failed", {
        error_message: e?.message ?? "Unknown error",
      });
      Alert.alert("Sign up failed", e?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert(
        "Email required",
        "Enter your email to resend the verification.",
      );
      return;
    }
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) {
        Alert.alert("Could not resend", error.message);
        return;
      }
      Alert.alert(
        "Sent",
        "If an account exists for this email, a link was sent.",
      );
    } catch (e: any) {
      Alert.alert("Could not resend", e?.message ?? "Unknown error");
    }
  };

  const handleGoogleSignIn = async () => {
    console.log("========================================");
    console.log("[OAuth] GOOGLE SIGN IN STARTED");
    console.log("========================================");

    let urlListener: any = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let fallbackUrl: string | null = null;
    let isTimedOut = false;

    try {
      setIsSubmitting(true);

      // Create proper redirect URI using Linking
      const redirectTo = Linking.createURL("auth/callback");
      console.log("[OAuth] Step 1: OAuth redirect URL:", redirectTo);

      // Setup URL listener as fallback mechanism
      // This catches the callback if user closes browser manually
      urlListener = Linking.addEventListener('url', (event) => {
        console.log("[OAuth] URL listener fired:", event.url);
        if (event.url.includes('auth/callback')) {
          fallbackUrl = event.url;
          console.log("[OAuth] Fallback URL captured");
        }
      });

      // Setup timeout (30 seconds)
      timeoutId = setTimeout(() => {
        isTimedOut = true;
        console.log("[OAuth] Authentication timed out after 30 seconds");
      }, 30000);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: false, // Let WebBrowser handle the redirect
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        },
      });

      if (error) {
        console.error('[OAuth] signInWithOAuth error:', error);
        throw error;
      }
      if (!data.url) throw new Error("No OAuth URL returned");

      console.log('[OAuth] Step 2: Opening browser for authentication');

      // Open the OAuth provider's sign-in page
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      console.log('[OAuth] Step 3: Browser result:', result.type);

      // Check for timeout
      if (isTimedOut) {
        throw new Error("Authentication timed out. Please try again.");
      }

      // Determine the callback URL source
      let callbackUrl: string | null = null;

      if (result.type === "success" && result.url) {
        // Primary path: WebBrowser captured the redirect successfully
        console.log("[OAuth] Using callback URL from WebBrowser");
        callbackUrl = result.url;
      } else if (result.type === "cancel" || result.type === "dismiss") {
        // Fallback path: Check if URL listener captured the callback
        console.log("[OAuth] Browser dismissed, checking fallback URL");

        // Wait briefly to allow listener to fire
        await new Promise(resolve => setTimeout(resolve, 500));

        if (fallbackUrl) {
          console.log("[OAuth] Using fallback URL from listener");
          callbackUrl = fallbackUrl;
        } else {
          // User actually cancelled without completing auth
          console.log("[OAuth] User cancelled authentication (no callback received)");
          return;
        }
      }

      if (!callbackUrl) {
        throw new Error("No callback URL received from authentication");
      }

      console.log("[OAuth] Step 4: Got callback URL, exchanging for session");

      // Claim flag BEFORE exchangeCodeForSession so that when onAuthStateChange fires
      // (which it does synchronously-ish during the exchange), it sees the flag already
      // set and skips persistence — this component is the sole persister for OAuth flows.
      setOnboardingDataPersisted();

      // Exchange the authorization code for a session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(callbackUrl);

      if (sessionError) {
        console.error("[OAuth] Session exchange error:", sessionError);
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error("No session returned after code exchange");
      }

      console.log("[OAuth] Session established successfully!");
      console.log("[OAuth] User ID:", sessionData.session.user.id);

      // Ensure user profile exists
      await ensureUserProfile(sessionData.user.id);

      // Persist onboarding data to database
      await persistOnboardingData(sessionData.user.id, newOnboardingData);

      if (sessionData.user) {
        identifyUser(sessionData.user.id, { email: sessionData.user.email });
      }

      trackEvent("user_authenticated", { method: "google" });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      console.error("[OAuth] GOOGLE OAUTH ERROR:", e);

      trackEvent("user_auth_failed", {
        error_message: e?.message ?? "Unknown error",
        method: "google",
      });

      Alert.alert(
        "Google Sign-In Failed",
        e?.message ?? "An error occurred during Google sign-in."
      );
    } finally {
      // Cleanup: Remove listener and clear timeout
      if (urlListener) {
        urlListener.remove();
        console.log("[OAuth] URL listener removed");
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("No identity token");

      // Claim flag BEFORE signInWithIdToken so onAuthStateChange sees it already set
      setOnboardingDataPersisted();

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;

      // Ensure user profile exists (creates if needed)
      if (data.user) {
        await ensureUserProfile(data.user.id);
        await persistOnboardingData(data.user.id, newOnboardingData);
        identifyUser(data.user.id, { email: data.user.email });
      }

      trackEvent("user_authenticated", { method: "apple" });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      trackEvent("user_auth_failed", {
        error_message: e?.message ?? "Unknown error",
        method: "apple",
      });
      Alert.alert("Apple sign-in failed", e?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#1A0D3D", "#0E0819", "#08090F", "#08090F"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 pt-16 pb-8">
              {/* Header */}
              <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-white mb-2">
                  Create account
                </Text>
                <Text className="text-secondaryDark text-base text-center">
                  Join Monelo in seconds
                </Text>
              </View>

              {/* Social Buttons */}
              <View className="gap-3 mb-8">
                <Pressable
                  className="flex-row items-center justify-center gap-3 bg-white rounded-2xl py-4 active:opacity-80"
                  onPress={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <AntDesign name="google" size={20} color="#000" />
                  <Text className="text-black font-semibold text-base">
                    Continue with Google
                  </Text>
                </Pressable>

                <Pressable
                  className="flex-row items-center justify-center gap-3 rounded-2xl py-4 active:opacity-80"
                  style={{ backgroundColor: "#1C1C1E" }}
                  onPress={handleAppleSignIn}
                  disabled={isSubmitting}
                >
                  <Ionicons name="logo-apple" size={22} color="#fff" />
                  <Text className="text-white font-semibold text-base">
                    Continue with Apple
                  </Text>
                </Pressable>
              </View>

              {/* Divider */}
              <View className="flex-row items-center gap-3 mb-8">
                <View className="flex-1 h-px bg-borderDark" />
                <Text className="text-secondaryDark text-xs tracking-widest">
                  OR CONTINUE WITH EMAIL
                </Text>
                <View className="flex-1 h-px bg-borderDark" />
              </View>

              {/* Verification banner */}
              {awaitingVerification && (
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-4 mb-5">
                  <Text className="text-textDark text-sm mb-3">
                    We sent a verification link to{" "}
                    <Text className="text-accentBlue">{email}</Text>. Check your
                    inbox and spam.
                  </Text>
                  <Pressable
                    onPress={handleResend}
                    className="bg-accentBlue rounded-xl py-3 items-center active:opacity-80"
                  >
                    <Text className="text-white font-semibold text-sm">
                      Resend verification email
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* Form */}
              <View className="gap-5 mb-6">
                {/* Email */}
                <View>
                  <Text className="text-textDark text-sm font-medium mb-2">
                    Email
                  </Text>
                  <TextInput
                    className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base"
                    placeholder="you@example.com"
                    placeholderTextColor="#8A96B4"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Password */}
                <View>
                  <Text className="text-textDark text-sm font-medium mb-2">
                    Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base pr-12"
                      placeholder="••••••••"
                      placeholderTextColor="#8A96B4"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      value={password}
                      onChangeText={setPassword}
                    />
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-0 bottom-0 justify-center"
                    >
                      <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#8A96B4"
                      />
                    </Pressable>
                  </View>
                </View>

                {/* Confirm Password */}
                <View>
                  <Text className="text-textDark text-sm font-medium mb-2">
                    Confirm Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base pr-12"
                      placeholder="••••••••"
                      placeholderTextColor="#8A96B4"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                    <Pressable
                      onPress={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-4 top-0 bottom-0 justify-center"
                    >
                      <Ionicons
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={20}
                        color="#8A96B4"
                      />
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* Sign Up Button */}
              <Pressable
                onPress={handleSignUp}
                disabled={isSubmitting}
                className="rounded-2xl py-4 items-center mb-4 bg-accentBlue active:opacity-80"
              >
                <Text className="text-white font-semibold text-base">
                  {isSubmitting ? "Creating account…" : "Sign Up"}
                </Text>
              </Pressable>

              {/* Sign In */}
              <View className="flex-row justify-center mt-auto">
                <Text className="text-secondaryDark">
                  Already have an account?{" "}
                </Text>
                <Link href="/(auth)/sign-in" asChild>
                  <Pressable className="active:opacity-60">
                    <Text className="text-accentBlue font-semibold">
                      Sign in
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
