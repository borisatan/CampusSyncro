import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Check, Flag } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  ClipPath,
  Defs,
  G,
  Line as SvgLine,
  LinearGradient as SvgLinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { AnimatedGradientButton } from "../components/Shared/AnimatedGradientButton";
import { OnboardingBackButton } from "../components/Shared/OnboardingBackButton";
import { OnboardingProgressDots } from "../components/Shared/OnboardingProgressDots";
import { useAnalytics } from "../hooks/useAnalytics";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useOnboardingStore } from "../store/useOnboardingStore";

const USE_CASE_LABELS: Record<string, string> = {
  track:  "Track my spending",
  budget: "Stick to a budget",
  save:   "Save more money",
  goal:   "Save for a goal",
};

// ── Projection chart ─────────────────────────────────────────────────────────

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const CHART_H = 200;
const PAD_T = 12;
const PAD_B = 32;
const PAD_L = 8;
const PAD_R = 56;

function SavingsProjectionChart({
  monthlySavings,
  currencySymbol,
  chartWidth,
}: {
  monthlySavings: number;
  currencySymbol: string;
  chartWidth: number;
}) {
  const clipProgress = useSharedValue(0);

  useEffect(() => {
    clipProgress.value = withTiming(chartWidth, {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
  }, [chartWidth, clipProgress]);

  const animatedProps = useAnimatedProps(() => ({
    width: clipProgress.value,
  }));

  const innerW = chartWidth - PAD_L - PAD_R;
  const innerH = CHART_H - PAD_T - PAD_B;
  const months = 6;
  const maxValue = monthlySavings * months;

  const xFor = (m: number) => PAD_L + (m / months) * innerW;
  const yWithFor = (m: number) =>
    PAD_T + innerH - (monthlySavings * m / maxValue) * innerH;
  const yWithoutFor = (m: number) =>
    PAD_T + innerH - (monthlySavings * m * 0.04 / maxValue) * innerH;

  const pts = Array.from({ length: 7 }, (_, i) => i);

  const withLinePath = pts
    .map((i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yWithFor(i).toFixed(1)}`)
    .join(" ");

  const withoutLinePath = pts
    .map((i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yWithoutFor(i).toFixed(1)}`)
    .join(" ");

  const areaPath =
    withLinePath +
    Array.from({ length: 7 }, (_, i) => months - i)
      .map((i) => ` L ${xFor(i).toFixed(1)} ${yWithoutFor(i).toFixed(1)}`)
      .join("") +
    " Z";

  const formatCompact = (v: number) => {
    if (v >= 1000) return `${currencySymbol}${(v / 1000).toFixed(1)}k`;
    return `${currencySymbol}${Math.round(v)}`;
  };

  const baselineY = (PAD_T + innerH).toFixed(1);

  return (
    <Svg width={chartWidth} height={CHART_H}>
      <Defs>
        <SvgLinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#22D97A" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#22D97A" stopOpacity="0.03" />
        </SvgLinearGradient>
        <ClipPath id="chartClip">
          <AnimatedRect animatedProps={animatedProps} x={0} y={0} height={CHART_H} />
        </ClipPath>
      </Defs>

      <SvgLine
        x1={PAD_L}
        y1={baselineY}
        x2={chartWidth - PAD_R}
        y2={baselineY}
        stroke="#2A3250"
        strokeWidth={1}
      />

      <G clipPath="url(#chartClip)">
        <Path d={areaPath} fill="url(#areaFill)" />
        <Path d={withoutLinePath} stroke="#475569" strokeWidth={1.5} fill="none" strokeDasharray="4 3" />
        <Path d={withLinePath} stroke="#22D97A" strokeWidth={2.5} fill="none" />
      </G>

      <SvgText x={xFor(months) + 6} y={yWithFor(months) + 4} fill="#22D97A" fontSize={12} fontWeight="700">
        {formatCompact(maxValue)}
      </SvgText>
      <SvgText x={xFor(months) + 6} y={yWithoutFor(months) + 4} fill="#475569" fontSize={10}>
        {formatCompact(maxValue * 0.04)}
      </SvgText>

      {["Now", "1m", "2m", "3m", "4m", "5m", "6m"].map((label, i) => (
        <SvgText
          key={label}
          x={xFor(i)}
          y={CHART_H - 8}
          fill="#475569"
          fontSize={11}
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

export default function JourneySummaryScreen() {
  const { setOnboardingStep, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();
  const { trackEvent } = useAnalytics();
  const screenEnteredAt = useRef(Date.now());
  const { width } = useWindowDimensions();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const monthlySavingsPotential = Math.round(monthlyIncome * 0.2);
  const annualSavings = monthlySavingsPotential * 12;
  const goal = newOnboardingData.pendingSavingsGoal;
  const useCaseRaw = newOnboardingData.useCase || "";
  const useCaseIds = useCaseRaw.split(",").map((s) => s.trim()).filter(Boolean);
  const useCaseLabels = useCaseIds.map((id) => USE_CASE_LABELS[id]).filter(Boolean);
  const monthsToGoal =
    goal?.targetAmount && monthlySavingsPotential > 0
      ? Math.ceil(goal.targetAmount / monthlySavingsPotential)
      : null;

  const chartWidth = width - 80;

  useEffect(() => {
    setOnboardingStep(11);
    trackEvent("onboarding_journey_summary_viewed");
  }, [setOnboardingStep, trackEvent]);

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDirection(1);
    setStep((s) => s + 1);
  };

  const goBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) {
      setDirection(-1);
      setStep((s) => s - 1);
    } else {
      router.replace("/(onboarding)/aha-moment-choice");
    }
  };

  const handleFinish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent("onboarding_screen_completed", {
      screen: "journey_summary",
      step: 11,
      time_on_screen_seconds: Math.round(
        (Date.now() - screenEnteredAt.current) / 1000
      ),
    });
    setOnboardingStep(12);
    router.push("/(auth)/sign-up?from=onboarding");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <View className="px-2 pt-12 pb-4">
        <View className="flex-row items-center justify-between">
          <OnboardingBackButton onPress={goBack} />
          <OnboardingProgressDots currentStep={11} totalSteps={12} />
          <View style={{ width: 36 }} />
        </View>
      </View>

      <MotiView
        key={step}
        from={{ opacity: 0, translateX: direction * 36 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ duration: 500, type: "timing" }}
        className="flex-1 px-2"
      >
        {step === 0 && (
          <Step1
            monthlyIncome={monthlyIncome}
            currencySymbol={currencySymbol}
            useCaseLabels={useCaseLabels}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <Step2
            monthlySavingsPotential={monthlySavingsPotential}
            annualSavings={annualSavings}
            currencySymbol={currencySymbol}
            monthsToGoal={monthsToGoal}
            goal={goal}
            useCaseLabels={useCaseLabels}
            chartWidth={chartWidth}
            onFinish={handleFinish}
          />
        )}
      </MotiView>
    </SafeAreaView>
  );
}

// ── Step 1: Starting point ───────────────────────────────────────────────────

function Step1({
  monthlyIncome,
  currencySymbol,
  useCaseLabels,
  onNext,
}: {
  monthlyIncome: number;
  currencySymbol: string;
  useCaseLabels: string[];
  onNext: () => void;
}) {
  return (
    <View className="flex-1 justify-between pb-8">
      <View className="flex-1 justify-center">
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, duration: 800 }}
          className="mb-10"
        >
          <Text className="text-4xl text-white text-center leading-tight">
            Here's where{"\n"}
            <Text style={{ color: "#3B7EFF" }}>you start</Text>.
          </Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 450, duration: 800 }}
          className="mb-8"
        >
          <View className="bg-surfaceDark border border-borderDark rounded-3xl px-8 py-10 items-center">
            <Text
              style={{ color: "#8A96B4", fontSize: 12, fontWeight: "700", letterSpacing: 1.5, marginBottom: 16 }}
            >
              YOUR INCOME
            </Text>
            {monthlyIncome > 0 ? (
              <>
                <Text
                  style={{ color: "#EDF0FA", fontSize: 58, fontWeight: "800", letterSpacing: -1.5, lineHeight: 62 }}
                >
                  {currencySymbol}{monthlyIncome.toLocaleString()}
                </Text>
                <Text style={{ color: "#8A96B4", fontSize: 16, marginTop: 8 }}>per month</Text>
              </>
            ) : (
              <Text style={{ color: "#EDF0FA", fontSize: 22, fontWeight: "600", textAlign: "center" }}>
                Money coming in every month
              </Text>
            )}
            <View
              style={{
                marginTop: 24,
                paddingTop: 18,
                borderTopWidth: 1,
                borderTopColor: "#2A3250",
                width: "100%",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#475569", fontSize: 15 }}>
                <Text style={{ color: "#F59E0B", fontWeight: "600" }}>$0</Text>
                {" "}currently tracked
              </Text>
            </View>
          </View>
        </MotiView>

        {useCaseLabels.length > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: 14 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 800, duration: 800 }}
          >
            <Text
              style={{ color: "#8A96B4", fontSize: 13, textAlign: "center", marginBottom: 12 }}
            >
              Your goals
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {useCaseLabels.map((label) => (
                <View
                  key={label}
                  style={{
                    backgroundColor: "#1C2238",
                    borderWidth: 1,
                    borderColor: "#2A3250",
                    borderRadius: 22,
                    paddingHorizontal: 16,
                    paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: "#EDF0FA", fontSize: 14 }}>{label}</Text>
                </View>
              ))}
            </View>
          </MotiView>
        )}
      </View>

      <TouchableOpacity
        onPress={onNext}
        activeOpacity={0.82}
        style={{
          backgroundColor: "#3B7EFF",
          borderRadius: 20,
          paddingVertical: 18,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#ffffff", fontSize: 18, fontWeight: "600" }}>
          See your potential →
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Step 2: Projection + CTA ─────────────────────────────────────────────────

function Step2({
  monthlySavingsPotential,
  annualSavings,
  currencySymbol,
  monthsToGoal,
  goal,
  useCaseLabels,
  chartWidth,
  onFinish,
}: {
  monthlySavingsPotential: number;
  annualSavings: number;
  currencySymbol: string;
  monthsToGoal: number | null;
  goal: any;
  useCaseLabels: string[];
  chartWidth: number;
  onFinish: () => void;
}) {
  return (
    <View className="flex-1 justify-between pb-8">
      <View>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150, duration: 800 }}
          className="mb-6"
        >
          <Text className="text-3xl text-white text-center leading-tight mb-3">
            You could{" "}
            <Text style={{ color: "#22D97A" }}>recapture</Text>
          </Text>
          {monthlySavingsPotential > 0 && (
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 3 }}>
              <Text style={{ color: "#22D97A", fontSize: 46, fontWeight: "800", letterSpacing: -1.5 }}>
                {currencySymbol}{monthlySavingsPotential.toLocaleString()}
              </Text>
              <Text style={{ color: "#8A96B4", fontSize: 20 }}>/month</Text>
            </View>
          )}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 500, duration: 800 }}
          className="mb-5"
        >
          <View className="bg-surfaceDark border border-borderDark rounded-3xl p-5">
            <View style={{ flexDirection: "row", gap: 20, marginBottom: 12, paddingHorizontal: 4 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <View style={{ width: 18, height: 3, backgroundColor: "#22D97A", borderRadius: 2 }} />
                <Text style={{ color: "#8A96B4", fontSize: 12 }}>With Monelo</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                <View style={{ width: 18, height: 2, backgroundColor: "#475569", borderRadius: 1 }} />
                <Text style={{ color: "#475569", fontSize: 12 }}>Without</Text>
              </View>
            </View>

            {monthlySavingsPotential > 0 ? (
              <SavingsProjectionChart
                monthlySavings={monthlySavingsPotential}
                currencySymbol={currencySymbol}
                chartWidth={chartWidth}
              />
            ) : (
              <View style={{ height: CHART_H, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: "#475569", fontSize: 14 }}>
                  Enter your income to see your projection
                </Text>
              </View>
            )}
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 900, duration: 800 }}
          style={{ gap: 10 }}
        >
          {annualSavings > 0 && (
            <View
              className="bg-surfaceDark border border-borderDark rounded-2xl"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <Text style={{ color: "#8A96B4", fontSize: 15 }}>This year</Text>
              <Text style={{ color: "#22D97A", fontSize: 17, fontWeight: "700" }}>
                {currencySymbol}{annualSavings.toLocaleString()} recaptured
              </Text>
            </View>
          )}
          {monthsToGoal && goal?.name && (
            <View
              className="bg-surfaceDark border border-borderDark rounded-2xl"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <Text style={{ color: "#8A96B4", fontSize: 15 }}>{goal.name}</Text>
              <Text style={{ color: "#93C5FD", fontSize: 15, fontWeight: "600" }}>
                {monthsToGoal}mo away
              </Text>
            </View>
          )}
          {!monthsToGoal && useCaseLabels.length > 0 && (
            <View
              className="bg-surfaceDark border border-borderDark rounded-2xl"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 22, paddingVertical: 16 }}
            >
              <Text style={{ color: "#8A96B4", fontSize: 15 }}>Users who track 30 days</Text>
              <Text style={{ color: "#3B7EFF", fontSize: 15, fontWeight: "600" }}>save 20% more</Text>
            </View>
          )}
        </MotiView>
      </View>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1200, duration: 700 }}
        style={{ marginTop: 20 }}
      >
        <AnimatedGradientButton
          onPress={onFinish}
          text="Let's do this"
          rounded="3xl"
        />
      </MotiView>
    </View>
  );
}
