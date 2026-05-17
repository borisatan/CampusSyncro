import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect } from "react";
import { Pressable, SafeAreaView, Text, View } from "react-native";
import { useAnalytics } from "../hooks/useAnalytics";

export default function TrialNotificationPromiseScreen() {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    trackEvent("onboarding_trial_promise_viewed");
  }, [trackEvent]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_trial_promise_continued");
    router.push("/(onboarding)/subscription-trial");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <View className="flex-1 items-center justify-center px-2">
        {/* Animated bell */}
        <MotiView
          from={{ scale: 1 }}
          animate={{ scale: 1.08 }}
          transition={{
            type: "timing",
            duration: 900,
            loop: true,
            repeatReverse: true,
          }}
        >
          <View
            className="w-28 h-28 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
          >
            <Bell size={56} color="#3B82F6" strokeWidth={1.5} />
          </View>
        </MotiView>

        {/* Copy */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 200 }}
          className="items-center"
        >
          <Text className="text-3xl font-bold text-white text-center mt-8">
            No surprise charges
          </Text>
          <Text className="text-base text-secondaryDark text-center mt-3 leading-relaxed px-4">
            We'll remind you 24 hours before your free trial ends so you're always in control.
          </Text>
        </MotiView>
      </View>

      {/* CTA footer */}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500, delay: 400 }}
        className="px-2 pb-8"
      >
        <Pressable
          onPress={handleContinue}
          className="w-full py-5 rounded-3xl bg-accentBlue active:opacity-80"
          android_ripple={{ color: "rgba(255,255,255,0.1)" }}
        >
          <Text className="text-white text-lg font-semibold text-center">Got it</Text>
        </Pressable>
        <Text className="text-secondaryDark text-xs text-center mt-3">
          Your 7-day free trial starts when you subscribe
        </Text>
      </MotiView>
    </SafeAreaView>
  );
}
