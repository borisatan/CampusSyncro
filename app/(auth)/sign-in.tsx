import { Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import { Link, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useRef, useState } from "react";
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
import { useAnalytics } from "../hooks/useAnalytics";
import { ensureUserProfile } from "../services/backendService";
import { useSubscription } from "../context/SubscriptionContext";
import { supabase } from "../utils/supabase";

// Configure WebBrowser to properly complete auth sessions
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const { linkUser } = useSubscription();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const passwordRef = useRef<TextInput>(null);
  const emailValid = isValidEmail(email);

  useEffect(() => {
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supported =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && enrolled && supported.length > 0);
    })();
  }, []);

  const handleBiometricSignIn = async () => {
    const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const hasFaceID = supported.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);

    if (hasFaceID) {
      // Attempt Face ID directly — disabling device fallback lets us detect permission issues
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to Sign In",
        disableDeviceFallback: true,
      });
      if (!result.success) {
        if (result.error === "user_cancel" || result.error === "system_cancel") return;
        // Face ID failed for a non-user reason (most likely permission denied)
        Alert.alert(
          "Face ID Not Available",
          "Face ID may be disabled for this app. Enable it in Settings > Face ID & Passcode.",
          [
            { text: "Not Now", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openURL("app-settings:") },
          ]
        );
        return;
      }
    } else {
      // No Face ID — fall back to Touch ID or passcode
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to Sign In",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });
      if (!result.success) return;
    }

    const storedEmail = await SecureStore.getItemAsync("email");
    const storedPassword = await SecureStore.getItemAsync("password");
    if (!storedEmail || !storedPassword) {
      Alert.alert("No saved credentials", "Please sign in with email first to enable biometric login.");
      return;
    }
    setEmail(storedEmail);
    setPassword(storedPassword);
    handleSignIn(storedEmail, storedPassword);
  };

  const handleSignIn = async (inputEmail?: string, inputPassword?: string) => {
    const userEmail = inputEmail ?? email;
    const userPassword = inputPassword ?? password;
    if (!userEmail || !userPassword) {
      Alert.alert("Missing info", "Please enter email and password.");
      return;
    }
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: userPassword,
      });
      if (error) throw error;
      await SecureStore.setItemAsync("email", userEmail);
      await SecureStore.setItemAsync("password", userPassword);
      if (data.user) {
        identifyUser(data.user.id, { email: data.user.email });
        await linkUser(data.user.id);
      }
      trackEvent("user_signed_in", {
        method: inputEmail ? "biometric" : "email",
      });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      trackEvent("user_sign_in_failed", {
        error_message: e?.message ?? "Unknown error",
      });
      if (e?.message?.includes("Invalid login credentials")) {
        Alert.alert(
          "No account found",
          "We couldn't find an account with those details. Would you like to start fresh?",
          [
            { text: "Try again", style: "cancel" },
            { text: "Start over", onPress: () => router.replace("/(onboarding)/welcome") },
          ]
        );
      } else {
        Alert.alert("Sign in failed", e?.message ?? "Unknown error");
      }
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

        const { data: sessionData, error: sessionError } =
          await supabase.auth.exchangeCodeForSession(result.url);

        if (sessionError) {
          console.error("[OAuth] Session exchange error:", sessionError);
          throw sessionError;
        }

        if (!sessionData.session) {
          throw new Error("No session returned after code exchange");
        }

        // Wait for session to be persisted
        await new Promise(resolve => setTimeout(resolve, 100));

        // Ensure user profile exists
        await ensureUserProfile(sessionData.user.id);

        if (sessionData.user) {
          identifyUser(sessionData.user.id, { email: sessionData.user.email });
          await linkUser(sessionData.user.id);
        }

        trackEvent("user_authenticated", { method: "google" });
        router.replace("/(tabs)/dashboard");
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

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
        nonce: rawNonce,
      });
      if (error) throw error;

      // Ensure user profile exists (creates if needed)
      if (data.user) {
        await ensureUserProfile(data.user.id);
        identifyUser(data.user.id, { email: data.user.email });
        await linkUser(data.user.id);
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
            keyboardDismissMode="on-drag"
          >
            <View className="flex-1 px-6 pt-16 pb-8">
              {/* Header */}
              <View className="items-center mb-10">
                <Text className="text-4xl font-bold text-white mb-2">
                  Welcome back
                </Text>
                <Text className="text-secondaryDark text-base text-center">
                  Sign in to continue your journey
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
                      value={password}
                      onChangeText={setPassword}
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

                {/* Forgot password */}
                <Pressable className="self-end -mt-2 active:opacity-60">
                  <Text className="text-accentBlue text-sm font-medium">
                    Forgot password?
                  </Text>
                </Pressable>
              </View>

              {/* Sign In Button */}
              <Pressable
                onPress={() => handleSignIn()}
                disabled={isSubmitting || !emailValid}
                className="rounded-2xl py-4 items-center mb-4 active:opacity-80"
                style={{ backgroundColor: emailValid ? "#4F8EF7" : "#2A3050" }}
              >
                <Text
                  className="font-semibold text-base"
                  style={{ color: emailValid ? "#fff" : "#5A6480" }}
                >
                  {isSubmitting ? "Signing in…" : "Sign In"}
                </Text>
              </Pressable>

              {/* Biometric */}
              {biometricAvailable && (
                <Pressable
                  onPress={handleBiometricSignIn}
                  className="flex-row items-center justify-center gap-2 py-3 mb-4 active:opacity-60"
                >
                  <Ionicons name="finger-print" size={20} color="#8A96B4" />
                  <Text className="text-secondaryDark text-sm">
                    Use biometric sign-in
                  </Text>
                </Pressable>
              )}

              {/* Sign Up */}
              <View className="flex-row justify-center mt-auto pt-0">
                <Text className="text-secondaryDark">
                  Don&apos;t have an account?{" "}
                </Text>
                <Link href="/(onboarding)/welcome" asChild>
                  <Pressable className="active:opacity-60">
                    <Text className="text-accentBlue font-semibold">
                      Sign up
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
