import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Brain, Hand, Zap } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function SolutionActOfIntentScreen() {
  const { setOnboardingStep } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    setOnboardingStep(3);
    trackEvent("onboarding_solution_viewed");

    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 3000 }),
      -1,
      true,
    );

    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [setOnboardingStep, trackEvent]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "solution_act_of_intent",
      step: 3,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(4);
    router.push("/(onboarding)/use-case");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/problem-framing");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <OnboardingBackButton onPress={handleBack} />
            <OnboardingProgressDots currentStep={3} totalSteps={12} />
            <View style={{ width: 36 }} />
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
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-3"
            >
              <Text className="text-3xl text-white text-center leading-tight">
                It takes{" "}
                <Text style={{ color: "#22D97A" }}>3 seconds</Text>.
                {"\n"}That's all.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-secondaryDark text-center text-base leading-relaxed">
                Log it yourself. Own every dollar.
              </Text>
            </MotiView>

            {/* Cards */}
            <View className="mb-8">
              {/* Automation card */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-3xl p-6">
                  <View className="flex-row gap-4">
                    <View className="w-12 h-12 rounded-3xl bg-inputDark items-center justify-center">
                      <Zap size={24} color="#8A96B4" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white mb-2 text-lg font-medium">
                        Automation is{" "}
                        <Text style={{ color: "#8B5CF6" }}>forgettable</Text>
                      </Text>
                      <Text className="text-secondaryDark text-sm leading-relaxed">
                        When apps track automatically, spending becomes invisible — and invisible spending is harder to change.
                      </Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Act of Intent card — highlighted */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600, duration: 600 }}
                className="mb-6"
              >
                <View className="relative rounded-3xl overflow-hidden">
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
                  <View className="border border-accentBlue rounded-3xl p-6 relative">
                    <View className="flex-row gap-4">
                      <View className="w-12 h-12 rounded-3xl overflow-hidden items-center justify-center">
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
                          Logging a transaction manually makes your brain confront the real cost of each purchase.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Stat card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 800, duration: 600 }}
              >
                <View className="bg-surfaceDark/50 border border-borderDark rounded-3xl p-5">
                  <View className="flex-row items-start gap-3">
                    <Brain size={20} color="#3B7EFF" style={{ marginTop: 2 }} />
                    <Text className="text-secondaryDark text-xs leading-relaxed flex-1">
                      Manual tracking increases financial mindfulness by up to 43% compared to automated apps.
                    </Text>
                  </View>
                </View>
              </MotiView>
            </View>

            <AnimatedGradientButton
              onPress={handleNext}
              text="I'm in"
              rounded="3xl"
            />
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
