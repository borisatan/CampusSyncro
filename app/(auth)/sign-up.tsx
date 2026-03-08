import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as AppleAuthentication from "expo-apple-authentication";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
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
import { useAnalytics } from "../hooks/useAnalytics";
import { supabase } from "../utils/supabase";

export default function SignUpScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
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
      const redirectTo = Linking.createURL("/");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        trackEvent("user_sign_up_failed", { error_message: error.message });
        Alert.alert("Sign up failed", error.message);
        return;
      }

      if (data.user) {
        identifyUser(data.user.id, {
          email: data.user.email,
          $set_once: { signup_date: new Date().toISOString() },
        });
      }
      trackEvent("user_signed_up", { requires_verification: !data.session });

      if (!data.session) {
        setAwaitingVerification(true);
        return;
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
        "Enter your email to resend the verification."
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
        "If an account exists for this email, a link was sent."
      );
    } catch (e: any) {
      Alert.alert("Could not resend", e?.message ?? "Unknown error");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);
      const redirectTo = Linking.createURL("/");
      console.log("OAuth redirect URL:", redirectTo);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("No OAuth URL returned");

      // On Android, the browser closes (result.type === "dismiss") when the deep
      // link is intercepted by the OS. We listen for the Linking event as a
      // fallback so we still get the callback URL in that case.
      let resolveDeepLink!: (url: string) => void;
      const deepLinkPromise = new Promise<string>((resolve) => {
        resolveDeepLink = resolve;
      });
      const linkingSub = Linking.addEventListener("url", ({ url }) => {
        resolveDeepLink(url);
      });

      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectTo
      );

      console.log("WebBrowser result:", result);

      let callbackUrl: string | null = null;

      if (result.type === "success") {
        callbackUrl = result.url;
      } else if (result.type === "dismiss" || result.type === "cancel") {
        // Android often returns "dismiss" even on success — wait briefly for the
        // Linking event which carries the actual callback URL.
        try {
          callbackUrl = await Promise.race([
            deepLinkPromise,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 2000)
            ),
          ]);
        } catch {
          console.log("OAuth cancelled or dismissed without callback");
        }
      }

      linkingSub.remove();

      if (!callbackUrl) return;

      console.log("OAuth callback URL:", callbackUrl);

      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(callbackUrl);

      if (sessionError) {
        console.error("Session exchange error:", sessionError);
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error("No session returned after code exchange");
      }

      console.log("Session established:", sessionData.session.user.id);

      // Wait a moment for session to be persisted to AsyncStorage
      await new Promise(resolve => setTimeout(resolve, 100));

      if (sessionData.user) {
        identifyUser(sessionData.user.id, { email: sessionData.user.email });
      }
      trackEvent("user_signed_up", { method: "google" });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      console.error("Google sign-in error:", e);
      trackEvent("user_sign_up_failed", {
        error_message: e?.message ?? "Unknown error",
        method: "google",
      });
      Alert.alert("Google sign-in failed", e?.message ?? "Unknown error");
    } finally {
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

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (error) throw error;
      if (data.user) {
        identifyUser(data.user.id, { email: data.user.email });
      }
      trackEvent("user_signed_up", { method: "apple" });
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      if (e?.code === "ERR_REQUEST_CANCELED") return;
      trackEvent("user_sign_up_failed", {
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
