import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Brain, Hand, Zap } from "lucide-react-native";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function WhyManualScreen() {
  const { setOnboardingStep, completeOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  // Pulsing glow animation for "Choice Point" card
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    setOnboardingStep(8);
    trackEvent("onboarding_why_manual_viewed");

    // Start pulsing animation
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 3000 }),
      -1,
      true,
    );
  }, [glowOpacity, setOnboardingStep]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "why_manual",
      step: 8,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(9);
    router.push("/(onboarding)/practice-entry");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push("/(onboarding)/budget-setup-choice");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "why_manual",
      step: 8,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={8} totalSteps={11} />
            <Pressable onPress={handleSkip} className="active:opacity-60">
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
            className="flex-1"
          >
            {/* Headline */}
            <View className="text-center mb-8">
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200, duration: 600 }}
              >
                <Text className="text-3xl text-white text-center leading-tight">
                  Awareness starts at the{" "}
                  <Text style={{ color: "#8B5CF6" }}>source</Text>.
                </Text>
              </MotiView>
            </View>

            {/* Philosophy Content */}
            <View className="mb-8">
              {/* Automation Card */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-6">
                  <View className="flex-row gap-4">
                    <View className="w-12 h-12 rounded-xl bg-inputDark items-center justify-center">
                      <Zap size={24} color="#8A96B4" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white mb-2 text-lg font-medium">
                        Automation is{" "}
                        <Text style={{ color: "#8B5CF6" }}>forgettable</Text>
                      </Text>
                      <Text className="text-secondaryDark text-sm leading-relaxed">
                        Automated apps turn your financial life into a
                        &ldquo;black box&rdquo; where numbers move in the
                        background, stripping away the emotional weight of every
                        dollar lost.
                      </Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Choice Point Card with Pulsing Glow */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600, duration: 600 }}
                className="mb-6"
              >
                <View className="relative rounded-xl overflow-hidden">
                  {/* Gradient background with pulsing glow */}
                  <LinearGradient
                    colors={["#0F172A", "#1E3A8A", "#0C1E3D"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: "absolute", inset: 0 }}
                  />
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        inset: 0,
                        backgroundColor: "#1E3A8A",
                      },
                      glowStyle,
                    ]}
                  />

                  <View className="border border-accentBlue rounded-xl p-6 relative">
                    <View className="flex-row gap-4">
                      <View className="w-12 h-12 rounded-xl overflow-hidden items-center justify-center">
                        <LinearGradient
                          colors={["#60A5FA", "#3B82F6", "#2563EB"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{
                            width: "100%",
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Hand size={24} color="#ffffff" />
                        </LinearGradient>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white mb-2 text-lg font-medium">
                          The Act of{" "}
                          <Text style={{ color: "#60A5FA" }}>Intent</Text>
                        </Text>
                        <Text className="text-textDark text-sm leading-relaxed">
                          Every time you manually log a transaction, you force
                          your brain to acknowledge the tangible impact of your
                          spending on your long-term goals.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Brain Science Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 800, duration: 600 }}
              >
                <View className="bg-surfaceDark/50 border border-borderDark rounded-xl p-5">
                  <View className="flex-row items-start gap-3">
                    <Brain size={20} color="#3B7EFF" style={{ marginTop: 2 }} />
                    <Text className="text-secondaryDark text-xs leading-relaxed flex-1">
                      Research shows that the act of recording a transaction
                      manually increases financial mindfulness by up to 43%
                      compared to automated tracking.
                    </Text>
                  </View>
                </View>
              </MotiView>
            </View>

            {/* Continue Button */}
            <AnimatedGradientButton
              onPress={handleNext}
              text="Try a practice entry"
              delay={1000}
              rounded="xl"
            />
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
