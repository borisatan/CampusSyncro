import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, PieChart, TrendingUp, Wallet, ShieldCheck } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  NativeModules,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import Purchases, { PurchasesPackage } from "react-native-purchases";

const isRevenueCatAvailable = !!NativeModules.RNPurchases;
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

type BillingPeriod = "weekly" | "monthly" | "annual";

const FEATURES = [
  {
    icon: Check,
    title: "Instant transaction tracking",
    subtitle: "Log income and expenses in seconds",
    bg: "#1D4ED8",
  },
  {
    icon: PieChart,
    title: "Budgets that keep you honest",
    subtitle: "Set limits by category",
    bg: "#15803D",
  },
  {
    icon: TrendingUp,
    title: "Spending Insights that surprise",
    subtitle: "Visual breakdowns reveal patterns you never noticed",
    bg: "#7C3AED",
  },
  {
    icon: Wallet,
    title: "All your accounts, one view",
    subtitle: "Net worth and balances always at a glance",
    bg: "#BE185D",
  },
];

export default function SubscriptionTrialScreen() {
  const { setOnboardingStep, setNewOnboardingData, completeOnboarding, hasCompletedOnboarding } =
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
    setOnboardingStep(11);
    trackEvent("onboarding_subscription_trial_viewed");
    loadOfferings();
  }, [setOnboardingStep, trackEvent]);

  const loadOfferings = async () => {
    if (!isRevenueCatAvailable) {
      setOfferingsLoaded(true);
      return;
    }
    try {
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      const weekly = packages.find((p) => p.packageType === "WEEKLY") ?? null;
      const monthly = packages.find((p) => p.packageType === "MONTHLY") ?? null;
      const annual = packages.find((p) => p.packageType === "ANNUAL") ?? null;
      setWeeklyPackage(weekly);
      setMonthlyPackage(monthly);
      setAnnualPackage(annual);
    } catch (e) {
      console.error("[SubscriptionTrial] Failed to load offerings:", e);
    } finally {
      setOfferingsLoaded(true);
    }
  };

  const weeklyPrice = weeklyPackage?.product.priceString ?? "$2.99";
  const monthlyPrice = monthlyPackage?.product.priceString ?? "$9.99";
  const annualTotalPrice = annualPackage?.product.priceString ?? "$49.99";
  const annualMonthlyPrice = annualPackage
    ? `$${(annualPackage.product.price / 12).toFixed(2)} / month`
    : "$4.17 / month";

  const annualSavingsPct = (() => {
    if (weeklyPackage && annualPackage) {
      const annualizedWeekly = weeklyPackage.product.price * 52;
      const pct = Math.round(((annualizedWeekly - annualPackage.product.price) / annualizedWeekly) * 100);
      if (pct > 0) return `Save ${pct}%`;
    }
    if (monthlyPackage && annualPackage) {
      const annualizedMonthly = monthlyPackage.product.price * 12;
      const pct = Math.round(((annualizedMonthly - annualPackage.product.price) / annualizedMonthly) * 100);
      if (pct > 0) return `Save ${pct}%`;
    }
    return "Save 67%";
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
        step: 11,
        billing_period: billingPeriod,
        time_on_screen_seconds: timeOnScreen,
      });
      trackEvent("trial_started", {
        billing_period: billingPeriod,
        product_id: selectedPackage.product.identifier,
      });

      setNewOnboardingData({ selectedBillingPeriod: billingPeriod === "weekly" ? "monthly" : billingPeriod });

      const isActive = !!customerInfo.entitlements.active["Monelo Pro"];
      if (isActive) {
        trackEvent("subscription_activated", {
          plan_type: selectedPackage.packageType,
          product_id: selectedPackage.product.identifier,
          price: selectedPackage.product.price,
          currency: selectedPackage.product.currencyCode,
        });
      }
      if (hasCompletedOnboarding && isActive) {
        router.replace("/(tabs)/dashboard");
      } else {
        setOnboardingStep(12);
        router.push("/(onboarding)/budget-setup-choice");
      }
    } catch (e: any) {
      if (e?.userCancelled) {
        trackEvent("subscription_purchase_cancelled", {
          plan_type: selectedPackage?.packageType,
        });
        return;
      }
      console.error("[SubscriptionTrial] Purchase failed:", e);
      trackEvent("subscription_purchase_failed", {
        error_message: String(e?.message ?? e),
        plan_type: selectedPackage?.packageType,
      });
      Alert.alert("Purchase failed", e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active["Monelo Pro"]) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        trackEvent("purchases_restored");
        setNewOnboardingData({ selectedBillingPeriod: billingPeriod === "weekly" ? "monthly" : billingPeriod });
        if (hasCompletedOnboarding) {
          router.replace("/(tabs)/dashboard");
        } else {
          setOnboardingStep(12);
          router.push("/(onboarding)/budget-setup-choice");
        }
      } else {
        Alert.alert("No active subscription found", "We couldn't find a previous purchase to restore.");
      }
    } catch (e: any) {
      Alert.alert("Restore failed", e?.message ?? "Something went wrong.");
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/practice-entry");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "subscription_trial",
      step: 10,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    router.replace("/(onboarding)/budget-setup-choice");
  };

  const plans: Array<{
    key: BillingPeriod;
    label: string;
    price: string;
    perPeriod: string;
    subtitle: string;
    savingsBadge?: string;
    bestValue?: boolean;
  }> = [
    {
      key: "annual",
      label: "Yearly",
      price: annualTotalPrice,
      perPeriod: annualMonthlyPrice,
      subtitle: annualSavingsPct,
      bestValue: true,
    },
    {
      key: "monthly",
      label: "Monthly",
      price: monthlyPrice,
      perPeriod: `${monthlyPrice} / month`,
      subtitle: "Billed monthly",
    },
    {
      key: "weekly",
      label: "Weekly",
      price: weeklyPrice,
      perPeriod: `${weeklyPrice} / week`,
      subtitle: "Billed weekly",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {__DEV__ && (
          <View className="pt-4 px-2">
            <Pressable onPress={handleSkip} className="active:opacity-60 self-end">
              <Text className="text-red-400 text-sm font-medium">Skip (Dev)</Text>
            </Pressable>
          </View>
        )}

        <View className="px-2 pt-4">
          {/* Logo + headline */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ duration: 500 }}
            className="items-center mb-6"
          >
            <Image
              source={require("../../assets/icons/logo-gray-300.png")}
              style={{ width: 72, height: 72, tintColor: "#ffffff" }}
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-white text-center mt-3">
              Unlock Premium
            </Text>
          </MotiView>

          {/* Feature list */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 150, duration: 500 }}
            className="mb-6 rounded-2xl overflow-hidden bg-surfaceDark border border-borderDark"
          >
            {FEATURES.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <View key={index}>
                  <View className="flex-row items-center px-4 py-3.5 gap-3">
                    <View className="w-11 h-11 rounded-xl items-center justify-center" style={{ backgroundColor: feature.bg, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
                      <Icon size={20} color="#ffffff" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-semibold text-sm">
                        {feature.title}
                      </Text>
                      <Text className="text-secondaryDark text-xs mt-0.5">
                        {feature.subtitle}
                      </Text>
                    </View>
                  </View>
                  {index < FEATURES.length - 1 && (
                    <View className="h-px bg-borderDark mx-4" />
                  )}
                </View>
              );
            })}
          </MotiView>

          {/* Plan selector */}
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, duration: 500 }}
            className="gap-3 mb-4"
            pointerEvents="box-none"
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
                      className={`rounded-2xl border px-4 py-4 flex-row items-center gap-3 ${
                        isSelected
                          ? "border-accentBlue bg-accentBlue/10"
                          : "border-borderDark bg-surfaceDark"
                      }`}
                    >
                      {/* Radio */}
                      <View
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                          isSelected ? "border-accentBlue bg-accentBlue" : "border-borderDark"
                        }`}
                      >
                        {isSelected && <Check size={14} color="#ffffff" strokeWidth={3} />}
                      </View>

                      {/* Label + subtitle */}
                      <View className="flex-1">
                        <View className="flex-row items-center gap-2">
                          <Text className="text-white font-semibold text-base">
                            {plan.label}
                          </Text>
                          {plan.bestValue && (
                            <View className="bg-accentGreen/20 px-2 py-0.5 rounded-md">
                              <Text className="text-accentGreen text-xs font-bold tracking-wide">
                                BEST VALUE
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          className={`text-xs mt-0.5 ${
                            plan.bestValue && isSelected ? "text-accentGreen" : "text-secondaryDark"
                          }`}
                        >
                          {plan.subtitle}
                        </Text>
                      </View>

                      {/* Price */}
                      <View className="items-end">
                        <Text className="text-white font-bold text-xl">
                          {plan.price}
                        </Text>
                        <Text className="text-secondaryDark text-xs mt-0.5">
                          {plan.perPeriod}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })
            )}
          </MotiView>

          {/* Trial guarantee box */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 450, duration: 500 }}
            className="mb-5"
          >
            <View className="rounded-2xl border border-borderDark bg-surfaceDark flex-row items-center px-4 py-3.5 gap-3">
              <ShieldCheck size={28} color="#22D97A" />
              <View className="flex-1">
                <Text className="text-white font-semibold text-sm">
                  7-day free trial · Cancel anytime
                </Text>
                <Text className="text-secondaryDark text-xs mt-0.5">
                  You won't be charged until the trial ends.
                </Text>
              </View>
            </View>
          </MotiView>

          {/* CTA */}
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 550, duration: 500 }}
            className="mb-3"
          >
            <Pressable
              onPress={handleComplete}
              disabled={isPurchasing || !offeringsLoaded}
              className="w-full py-5 rounded-3xl bg-accentBlue active:opacity-80 disabled:opacity-50"
              android_ripple={{ color: "rgba(255,255,255,0.1)" }}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-white text-lg text-center font-semibold">
                  Start Free Trial
                </Text>
              )}
            </Pressable>
            <Text className="text-secondaryDark text-xs text-center mt-2">
              {billingPeriod === "annual"
                ? `then ${annualTotalPrice}/yr after 7-day trial`
                : billingPeriod === "monthly"
                ? `then ${monthlyPrice}/mo after 7-day trial`
                : `then ${weeklyPrice}/wk after 7-day trial`}
            </Text>
          </MotiView>

          {/* Footer */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 650, duration: 500 }}
            className="items-center"
          >
            <Text className="text-secondaryDark text-xs text-center mb-4">
              No commitment. Cancel anytime.
            </Text>
            <View className="flex-row items-center gap-3">
              <Pressable onPress={handleRestore} className="active:opacity-60">
                <Text className="text-accentGreen text-xs">Restore Purchases</Text>
              </Pressable>
              <Text className="text-borderDark">|</Text>
              <Pressable
                onPress={() => Linking.openURL("https://trymonelo.app/terms-and-conditions")}
                className="active:opacity-60"
              >
                <Text className="text-accentGreen text-xs">Terms of Use</Text>
              </Pressable>
              <Text className="text-borderDark">|</Text>
              <Pressable
                onPress={() => Linking.openURL("https://trymonelo.app/privacy-policy")}
                className="active:opacity-60"
              >
                <Text className="text-accentGreen text-xs">Privacy Policy</Text>
              </Pressable>
            </View>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
