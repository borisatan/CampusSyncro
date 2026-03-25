import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";

interface OnboardingProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

const DOT_TRANSITION = { type: "timing", duration: 500 } as const;

export const OnboardingProgressDots = React.memo(function OnboardingProgressDots({
  currentStep,
  totalSteps,
}: OnboardingProgressDotsProps) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 4 }}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const isActive = i + 1 === currentStep;
        return (
          <MotiView
            key={i}
            from={{ width: 8 }}
            animate={{ width: isActive ? 26 : 8 }}
            transition={DOT_TRANSITION}
            style={{
              height: 8,
              borderRadius: 4,
              backgroundColor: isActive ? "#3B7EFF" : "#2A3250",
            }}
          />
        );
      })}
    </View>
  );
});
