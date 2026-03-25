import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { MotiView } from "moti";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface OnboardingHeaderProps {
  onBack: () => void;
  onSkip?: () => void;
  fromPercent: string;
  toPercent: string;
}

const PROGRESS_BAR_TRANSITION = { type: "timing", duration: 500 } as const;

const SHIMMER_FROM = { translateX: -200 } as const;
const SHIMMER_ANIMATE = { translateX: 200 } as const;
const SHIMMER_TRANSITION = {
  type: "timing",
  duration: 3000,
  loop: true,
  delay: 1500,
} as const;

const SHIMMER_STYLE = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 100,
};

export const OnboardingHeader = React.memo(function OnboardingHeader({
  onBack,
  onSkip,
  fromPercent,
  toPercent,
}: OnboardingHeaderProps) {
  const progressFrom = React.useMemo(() => ({ width: fromPercent }), [fromPercent]);
  const progressAnimate = React.useMemo(() => ({ width: toPercent }), [toPercent]);

  return (
    <View className="px-2 pt-12 pb-4">
      <View className="flex-row items-center justify-between mb-2">
        <Pressable
          onPress={onBack}
          className="flex-row items-center gap-1 active:opacity-60"
        >
          <ChevronLeft size={20} color="#8A96B4" />
          <Text className="text-secondaryDark text-sm">Back</Text>
        </Pressable>
        {onSkip ? (
          <Pressable onPress={onSkip} className="active:opacity-60">
            <Text className="text-accentBlue text-sm font-medium">Skip</Text>
          </Pressable>
        ) : (
          <View className="w-12" />
        )}
      </View>
      <View className="items-center">
        <View
          className="h-2 bg-surfaceDark rounded-full overflow-hidden"
          style={{ width: "33%" }}
        >
          <MotiView
            from={progressFrom}
            animate={progressAnimate}
            transition={PROGRESS_BAR_TRANSITION}
            className="h-full overflow-hidden relative"
          >
            <LinearGradient
              colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: "100%", height: "100%" }}
            />
            <MotiView
              from={SHIMMER_FROM}
              animate={SHIMMER_ANIMATE}
              transition={SHIMMER_TRANSITION}
              style={SHIMMER_STYLE}
              pointerEvents="none"
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
  );
});
