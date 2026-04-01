import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef } from "react";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { useAnalytics } from "../hooks/useAnalytics";
import { useOnboardingStore } from "../store/useOnboardingStore";

// Particles: money escaping the wallet
const PARTICLES = [
  { x: -36, size: 4, duration: 2200, delay: 400, alpha: 0.7 },
  { x: 24, size: 3, duration: 2800, delay: 800, alpha: 0.5 },
  { x: -16, size: 5, duration: 2500, delay: 1200, alpha: 0.6 },
  { x: 42, size: 3, duration: 3000, delay: 600, alpha: 0.45 },
  { x: -52, size: 4, duration: 2400, delay: 1000, alpha: 0.65 },
  { x: 58, size: 3, duration: 2700, delay: 300, alpha: 0.5 },
  { x: 10, size: 4, duration: 2600, delay: 1400, alpha: 0.55 },
];

function FloatingParticle({
  x,
  size,
  duration,
  delay,
  alpha,
}: {
  x: number;
  size: number;
  duration: number;
  delay: number;
  alpha: number;
}) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-140, { duration }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(alpha, { duration: 500 }),
          withTiming(alpha, { duration: duration - 900 }),
          withTiming(0, { duration: 400 }),
          withTiming(0, { duration: 100 })
        ),
        -1,
        false
      )
    );
    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(242, 81, 74, 0.9)",
          bottom: 20,
          left: "50%",
          marginLeft: x - size / 2,
        },
        animStyle,
      ]}
    />
  );
}

function GlowRing({
  size,
  delay,
  duration,
}: {
  size: number;
  delay: number;
  duration: number;
}) {
  const scale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.2);

  useEffect(() => {
    scale.value = withDelay(delay, withRepeat(withTiming(1.22, { duration }), -1, true));
    ringOpacity.value = withDelay(delay, withRepeat(withTiming(0.6, { duration }), -1, true));
    return () => {
      cancelAnimation(scale);
      cancelAnimation(ringOpacity);
    };
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: "#F2514A",
        },
        animStyle,
      ]}
    />
  );
}

function DividerLine() {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(550, withTiming(150, { duration: 700 }));
    return () => cancelAnimation(width);
  }, []);

  const style = useAnimatedStyle(() => ({ width: width.value }));

  return (
    <Animated.View
      style={[
        {
          height: 1,
          backgroundColor: "rgba(255,255,255,0.1)",
          alignSelf: "center",
          marginVertical: 20,
        },
        style,
      ]}
    />
  );
}

export default function WelcomeScreen() {
  const { setOnboardingStep, completeOnboarding } = useOnboardingStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());

  useEffect(() => {
    setOnboardingStep(1);
    trackEvent("onboarding_welcome_viewed");
  }, [setOnboardingStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "welcome",
      step: 1,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    setOnboardingStep(2);
    router.push("/(onboarding)/category-preselection");
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_skipped", {
      screen: "welcome",
      step: 1,
      time_on_screen_seconds: Math.round((Date.now() - screenEnteredAt.current) / 1000),
    });
    completeOnboarding();
    router.replace("/(auth)/sign-up");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}>
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between">
            <View style={{ width: 36 }} />
            <OnboardingProgressDots currentStep={1} totalSteps={11} />
            <Pressable onPress={handleSkip} className="active:opacity-60">
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
        </View>

        {/* Hero: Wallet + Glow + Particles */}
        {/* <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 500 }}
          style={{ alignItems: "center", marginTop: 20 }}
        >
          <View
            style={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: 160,
              backgroundColor: "rgba(242, 81, 74, 0.055)",
              top: -60,
              alignSelf: "center",
            }}
          />
          <View
            style={{
              position: "absolute",
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: "rgba(242, 81, 74, 0.05)",
              top: -10,
              alignSelf: "center",
            }}
          />

          <View style={{ width: 220, height: 180, alignItems: "center", justifyContent: "center" }}>
            <GlowRing size={180} delay={400} duration={2100} />
            <GlowRing size={120} delay={200} duration={1600} />

            {PARTICLES.map((p, i) => (
              <FloatingParticle key={i} {...p} />
            ))}

            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 200, duration: 800, type: "spring" }}
            >
              <Image
                source={require("../../assets/pictures/wallet.png")}
                style={{ width: 80, height: 80 }}
                resizeMode="contain"
              />
            </MotiView>
          </View>
        </MotiView> */}

        {/* Text Content */}
        <View style={{ flex: 1, paddingHorizontal: 20, marginTop: 60, justifyContent: "space-between" }}>
          {/* Top: headlines + sub-headline */}
          <View>
            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400, duration: 700 }}
            >
              <Text
                style={{
                  fontSize: 36,
                  color: "#EDF0FA",
                  textAlign: "center",
                  fontWeight: "700",
                  lineHeight: 46,
                }}
              >
                Stop watching your money{" "}
                <Text
                  style={{
                    color: "#F2514A",
                    textShadowColor: "rgba(242, 81, 74, 0.55)",
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 16,
                  }}
                >
                  leave
                </Text>
                .
              </Text>
            </MotiView>

            {/* Animated divider line */}
            <DividerLine />

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 650, duration: 700 }}
            >
              <Text
                style={{
                  fontSize: 36,
                  color: "#EDF0FA",
                  textAlign: "center",
                  fontWeight: "700",
                  lineHeight: 46,
                }}
              >
                Start deciding where it{" "}
                <Text
                  style={{
                    color: "#22D97A",
                    textShadowColor: "rgba(34, 217, 122, 0.5)",
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 16,
                  }}
                >
                  goes
                </Text>
                .
              </Text>
            </MotiView>

          </View>

          {/* Bottom: button + footer */}
          <View style={{ paddingBottom: 16 }}>
            {/* Sub-headline */}
            <MotiView
              from={{ opacity: 0, translateY: 16 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 900, duration: 700 }}
              style={{ marginBottom: 28 }}
            >
              <Text className="text-secondaryDark text-lg italic text-center px-6">
                Mastery begins with awareness.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1200, duration: 600 }}
              style={{ marginBottom: 16 }}
            >
              <AnimatedGradientButton
                onPress={handleNext}
                text="Begin your journey"
                rounded="3xl"
              />
            </MotiView>

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1400, duration: 800 }}
            >
              <Text className="text-secondaryDark text-xs text-center tracking-widest uppercase">
                A mindful approach to money
              </Text>
            </MotiView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
