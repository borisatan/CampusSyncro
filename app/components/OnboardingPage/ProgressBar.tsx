import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface ProgressBarProps {
  currentStep: number; // 1-6
  totalSteps?: number;
}

export default function ProgressBar({ currentStep, totalSteps = 6 }: ProgressBarProps) {
  const progress = currentStep / totalSteps;

  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(`${progress * 100}%`, { duration: 300 }),
  }));

  return (
    <View className="w-full h-1 bg-borderDark rounded-full overflow-hidden">
      <Animated.View
        style={animatedStyle}
        className="h-full bg-accentBlue rounded-full"
      />
    </View>
  );
}
