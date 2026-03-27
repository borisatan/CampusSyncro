import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Bell, Clock, Shield, Sun, Sunrise, Zap } from "lucide-react-native";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { persistOnboardingData } from "../(auth)/sign-up";
import { useAnalytics } from "../hooks/useAnalytics";
import { ensureUserProfile } from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { supabase } from "../utils/supabase";

type NotificationFrequency = "once" | "three" | "five";

const FREQUENCY_OPTIONS: {
  id: NotificationFrequency;
  title: string;
  description: string;
  time: string;
  Icon: typeof Sun;
}[] = [
  {
    id: "once",
    title: "Once Daily",
    description: "A gentle daily reminder",
    time: "9:00 AM",
    Icon: Sun,
  },
  {
    id: "three",
    title: "3 Times Daily",
    description: "Stay on track throughout the day",
    time: "9AM, 2PM, 8PM",
    Icon: Sunrise,
  },
  {
    id: "five",
    title: "5 Times Daily",
    description: "Maximum mindfulness",
    time: "Every 3 hours",
    Icon: Zap,
  },
];

export default function NotificationRemindersScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding, setOnboardingDataPersisted } =
    useOnboardingStore();
  const [selected, setSelected] = useState<NotificationFrequency | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(11);
    trackEvent("onboarding_notification_reminders_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleContinue = async () => {
    if (isSubmitting) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    trackEvent("onboarding_screen_completed", {
      screen: "notification_reminders",
      step: 11,
      notification_frequency: selected ?? "skipped",
      time_on_screen_seconds: Math.round(
        (Date.now() - screenEnteredAt.current) / 1000,
      ),
    });
    trackEvent("onboarding_completed");
    setNewOnboardingData({ notificationFrequency: selected });
    completeOnboarding();

    // Check if user is already authenticated (profile-reset flow).
    // If so, persist the onboarding data directly and go to dashboard.
    // If not, send them to sign-up where persistence happens after account creation.
    const { data: { user } } = await supabase.auth.getUser();
    const store = useOnboardingStore.getState();
    if (user && !store.isTestMode) {
      setIsSubmitting(true);
      try {
        setOnboardingDataPersisted();
        await ensureUserProfile(user.id);
        await persistOnboardingData(user.id, store.newOnboardingData);
        await Promise.all([
          useCategoriesStore.getState().loadCategories(),
          useAccountsStore.getState().loadAccounts(),
        ]);
      } catch (e: any) {
        console.error('[NotificationReminders] Failed to persist onboarding data:', e?.message);
      } finally {
        setIsSubmitting(false);
      }
      router.replace("/(tabs)/dashboard");
    } else if (user && store.isTestMode) {
      // Developer test run — sign out so sign-up treats them as a new user
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-up");
    } else {
      router.replace("/(auth)/sign-up");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(10);
    router.push("/(onboarding)/subscription-trial");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={11} totalSteps={11} />
            <View style={{ width: 36 }} />
          </View>
        </View>

        <View className="flex-1 px-4 pb-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
          >
            {/* Bell hero */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 100, duration: 600 }}
              className="items-center mb-6"
            >
              <View style={{ position: "relative" }}>
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#3B7EFF" }}
                >
                  <Bell size={36} color="#ffffff" />
                </View>
                <View
                  className="absolute w-6 h-6 rounded-full items-center justify-center"
                  style={{
                    top: -2,
                    right: -2,
                    backgroundColor: "#22D97A",
                  }}
                >
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 12,
                      fontWeight: "700",
                      lineHeight: 14,
                    }}
                  >
                    ✦
                  </Text>
                </View>
              </View>
            </MotiView>

            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-2"
            >
              <Text className="text-3xl text-white text-center font-semibold leading-tight">
                Stay on track with{" "}
                <Text style={{ color: "#3B7EFF" }}>gentle</Text>
                {"\n"}reminders
              </Text>
            </MotiView>

            {/* Subtitle */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 300, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-secondaryDark text-center text-base">
                How often would you like us to check in?
              </Text>
            </MotiView>

            {/* Frequency options */}
            <View style={{ gap: 12 }} className="mb-6">
              {FREQUENCY_OPTIONS.map((option, index) => {
                const Icon = option.Icon;
                const isSelected = selected === option.id;
                return (
                  <MotiView
                    key={option.id}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 400 + index * 100, duration: 500 }}
                  >
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelected(isSelected ? null : option.id);
                      }}
                      android_ripple={{ color: "rgba(59, 126, 255, 0.1)" }}
                      className="active:opacity-80"
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 16,
                          padding: 16,
                          borderRadius: 24,
                          borderWidth: 1,
                          borderColor: isSelected ? "#3B7EFF" : "#1E293B",
                          backgroundColor: isSelected
                            ? "rgba(59, 126, 255, 0.08)"
                            : "#111827",
                        }}
                      >
                        {/* Icon */}
                        <View
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                            overflow: "hidden",
                          }}
                        >
                          <LinearGradient
                            colors={
                              isSelected
                                ? ["#1E40AF", "#3B7EFF"]
                                : ["#1A2235", "#1E293B"]
                            }
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{
                              width: "100%",
                              height: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon
                              size={22}
                              color={isSelected ? "#ffffff" : "#8A96B4"}
                            />
                          </LinearGradient>
                        </View>

                        {/* Text */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#ffffff",
                              fontSize: 15,
                              fontWeight: "600",
                              marginBottom: 2,
                            }}
                          >
                            {option.title}
                          </Text>
                          <Text
                            style={{
                              color: "#8A96B4",
                              fontSize: 13,
                              marginBottom: 4,
                            }}
                          >
                            {option.description}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={12} color="#8A96B4" />
                            <Text style={{ color: "#8A96B4", fontSize: 12 }}>
                              {option.time}
                            </Text>
                          </View>
                        </View>

                        {/* Check */}
                        {isSelected && (
                          <View
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: 11,
                              backgroundColor: "#3B7EFF",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              ✓
                            </Text>
                          </View>
                        )}
                      </View>
                    </Pressable>
                  </MotiView>
                );
              })}
            </View>

            {/* Info card */}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 600 }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: 16,
                  borderRadius: 24,
                  backgroundColor: "rgba(59, 126, 255, 0.08)",
                  borderWidth: 1,
                  borderColor: "rgba(59, 126, 255, 0.2)",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(59, 126, 255, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                  }}
                >
                  <Shield size={18} color="#3B7EFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontWeight: "600",
                      marginBottom: 4,
                      fontSize: 14,
                    }}
                  >
                    You're in control
                  </Text>
                  <Text
                    style={{ color: "#8A96B4", fontSize: 13, lineHeight: 19 }}
                  >
                    You can adjust notification settings anytime from your
                    profile. We'll send gentle nudges to help you stay mindful
                    of your spending.
                  </Text>
                </View>
              </View>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>

      {/* CTA - fixed at bottom */}
      <View className="px-4 pb-10 pt-2">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 900, duration: 500 }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={isSubmitting}
            className="w-full py-5 rounded-3xl active:opacity-80"
            style={{ backgroundColor: "#3B7EFF", opacity: isSubmitting ? 0.7 : 1 }}
            android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 18,
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              {isSubmitting ? "Saving…" : selected ? "Continue" : "Skip for Now"}
            </Text>
          </Pressable>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}
