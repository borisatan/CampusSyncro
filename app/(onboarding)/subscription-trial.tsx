import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Calendar, ChevronLeft, CreditCard, Mail } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

const TIMELINE_ITEMS = [
  {
    icon: Calendar,
    label: "Today",
    description: "Your conscious journey begins",
  },
  {
    icon: Mail,
    label: "Day 12",
    description: "Reminder email",
  },
  {
    icon: CreditCard,
    label: "Day 14",
    description: "Trial ends, subscription begins",
  },
];

export default function SubscriptionTrialScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding } =
    useOnboardingStore();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "annual",
  );
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(10);
    trackEvent("onboarding_subscription_trial_viewed");
  }, [setOnboardingStep, trackEvent]);

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const timeOnScreen = Math.round((Date.now() - screenEnteredAt.current) / 1000);
    trackEvent("onboarding_screen_completed", {
      screen: "subscription_trial",
      step: 10,
      billing_period: billingPeriod,
      time_on_screen_seconds: timeOnScreen,
    });
    trackEvent("trial_started", { billing_period: billingPeriod });
    setNewOnboardingData({ selectedBillingPeriod: billingPeriod });
    setOnboardingStep(11);
    router.push("/(onboarding)/notification-reminders");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(9);
    router.push("/(onboarding)/practice-entry");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "subscription_trial",
      step: 10,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  const monthlyPrice = 9.99;
  const annualPrice = 79.99;
  const annualMonthlyPrice = (annualPrice / 12).toFixed(2);

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center gap-1 active:opacity-60"
            >
              <ChevronLeft size={20} color="#8A96B4" />
              <Text className="text-secondaryDark text-sm">Back</Text>
            </Pressable>
            <Pressable
              onPress={handleSkip}
              className="active:opacity-60"
            >
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
          <View className="items-center">
            <View className="h-2 bg-surfaceDark rounded-full overflow-hidden" style={{ width: '33%' }}>
              <MotiView
                from={{ width: "96.4%" }}
                animate={{ width: "100%" }}
                transition={{ type: "timing", duration: 500 }}
                className="h-full overflow-hidden relative"
              >
                <LinearGradient
                  colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={{ width: "100%", height: "100%" }}
                />
                <MotiView
                  from={{ translateX: -200 }}
                  animate={{ translateX: 200 }}
                  transition={{
                    type: "timing",
                    duration: 3000,
                    loop: true,
                    delay: 1500,
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: 100,
                  }}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255, 255, 255, 0)",
                      "rgba(255, 255, 255, 0.3)",
                      "rgba(255, 255, 255, 0)",
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%", height: "100%" }}
                  />
                </MotiView>
              </MotiView>
            </View>
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
          >
            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-3xl text-white text-center leading-tight mb-2">
                Start your journey to financial{" "}
                <Text className="text-accentGreen">peace</Text>
              </Text>
            </MotiView>

            {/* Timeline */}
            <View className="space-y-4 mb-8">
              {TIMELINE_ITEMS.map((item, index) => {
                const Icon = item.icon;
                return (
                  <MotiView
                    key={index}
                    from={{ opacity: 0, translateX: -20 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{ delay: 400 + index * 100, duration: 600 }}
                  >
                    <View className="flex-row items-start gap-4">
                      <View className="w-10 h-10 rounded-full bg-accentBlue items-center justify-center">
                        <Icon size={20} color="#ffffff" />
                      </View>
                      <View className="flex-1 pt-1">
                        <Text className="text-white font-medium mb-1">
                          {item.label}
                        </Text>
                        <Text className="text-secondaryDark text-sm">
                          {item.description}
                        </Text>
                      </View>
                    </View>
                    {index < TIMELINE_ITEMS.length - 1 && (
                      <View className="w-10 items-center py-2">
                        <View className="w-0.5 h-6 bg-accentBlue/30" />
                      </View>
                    )}
                  </MotiView>
                );
              })}
            </View>

            {/* Pricing Toggle */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 600 }}
              className="mb-6"
            >
              <View className="bg-surfaceDark rounded-xl p-1.5 border border-borderDark flex-row">
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBillingPeriod("monthly");
                  }}
                  className={`flex-1 py-3 rounded-xl ${
                    billingPeriod === "monthly"
                      ? "bg-accentBlue"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      billingPeriod === "monthly"
                        ? "text-white"
                        : "text-secondaryDark"
                    }`}
                  >
                    Monthly
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBillingPeriod("annual");
                  }}
                  className={`flex-1 py-3 rounded-xl ${
                    billingPeriod === "annual"
                      ? "bg-accentBlue"
                      : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-center font-medium ${
                      billingPeriod === "annual"
                        ? "text-white"
                        : "text-secondaryDark"
                    }`}
                  >
                    Annual
                  </Text>
                </Pressable>
              </View>
            </MotiView>

            {/* Pricing Display */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 900, duration: 600 }}
              className="mb-6"
            >
              <View className="bg-surfaceDark border border-borderDark rounded-xl p-6">
                <View className="items-center">
                  <Text className="text-5xl text-white font-bold mb-2">
                    $
                    {billingPeriod === "monthly"
                      ? monthlyPrice
                      : annualMonthlyPrice}
                  </Text>
                  <Text className="text-secondaryDark text-lg">per month</Text>
                  {billingPeriod === "annual" && (
                    <View className="mt-4 px-4 py-2 rounded-full bg-accentGreen/20">
                      <Text className="text-accentGreen text-sm font-medium">
                        Save 33% • ${annualPrice}/year
                      </Text>
                    </View>
                  )}
                  {billingPeriod === "monthly" && (
                    <Text className="text-secondaryDark text-sm mt-4">
                      Billed monthly
                    </Text>
                  )}
                </View>
              </View>
            </MotiView>

            {/* Primary CTA */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1000, duration: 500 }}
              className="mb-4"
            >
              <Pressable
                onPress={handleComplete}
                className="w-full py-5 rounded-xl bg-accentBlue active:opacity-80"
                android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
              >
                <Text className="text-white text-lg text-center font-semibold">
                  Begin 14-Day Free Trial
                </Text>
              </Pressable>
            </MotiView>

            {/* Footer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1100, duration: 600 }}
            >
              <Text className="text-secondaryDark text-sm text-center">
                Cancel anytime. No hidden fees.
              </Text>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
