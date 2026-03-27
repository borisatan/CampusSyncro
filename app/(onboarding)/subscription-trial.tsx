import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Calendar, CreditCard, Mail } from "lucide-react-native";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

type BillingPeriod = "weekly" | "monthly" | "annual";

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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("annual");
  const [weeklyPackage, setWeeklyPackage] = useState<PurchasesPackage | null>(null);
  const [monthlyPackage, setMonthlyPackage] = useState<PurchasesPackage | null>(null);
  const [annualPackage, setAnnualPackage] = useState<PurchasesPackage | null>(null);
  const [offeringsLoaded, setOfferingsLoaded] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(10);
    trackEvent("onboarding_subscription_trial_viewed");
    loadOfferings();
  }, [setOnboardingStep, trackEvent]);

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      const current = offerings.current;
      if (current) {
        const weekly = current.weekly ?? current.availablePackages.find(
          (p) => p.packageType === "WEEKLY"
        ) ?? null;
        const monthly = current.monthly ?? current.availablePackages.find(
          (p) => p.packageType === "MONTHLY"
        ) ?? null;
        const annual = current.annual ?? current.availablePackages.find(
          (p) => p.packageType === "ANNUAL"
        ) ?? null;
        setWeeklyPackage(weekly);
        setMonthlyPackage(monthly);
        setAnnualPackage(annual);
      }
    } catch (e) {
      console.error("[SubscriptionTrial] Failed to load offerings:", e);
    } finally {
      setOfferingsLoaded(true);
    }
  };

  // Price helpers — fall back to hardcoded values if offerings not loaded
  const weeklyPrice = weeklyPackage?.product.priceString ?? "$3.99";
  const monthlyPrice = monthlyPackage?.product.priceString ?? "$9.99";
  const annualTotalPrice = annualPackage?.product.priceString ?? "$79.99";
  const annualMonthlyPrice = annualPackage
    ? `$${(annualPackage.product.price / 12).toFixed(2)}/month`
    : "$6.67/month";

  // Savings badge: difference between paying monthly for 12 months vs annual
  const annualSavings = (() => {
    if (monthlyPackage && annualPackage) {
      const saved = monthlyPackage.product.price * 12 - annualPackage.product.price;
      if (saved > 0) return `Save $${saved.toFixed(2)}`;
    }
    return "Save 33%";
  })();

  const handleComplete = async () => {
    const selectedPackage =
      billingPeriod === "weekly" ? weeklyPackage :
      billingPeriod === "monthly" ? monthlyPackage :
      annualPackage;

    if (!selectedPackage) {
      Alert.alert("Not ready", "Please wait a moment and try again.");
      return;
    }

    try {
      setIsPurchasing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { customerInfo } = await Purchases.purchasePackage(selectedPackage);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const timeOnScreen = Math.round((Date.now() - screenEnteredAt.current) / 1000);
      trackEvent("onboarding_screen_completed", {
        screen: "subscription_trial",
        step: 10,
        billing_period: billingPeriod,
        time_on_screen_seconds: timeOnScreen,
      });
      trackEvent("trial_started", {
        billing_period: billingPeriod,
        product_id: selectedPackage.product.identifier,
      });

      setNewOnboardingData({ selectedBillingPeriod: billingPeriod === "weekly" ? "monthly" : billingPeriod });
      setOnboardingStep(11);
      router.push("/(onboarding)/notification-reminders");
    } catch (e: any) {
      if (e?.userCancelled) return;
      console.error("[SubscriptionTrial] Purchase failed:", e);
      Alert.alert("Purchase failed", e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active["premium"]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        trackEvent("purchases_restored");
        setNewOnboardingData({ selectedBillingPeriod: billingPeriod === "weekly" ? "monthly" : billingPeriod });
        setOnboardingStep(11);
        router.push("/(onboarding)/notification-reminders");
      } else {
        Alert.alert("No active subscription found", "We couldn't find a previous purchase to restore.");
      }
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? "Something went wrong.");
    }
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

  const plans: Array<{
    key: BillingPeriod;
    label: string;
    price: string;
    subtitle?: string;
    badge?: string;
  }> = [
    {
      key: "annual",
      label: "Yearly",
      price: annualTotalPrice,
      subtitle: `(${annualMonthlyPrice})`,
      badge: `Best value · ${annualSavings}`,
    },
    {
      key: "monthly",
      label: "Monthly",
      price: monthlyPrice,
    },
    {
      key: "weekly",
      label: "Weekly",
      price: weeklyPrice,
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={10} totalSteps={11} />
            {__DEV__ ? (
              <Pressable onPress={handleSkip} className="active:opacity-60">
                <Text className="text-red-400 text-sm font-medium">Skip (Dev)</Text>
              </Pressable>
            ) : (
              <View className="w-10" />
            )}
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

            {/* Plan selector */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 600 }}
              className="mb-6 gap-3"
            >
              {!offeringsLoaded ? (
                <ActivityIndicator color="#ffffff" className="py-8" />
              ) : (
                plans.map((plan) => {
                  const isSelected = billingPeriod === plan.key;
                  return (
                    <Pressable
                      key={plan.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBillingPeriod(plan.key);
                      }}
                      className="active:opacity-80"
                    >
                      <View
                        className={`rounded-2xl border overflow-hidden ${
                          isSelected ? "border-accentBlue bg-accentBlue/10" : "border-borderDark bg-surfaceDark"
                        }`}
                      >
                        {/* Best value badge */}
                        {plan.badge && (
                          <View className="bg-accentBlue px-4 py-1.5">
                            <Text className="text-white text-xs font-semibold text-center tracking-wide">
                              {plan.badge}
                            </Text>
                          </View>
                        )}

                        <View className="flex-row items-center px-4 py-4 gap-4">
                          {/* Radio button */}
                          <View
                            className={`w-5 h-5 rounded-full border-2 items-center justify-center ${
                              isSelected ? "border-accentBlue" : "border-borderDark"
                            }`}
                          >
                            {isSelected && (
                              <View className="w-2.5 h-2.5 rounded-full bg-accentBlue" />
                            )}
                          </View>

                          {/* Plan info */}
                          <View className="flex-1">
                            <Text className="text-white font-semibold text-base">
                              {plan.label}
                            </Text>
                            {plan.subtitle && (
                              <Text className="text-secondaryDark text-sm mt-0.5">
                                {plan.subtitle}
                              </Text>
                            )}
                          </View>

                          {/* Price */}
                          <Text className={`font-semibold text-base ${isSelected ? "text-white" : "text-secondaryDark"}`}>
                            {plan.price}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })
              )}
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
                disabled={isPurchasing || !offeringsLoaded}
                className="w-full py-5 rounded-3xl bg-accentBlue active:opacity-80 disabled:opacity-50"
                android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white text-lg text-center font-semibold">
                    Begin 14-Day Free Trial
                  </Text>
                )}
              </Pressable>
            </MotiView>

            {/* Footer */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1100, duration: 600 }}
            >
              <Text className="text-secondaryDark text-sm text-center mb-3">
                Cancel anytime. No hidden fees.
              </Text>
              <Pressable onPress={handleRestore} className="active:opacity-60">
                <Text className="text-accentBlue text-xs text-center">
                  Restore purchases
                </Text>
              </Pressable>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
