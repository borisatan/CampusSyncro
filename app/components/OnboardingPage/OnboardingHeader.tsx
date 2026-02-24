import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProgressBar from './ProgressBar';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onSkip?: () => void;
  onBack?: () => void;
}

const STEP_ROUTES: Record<number, string> = {
  1: '/(onboarding)/emotional-hook',
  2: '/(onboarding)/value-alignment',
  3: '/(onboarding)/category-selection',
  4: '/(onboarding)/budget-setting',
  5: '/(onboarding)/savings-potential',
  6: '/(onboarding)/intentionality-map',
};

export default function OnboardingHeader({
  currentStep,
  totalSteps = 6,
  title,
  subtitle,
  showBack = true,
  onSkip,
  onBack,
}: OnboardingHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = 0;
    subtitleOpacity.value = 0;

    titleOpacity.value = withDelay(150, withTiming(1, { duration: 500 }));
    subtitleOpacity.value = withDelay(350, withTiming(1, { duration: 500 }));
  }, [currentStep]);

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    const previousStep = currentStep - 1;
    const route = STEP_ROUTES[previousStep];
    if (route) {
      router.replace(route as any);
    }
  };

  return (
    <View className="px-2 pt-2" style={{ paddingTop: insets.top + 8 }}>
      {onSkip && (
        <View className="flex-row justify-end mb-2">
          <TouchableOpacity
            onPress={onSkip}
            activeOpacity={0.7}
            className="bg-accentBlue px-8 py-3 rounded-full"
          >
            <Text className="text-white text-base font-semibold">
              Skip
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress Bar */}
      <ProgressBar currentStep={currentStep} />

      {/* Back Button */}
      {showBack && currentStep > 1 && (
        <TouchableOpacity
          onPress={handleBack}
          className="mt-4 mb-2 flex-row items-center"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#9CA3AF" />
          <Text className="text-secondaryDark text-base ml-1">Back</Text>
        </TouchableOpacity>
      )}

      {/* Title Section */}
      <View className={showBack && currentStep > 1 ? 'mt-4' : 'mt-8'}>
        <Animated.Text
          style={titleAnimatedStyle}
          className="text-textDark text-2xl font-bold"
        >
          {title}
        </Animated.Text>
        {subtitle && (
          <Animated.Text
            style={subtitleAnimatedStyle}
            className="text-secondaryDark text-base mt-2"
          >
            {subtitle}
          </Animated.Text>
        )}
      </View>
    </View>
  );
}
