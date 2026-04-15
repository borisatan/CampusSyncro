import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { ensureUserProfile } from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useAppTourStore } from "../store/useAppTourStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useIncomeStore } from "../store/useIncomeStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { pendingSignUp } from "../store/pendingSignUp";
import { useSubscription } from "../context/SubscriptionContext";
import { supabase } from "../utils/supabase";
import { persistOnboardingData } from "./sign-up";

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length < 2) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const { newOnboardingData, setOnboardingDataPersisted, clearOnboardingDataPersisted } = useOnboardingStore();
  const { linkUser } = useSubscription();

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const codeInputRef = useRef<TextInput>(null);
  const email = pendingSignUp.email;

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setError(null);
    setResendMessage(null);
    setIsVerifying(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-signup-otp", {
        body: { email, code: trimmedCode },
      });

      if (fnError) throw fnError;

      if (!data?.valid) {
        setError("Wrong code. Please try again.");
        return;
      }

      // Code is valid — claim the flag before signUp so onAuthStateChange
      // sees it set and skips persistence (this screen is the sole persister).
      setOnboardingDataPersisted();

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: pendingSignUp.password,
      });

      if (signUpError) {
        clearOnboardingDataPersisted();
        trackEvent("user_sign_up_failed", { error_message: signUpError.message });
        setError(signUpError.message);
        return;
      }

      if (!authData.session || !authData.user) {
        clearOnboardingDataPersisted();
        setError("Account created but could not sign in automatically. Please sign in manually.");
        return;
      }

      // Clear credentials from memory
      pendingSignUp.email = "";
      pendingSignUp.password = "";

      await ensureUserProfile(authData.user.id);
      await persistOnboardingData(authData.user.id, newOnboardingData);

      if (newOnboardingData.foundingMemberEmail) {
        supabase.functions.invoke("notify-founding-claim", {
          body: { email: newOnboardingData.foundingMemberEmail, userId: authData.user.id },
        }).catch((e) => console.error("[VerifyEmail] notify-founding-claim error:", e));
      }

      await Promise.all([
        useCategoriesStore.getState().loadCategories(),
        useAccountsStore.getState().loadAccounts(),
        useIncomeStore.getState().loadIncomeSettings(),
        useCurrencyStore.getState().loadCurrency(),
      ]);
      useAppTourStore.getState().resetSeenPages();

      identifyUser(authData.user.id, {
        email: authData.user.email,
        $set_once: { signup_date: new Date().toISOString() },
      });
      trackEvent("user_signed_up", { method: "email", requires_verification: false });

      router.replace("/(tabs)/profile");
    } catch (e: any) {
      clearOnboardingDataPersisted();
      trackEvent("user_sign_up_failed", { error_message: e?.message ?? "Unknown error" });
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendMessage(null);
    setIsResending(true);

    try {
      const { data: resendData } = await supabase.functions.invoke("send-signup-otp", { body: { email } });
      if (resendData?.rateLimited) {
        setError("Too many attempts. Please try again in 10 minutes.");
      } else {
        setResendMessage("A new code has been sent to your email.");
        setCode("");
        setTimeout(() => codeInputRef.current?.focus(), 100);
      }
    } catch (e: any) {
      setError("Could not resend code. Please try again.");
    } finally {
      setIsResending(false);
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
            <View className="flex-1 px-6 pt-6 pb-8">
              {/* Back button */}
              <Pressable
                onPress={() => {
                  pendingSignUp.email = "";
                  pendingSignUp.password = "";
                  router.back();
                }}
                className="self-start p-2 -ml-2 mb-8 active:opacity-60"
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </Pressable>

              {/* Header */}
              <View className="mb-10">
                <Text className="text-4xl font-bold text-white mb-3">
                  Check your inbox
                </Text>
                <Text className="text-secondaryDark text-base leading-relaxed">
                  We sent a 6-digit code to{" "}
                  <Text className="text-accentBlue">{redactEmail(email)}</Text>.
                  Enter it below to verify your email.
                </Text>
              </View>

              {/* Code input */}
              <View className="mb-2">
                <Text className="text-textDark text-sm font-medium mb-2">
                  Verification code
                </Text>
                <TextInput
                  ref={codeInputRef}
                  className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-2xl tracking-widest text-center"
                  placeholder="123456"
                  placeholderTextColor="#8A96B4"
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  value={code}
                  onChangeText={(v) => {
                    setCode(v.replace(/\D/g, ""));
                    setError(null);
                    setResendMessage(null);
                  }}
                  onSubmitEditing={handleVerify}
                  returnKeyType="done"
                />
              </View>

              {error && (
                <Text className="text-red-400 text-sm mb-4">{error}</Text>
              )}
              {resendMessage && (
                <Text className="text-green-400 text-sm mb-4">{resendMessage}</Text>
              )}

              {/* Verify button */}
              <Pressable
                onPress={handleVerify}
                disabled={isVerifying}
                className="rounded-2xl py-4 items-center mb-4 bg-accentBlue active:opacity-80 disabled:opacity-50"
              >
                {isVerifying ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-semibold text-base">
                    Verify & Create Account
                  </Text>
                )}
              </Pressable>

              {/* Resend */}
              <Pressable
                onPress={handleResend}
                disabled={isResending}
                className="items-center py-2 active:opacity-60"
              >
                {isResending ? (
                  <ActivityIndicator color="#4F6EF7" size="small" />
                ) : (
                  <Text className="text-accentBlue text-sm">
                    Didn&apos;t receive it? Resend code
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
