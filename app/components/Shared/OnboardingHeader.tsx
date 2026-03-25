import React from "react";
import { Pressable, Text, View } from "react-native";
import { OnboardingBackButton } from "./OnboardingBackButton";
import { OnboardingProgressDots } from "./OnboardingProgressDots";

interface OnboardingHeaderProps {
  onBack: () => void;
  onSkip?: () => void;
  currentStep: number;
  totalSteps?: number;
}

export const OnboardingHeader = React.memo(function OnboardingHeader({
  onBack,
  onSkip,
  currentStep,
  totalSteps = 11,
}: OnboardingHeaderProps) {
  return (
    <View className="px-2 pt-12 pb-4">
      <View className="flex-row items-center justify-between">
        <OnboardingBackButton onPress={onBack} />
        <OnboardingProgressDots currentStep={currentStep} totalSteps={totalSteps} />
        {onSkip ? (
          <Pressable onPress={onSkip} className="active:opacity-60">
            <Text className="text-accentBlue text-sm font-medium">Skip</Text>
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>
    </View>
  );
});
