import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, Text, View } from "react-native";
import { Circle, Svg } from "react-native-svg";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";

const STEPS = [
  "Analyzing your categories",
  "Building your budget",
  "Calculating savings potential",
  "Personalizing your experience",
];

// Phase 1: 0→80% in 3500ms, Phase 2: 80→84% in 2000ms, Phase 3: 84→100% in 800ms = 6300ms total
// Last step fires at 6300 - 500ms (fill duration) = 5800ms so both finish simultaneously
const STEP_TIMES = [1300, 2800, 4400, 5800];

const RING_SIZE = 110;
const STROKE_WIDTH = 7;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STEP_RING_SIZE = 24;
const STEP_STROKE = 2.5;
const STEP_RADIUS = (STEP_RING_SIZE - STEP_STROKE) / 2;
const STEP_CIRCUMFERENCE = 2 * Math.PI * STEP_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function PersonalizingScreen() {
  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false, false]);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const listenerId = progress.addListener(({ value }) => {
      setPercent(Math.round(value * 100));
    });

    // Staggered easing: slow build → crawls at 80-84% → fast sprint to 100%
    Animated.sequence([
      Animated.timing(progress, { toValue: 0.80, duration: 3500, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 0.84, duration: 2000, useNativeDriver: false }),
      Animated.timing(progress, { toValue: 1.0, duration: 800, useNativeDriver: false }),
    ]).start();

    const timers = STEP_TIMES.map((time, index) =>
      setTimeout(() => {
        setCompletedSteps((prev) => {
          const next = [...prev];
          next[index] = true;
          return next;
        });
        if (index === STEP_TIMES.length - 1) {
          // 500ms = step fill duration, 200ms = brief pause before button appears
          setTimeout(() => setShowButton(true), 700);
        }
      }, time)
    );

    return () => {
      progress.removeListener(listenerId);
      timers.forEach(clearTimeout);
    };
  }, []);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(auth)/sign-up?from=onboarding");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace("/(onboarding)/practice-entry");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      {/* Header */}
      <View className="px-2 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <OnboardingBackButton onPress={handleBack} />
          <OnboardingProgressDots currentStep={10} totalSteps={11} />
          <View style={{ width: 36 }} />
        </View>
      </View>

      <View className="flex-1 items-center justify-center px-2">

        {/* Card */}
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500 }}
          style={{
            width: "100%",
            backgroundColor: "#161B2E",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#2A3250",
            padding: 28,
            gap: 36,
          }}
        >

        {/* Ring + title inline row */}
        <View
          style={{ flexDirection: "row", alignItems: "center", gap: 20 }}
        >
          {/* Circular progress ring */}
          <View style={{ width: RING_SIZE, height: RING_SIZE }}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#1C2238"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RADIUS}
                stroke="#22D97A"
                strokeWidth={STROKE_WIDTH}
                fill="none"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <View
              style={{
                position: "absolute",
                width: RING_SIZE,
                height: RING_SIZE,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: "700",
                  color: "#EDF0FA",
                  letterSpacing: -0.5,
                }}
              >
                {percent}%
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: "#EDF0FA",
              flexShrink: 1,
              lineHeight: 32,
            }}
          >
            Personalizing{"\n"}App
          </Text>
        </View>

        {/* Steps checklist */}
        <View style={{ gap: 20 }}>
          {STEPS.map((step, index) => (
            <StepRow key={step} label={step} done={completedSteps[index]} />
          ))}
        </View>

        </MotiView>
      </View>

      {/* Save button */}
      <View style={{ paddingHorizontal: 8, paddingBottom: 16 }}>
        <MotiView
          animate={{ opacity: showButton ? 1 : 0 }}
          transition={{ type: "timing", duration: 350 }}
          pointerEvents={showButton ? "auto" : "none"}
        >
          <Pressable
            onPress={handleSave}
            className="w-full rounded-3xl overflow-hidden active:opacity-80"
            android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
          >
            <LinearGradient
              colors={["#1D4ED8", "#3B7EFF", "#60A5FA"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: "100%", paddingVertical: 16 }}
            >
              <Text className="text-lg text-center font-medium text-white">
                Save my progress
              </Text>
            </LinearGradient>
          </Pressable>
        </MotiView>
      </View>
    </SafeAreaView>
  );
}

function StepRow({ label, done }: { label: string; done: boolean }) {
  const ringProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (done) {
      Animated.timing(ringProgress, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [done]);

  const stepDashoffset = ringProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [STEP_CIRCUMFERENCE, 0],
  });

  return (
    <MotiView
      animate={{ opacity: done ? 1 : 0.4 }}
      transition={{ type: "timing", duration: 400 }}
      style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
    >
      {/* Mini ring indicator */}
      <View style={{ width: STEP_RING_SIZE, height: STEP_RING_SIZE }}>
        <Svg width={STEP_RING_SIZE} height={STEP_RING_SIZE}>
          {/* Track */}
          <Circle
            cx={STEP_RING_SIZE / 2}
            cy={STEP_RING_SIZE / 2}
            r={STEP_RADIUS}
            stroke="#2A3250"
            strokeWidth={STEP_STROKE}
            fill="none"
          />
          {/* Fill arc */}
          <AnimatedCircle
            cx={STEP_RING_SIZE / 2}
            cy={STEP_RING_SIZE / 2}
            r={STEP_RADIUS}
            stroke="#22D97A"
            strokeWidth={STEP_STROKE}
            fill="none"
            strokeDasharray={STEP_CIRCUMFERENCE}
            strokeDashoffset={stepDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${STEP_RING_SIZE / 2}, ${STEP_RING_SIZE / 2}`}
          />
        </Svg>
        {/* Checkmark fades in at center when done */}
        <MotiView
          animate={{ opacity: done ? 1 : 0 }}
          transition={{ type: "timing", duration: 150, delay: 350 }}
          style={{
            position: "absolute",
            width: STEP_RING_SIZE,
            height: STEP_RING_SIZE,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#22D97A", fontSize: 11, fontWeight: "700", lineHeight: 14 }}>
            ✓
          </Text>
        </MotiView>
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: "600",
          color: "#EDF0FA",
        }}
      >
        {label}
      </Text>
    </MotiView>
  );
}
