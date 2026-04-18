import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useRef, useState } from "react";
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

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
import { V3_DEFAULT_CATEGORIES } from "../constants/onboardingCategories";
import { useAnalytics } from "../hooks/useAnalytics";
import { bulkCreateCategories, ensureUserProfile } from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useAppTourStore } from "../store/useAppTourStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useIncomeStore } from "../store/useIncomeStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useSubscription } from "../context/SubscriptionContext";
import { pendingSignUp } from "../store/pendingSignUp";
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

  const { selectedCategories, categoryBudgets, estimatedIncome, notificationFrequency, selectedCurrency } = onboardingData;

  // Step 1: Create categories (errors are logged but don't block profile update)
  try {
    const categoriesToCreate: any[] = [];

    // Always add the Income category first (sort_order 0)
    categoriesToCreate.push({
      category_name: 'Income',
      icon: 'cash-outline',
      color: '#00C853',
      sort_order: 0,
      budget_amount: null,
      budget_percentage: 0,
      show_on_dashboard: false,
    });

    if (selectedCategories && selectedCategories.length > 0) {
      selectedCategories.forEach((categoryName: string, index: number) => {
        const categoryDef = V3_DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName);
        if (!categoryDef) {
          console.warn(`[persistOnboardingData] Category not found in V3_DEFAULT_CATEGORIES: ${categoryName}`);
          return;
        }
        const budget = categoryBudgets?.find((b: any) => b.category_name === categoryName);
        categoriesToCreate.push({
          category_name: categoryDef.name,
          icon: categoryDef.icon,
          color: categoryDef.color,
          sort_order: index + 1,
          budget_amount: budget?.budget_amount ?? null,
          budget_percentage: budget?.budget_percentage ?? null,
        });
      });
    }

    await bulkCreateCategories(userId, categoriesToCreate);
  } catch (catError: any) {
    console.error('[persistOnboardingData] Error creating categories:', catError.message);
  }

  // Step 2: Update income — kept separate from notification frequency so one
  // cannot block the other (e.g. if daily_notification_frequency column is missing).
  if (estimatedIncome && estimatedIncome > 0) {
    try {
      const { error: incomeError } = await supabase
        .from('Profiles')
        .update({
          manual_income: estimatedIncome,
          use_dynamic_income: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (incomeError) {
        console.error('[persistOnboardingData] Error updating income:', incomeError.message);
      }
    } catch (incomeError: any) {
      console.error('[persistOnboardingData] Error updating income:', incomeError.message);
    }
  }

  // Step 3: Update notification frequency (separate so a missing column doesn't block income)
  try {
    const frequencyValue = notificationFrequency ? (NOTIFICATION_FREQUENCY_MAP[notificationFrequency] ?? 0) : 0;
    if (frequencyValue > 0) {
      const { error: freqError } = await supabase
        .from('Profiles')
        .update({
          daily_notification_frequency: frequencyValue,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (freqError) {
        console.error('[persistOnboardingData] Error updating notification frequency:', freqError.message);
      }
    }
  } catch (freqError: any) {
    console.error('[persistOnboardingData] Error updating notification frequency:', freqError.message);
  }

  // Step 4: Update currency selection
  if (selectedCurrency) {
    try {
      const { error: currencyError } = await supabase
        .from('Profiles')
        .update({
          currency: selectedCurrency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (currencyError) {
        console.error('[persistOnboardingData] Error updating currency:', currencyError.message);
      }
    } catch (currencyError: any) {
      console.error('[persistOnboardingData] Error updating currency:', currencyError.message);
    }
  }

}

export default function SignUpScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const isOnboardingFlow = from === "onboarding";
  const { trackEvent, identifyUser } = useAnalytics();
  const { newOnboardingData, setOnboardingDataPersisted } = useOnboardingStore();
  const { linkUser } = useSubscription();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const emailValid = isValidEmail(email);

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

      // Send OTP to the user's email before creating the account.
      // Credentials are stored in memory so verify-email.tsx can complete sign-up.
      const { data: otpData, error: otpError } = await supabase.functions.invoke("send-signup-otp", {
        body: { email: email.trim().toLowerCase() },
      });

      if (otpError) {
        trackEvent("user_sign_up_failed", { error_message: otpError.message });
        Alert.alert("Could not send code", "Please check your email and try again.");
        return;
      }

      if (otpData?.rateLimited) {
        Alert.alert("Too many attempts", "You've requested too many codes. Please try again in 10 minutes.");
        return;
      }

      pendingSignUp.email = email.trim().toLowerCase();
      pendingSignUp.password = password;

      router.push(isOnboardingFlow ? "/(auth)/verify-email?from=onboarding" : "/(auth)/verify-email");
    } catch (e: any) {
      trackEvent("user_sign_up_failed", {
        error_message: e?.message ?? "Unknown error",
      });
      Alert.alert("Sign up failed", e?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);

      // Create proper redirect URI using Linking
      const redirectTo = Linking.createURL("auth/callback");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true, // Required for PKCE in React Native — we call exchangeCodeForSession manually
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

      // Open the OAuth provider's sign-in page.
      // iOS: ASWebAuthenticationSession intercepts the redirect and returns {type:'success'}.
      // Android: Chrome Custom Tab fires a deep link intent; openAuthSessionAsync returns
      //   {type:'cancel'} and the callback.tsx route handles the exchange via the deep link.
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      if (result.type === "success" && result.url) {
        // iOS path: ASWebAuthenticationSession captured the redirect internally.

        // Only claim the persisted flag when we're about to persist immediately.
        // In the onboarding flow, persistence is deferred to notification-reminders.
        if (!isOnboardingFlow) {
          setOnboardingDataPersisted();
        }

        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(result.url);

        if (sessionError) {
          console.error("[OAuth] Session exchange error:", sessionError);
          throw sessionError;
        }

        if (!sessionData.session) {
          throw new Error("No session returned after code exchange");
        }

        // Ensure user profile exists
        await ensureUserProfile(sessionData.user.id);

        if (isOnboardingFlow) {
          // Mid-onboarding: link RevenueCat before paywall but defer data persistence
          // to notification-reminders where notification frequency will also be set.
          await linkUser(sessionData.user.id);
          if (sessionData.user) {
            identifyUser(sessionData.user.id, { email: sessionData.user.email });
          }
          trackEvent("user_authenticated", { method: "google" });
          router.replace("/(onboarding)/subscription-trial");
        } else {
          // Normal sign-up: persist everything now.
          await persistOnboardingData(sessionData.user.id, newOnboardingData);
          await linkUser(sessionData.user.id);
          if (newOnboardingData.foundingMemberEmail) {
            supabase.functions.invoke('notify-founding-claim', {
              body: { email: newOnboardingData.foundingMemberEmail, userId: sessionData.user.id },
            }).catch((e) => console.error('[SignUp] notify-founding-claim error:', e));
          }
          await Promise.all([
            useCategoriesStore.getState().loadCategories(),
            useAccountsStore.getState().loadAccounts(),
            useIncomeStore.getState().loadIncomeSettings(),
            useCurrencyStore.getState().loadCurrency(),
          ]);
          useAppTourStore.getState().resetSeenPages();
          if (sessionData.user) {
            identifyUser(sessionData.user.id, { email: sessionData.user.email });
          }
          trackEvent("user_authenticated", { method: "google" });
          router.replace("/(tabs)/profile");
        }
      } else {
        // Android path: Chrome Custom Tab fired a deep link intent and closed.
        // The callback.tsx route receives the deep link and handles the exchange.
      }
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
      setIsSubmitting(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const rawNonce = Crypto.randomUUID();
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce
      );
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) throw new Error("No identity token");

      // Only claim the persisted flag when we're about to persist immediately.
      // In the onboarding flow, persistence is deferred to notification-reminders.
      if (!isOnboardingFlow) {
        setOnboardingDataPersisted();
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;

      if (data.user) {
        await ensureUserProfile(data.user.id);

        if (isOnboardingFlow) {
          // Mid-onboarding: link RevenueCat before paywall but defer data persistence
          // to notification-reminders where notification frequency will also be set.
          await linkUser(data.user.id);
          identifyUser(data.user.id, { email: data.user.email });
          trackEvent("user_authenticated", { method: "apple" });
          router.replace("/(onboarding)/subscription-trial");
        } else {
          await persistOnboardingData(data.user.id, newOnboardingData);
          await linkUser(data.user.id);
          if (newOnboardingData.foundingMemberEmail) {
            supabase.functions.invoke('notify-founding-claim', {
              body: { email: newOnboardingData.foundingMemberEmail, userId: data.user.id },
            }).catch((e) => console.error('[SignUp] notify-founding-claim error:', e));
          }
          await Promise.all([
            useCategoriesStore.getState().loadCategories(),
            useAccountsStore.getState().loadAccounts(),
            useIncomeStore.getState().loadIncomeSettings(),
            useCurrencyStore.getState().loadCurrency(),
          ]);
          useAppTourStore.getState().resetSeenPages();
          identifyUser(data.user.id, { email: data.user.email });
          trackEvent("user_authenticated", { method: "apple" });
          router.replace("/(tabs)/profile");
        }
      }
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
            keyboardDismissMode="on-drag"
          >
            <View className="flex-1 px-6 pt-16 pb-8">
              {/* Back button (onboarding flow only) */}
              {isOnboardingFlow && (
                <Pressable
                  onPress={() => router.back()}
                  className="self-start p-2 -ml-2 mb-4 active:opacity-60"
                >
                  <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
              )}

              {/* Header */}
              <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-white mb-2">
                  {isOnboardingFlow ? "Save your progress" : "Create account"}
                </Text>
                <Text className="text-secondaryDark text-base text-center">
                  {isOnboardingFlow ? "Create a free account to continue" : "Join Monelo in seconds"}
                </Text>
              </View>

              {/* Social Buttons */}
              <View className="gap-3 mb-8">
                {/* <Pressable
                  className="flex-row items-center justify-center gap-3 bg-white rounded-2xl py-4 active:opacity-80"
                  onPress={handleGoogleSignIn}
                  disabled={isSubmitting}
                >
                  <AntDesign name="google" size={20} color="#000" />
                  <Text className="text-black font-semibold text-base">
                    Continue with Google
                  </Text>
                </Pressable> */}

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
                    returnKeyType="next"
                    value={email}
                    onChangeText={setEmail}
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    style={{ lineHeight: 16 }}
                  />
                </View>

                {/* Password */}
                <View>
                  <Text className="text-textDark text-sm font-medium mb-2">
                    Password
                  </Text>
                  <View className="relative">
                    <TextInput
                      ref={passwordRef}
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base pr-12"
                      placeholder="••••••••"
                      placeholderTextColor="#8A96B4"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      returnKeyType="next"
                      textContentType="newPassword"
                      value={password}
                      onChangeText={setPassword}
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                      style={{ lineHeight: 16 }}
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
                      ref={confirmPasswordRef}
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base pr-12"
                      placeholder="••••••••"
                      placeholderTextColor="#8A96B4"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      textContentType="newPassword"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={{ lineHeight: 16 }}
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
                disabled={isSubmitting || !emailValid}
                className="rounded-2xl py-4 items-center mb-4 active:opacity-80"
                style={{ backgroundColor: emailValid ? "#4F8EF7" : "#2A3050" }}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: emailValid ? "#fff" : "#5A6480" }}
                >
                  {isSubmitting ? "Sending code…" : "Sign Up"}
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
