import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useRef, useState } from "react";
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
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { supabase } from "../utils/supabase";

type Phase = "email" | "code";

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || local.length < 2) return email;
  return `${local[0]}${"*".repeat(Math.max(local.length - 1, 2))}@${domain}`;
}

export default function FoundingAccessScreen() {
  const { setNewOnboardingData, setOnboardingStep } = useOnboardingStore();

  const [phase, setPhase] = useState<Phase>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const codeInputRef = useRef<TextInput>(null);

  const handleBack = () => {
    if (phase === "code") {
      setPhase("email");
      setError(null);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(10);
    router.back();
  };

  const handleSendCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { error: fnError } = await supabase.functions.invoke("send-founding-otp", {
        body: { email: trimmedEmail },
      });

      if (fnError) throw fnError;

      // Always transition to code phase (vague response protects the list)
      setPhase("code");
      setTimeout(() => codeInputRef.current?.focus(), 300);
    } catch (e: any) {
      setError("Something went wrong. Please try again.");
      console.error("[FoundingAccess] send-founding-otp error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-founding-otp", {
        body: { email: email.trim().toLowerCase(), code: trimmedCode },
      });

      if (fnError) throw fnError;

      if (data?.valid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setNewOnboardingData({ foundingMemberEmail: email.trim().toLowerCase() });
        setOnboardingStep(11);
        router.push("/(onboarding)/notification-reminders");
      } else {
        setError(data?.error ?? "Invalid or expired code. Please try again.");
      }
    } catch (e: any) {
      setError("Invalid or expired code. Please try again.");
      console.error("[FoundingAccess] verify-founding-otp error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCode("");
    setError(null);
    setPhase("email");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          {/* Header */}
          <View className="px-2 pt-12 pb-4">
            <View className="flex-row items-center">
              <OnboardingBackButton onPress={handleBack} />
            </View>
          </View>

          <View className="flex-1 px-6 py-8 pt-4">
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 500 }}
            >
              {/* Headline */}
              <View className="mb-8">
                <Text className="text-3xl text-white font-bold leading-tight mb-3">
                  {phase === "email" ? "Founding Member Access" : "Check your inbox"}
                </Text>
                <Text className="text-secondaryDark text-base leading-relaxed">
                  {phase === "email"
                    ? "Enter the email you used to join the waitlist. We'll send you a verification code."
                    : `We sent a 6-digit code to ${redactEmail(email.trim())}. Enter it below to claim your free lifetime access.`}
                </Text>
              </View>

              {phase === "email" ? (
                <MotiView
                  key="email-phase"
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 400 }}
                >
                  {/* Email input */}
                  <View className="mb-6">
                    <Text className="text-textDark text-sm font-medium mb-2">
                      Waitlist email
                    </Text>
                    <TextInput
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base"
                      placeholder="you@example.com"
                      placeholderTextColor="#8A96B4"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      value={email}
                      onChangeText={(v) => {
                        setEmail(v);
                        setError(null);
                      }}
                      onSubmitEditing={handleSendCode}
                      returnKeyType="send"
                    />
                  </View>

                  {error && (
                    <Text className="text-red-400 text-sm mb-4 -mt-2">{error}</Text>
                  )}

                  <Pressable
                    onPress={handleSendCode}
                    disabled={isLoading}
                    className="w-full py-5 rounded-3xl bg-accentBlue active:opacity-80 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white text-lg text-center font-semibold">
                        Send Code
                      </Text>
                    )}
                  </Pressable>
                </MotiView>
              ) : (
                <MotiView
                  key="code-phase"
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 400 }}
                >
                  {/* Code input */}
                  <View className="mb-6">
                    <Text className="text-textDark text-sm font-medium mb-2">
                      Verification code
                    </Text>
                    <TextInput
                      ref={codeInputRef}
                      className="bg-inputDark text-textDark px-4 py-4 rounded-xl border border-borderDark text-base tracking-widest"
                      placeholder="123456"
                      placeholderTextColor="#8A96B4"
                      keyboardType="number-pad"
                      maxLength={6}
                      value={code}
                      onChangeText={(v) => {
                        setCode(v.replace(/\D/g, ""));
                        setError(null);
                      }}
                      onSubmitEditing={handleVerifyCode}
                      returnKeyType="done"
                    />
                  </View>

                  {error && (
                    <Text className="text-red-400 text-sm mb-4 -mt-2">{error}</Text>
                  )}

                  <Pressable
                    onPress={handleVerifyCode}
                    disabled={isLoading}
                    className="w-full py-5 rounded-3xl bg-accentBlue active:opacity-80 disabled:opacity-50 mb-4"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <Text className="text-white text-lg text-center font-semibold">
                        Verify &amp; Claim Access
                      </Text>
                    )}
                  </Pressable>

                  <Pressable onPress={handleResend} className="active:opacity-60">
                    <Text className="text-accentBlue text-sm text-center">
                      Didn&apos;t receive it? Try a different email
                    </Text>
                  </Pressable>
                </MotiView>
              )}
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
