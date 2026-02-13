import { Link, useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { supabase } from "../utils/supabase";

export default function SignUpScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);

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
      const redirectTo = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        Alert.alert("Sign up failed", error.message);
        return;
      }

      if (!data.session) {
        setAwaitingVerification(true);
        return;
      }

      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      Alert.alert("Sign up failed", e?.message ?? "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      Alert.alert("Email required", "Enter your email to resend the verification.");
      return;
    }
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) {
        Alert.alert("Could not resend", error.message);
        return;
      }
      Alert.alert("Sent", "If an account exists for this email, a link was sent.");
    } catch (e: any) {
      Alert.alert("Could not resend", e?.message ?? "Unknown error");
    }
  };

  return (
    <View className={isDarkMode ? "flex-1 bg-backgroundDark px-6 py-10" : "flex-1 bg-white px-6 py-10"}>
      <View className="mt-8 items-center">
        <Text className={isDarkMode ? "text-2xl font-bold text-white" : "text-2xl font-bold text-black"}>
          Create your account
        </Text>
        <Text className={isDarkMode ? "text-secondaryDark mt-1" : "text-secondaryLight mt-1"}>
          Join Monelo in seconds
        </Text>
      </View>

      <View className="mt-8 gap-5">
        {awaitingVerification && (
          <View className="bg-backgroundMuted rounded-xl p-4">
            <Text className={isDarkMode ? "text-white" : "text-black"}>
              We attempted to send a verification link to {email}. Check your inbox and spam.
            </Text>
            <Pressable onPress={handleResend} className="bg-accentBlue rounded-xl py-3 items-center mt-3">
              <Text className="text-white font-semibold">Resend verification email</Text>
            </Pressable>
          </View>
        )}

        {/* Email */}
        <View>
          <Text className={isDarkMode ? "text-white mb-2" : "text-black mb-2"}>Email</Text>
          <TextInput
            className={isDarkMode ? "bg-inputDark text-white px-4 py-3 rounded-xl border border-borderDark" : "bg-background text-black px-4 py-3 rounded-xl border border-borderLight"}
            placeholder="you@example.com"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password */}
        <View>
          <Text className={isDarkMode ? "text-white mb-2" : "text-black mb-2"}>Password</Text>
          <TextInput
            className={isDarkMode ? "bg-inputDark text-white px-4 py-3 rounded-xl border border-borderDark" : "bg-background text-black px-4 py-3 rounded-xl border border-borderLight"}
            placeholder="••••••••"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Confirm Password */}
        <View>
          <Text className={isDarkMode ? "text-white mb-2" : "text-black mb-2"}>Confirm Password</Text>
          <TextInput
            className={isDarkMode ? "bg-inputDark text-white px-4 py-3 rounded-xl border border-borderDark" : "bg-background text-black px-4 py-3 rounded-xl border border-borderLight"}
            placeholder="••••••••"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
            secureTextEntry
            autoCapitalize="none"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Pressable
          onPress={handleSignUp}
          disabled={isSubmitting}
          className="bg-accentTeal rounded-xl py-4 items-center mt-2"
        >
          <Text className="text-white font-semibold">{isSubmitting ? "Creating account…" : "Sign Up"}</Text>
        </Pressable>

        <View className="flex-row justify-center mt-2">
          <Text className={isDarkMode ? "text-secondaryDark" : "text-secondaryLight"}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <Pressable>
              <Text className="text-accentBlue font-semibold">Sign In</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
