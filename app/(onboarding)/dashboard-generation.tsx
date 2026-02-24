import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DashboardSkeleton } from '../components/HomePage/DashboardSkeleton';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

export default function DashboardGenerationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pendingMonthlyTarget, setOnboardingStep, completeOnboarding } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();

  const [displayAmount, setDisplayAmount] = useState(0);
  const [showCounter, setShowCounter] = useState(false);

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  useEffect(() => {
    setOnboardingStep(2);

    // Phase 1: Shimmer (0-400ms)
    // Phase 2: Counter animation (400-900ms)
    const counterTimeout = setTimeout(() => {
      setShowCounter(true);
      setDisplayAmount(pendingMonthlyTarget);
      // Haptic at 900ms
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 500);
    }, 400);

    // Phase 3: Auto-advance (1200ms)
    const navTimeout = setTimeout(() => {
      router.push('/(onboarding)/category-confirmation');
    }, 1200);

    return () => {
      clearTimeout(counterTimeout);
      clearTimeout(navTimeout);
    };
  }, []);

  return (
    <View className="flex-1 bg-backgroundDark">
      <View
        className="absolute top-0 right-0 z-10 px-6"
        style={{ paddingTop: insets.top + 12 }}
      >
        <TouchableOpacity
          onPress={handleSkip}
          activeOpacity={0.7}
          className="bg-accentBlue px-8 py-3 rounded-full"
        >
          <Text className="text-white text-base font-semibold">Skip</Text>
        </TouchableOpacity>
      </View>

      <View
        className="flex-1"
        style={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 16,
        }}
      >
        {/* Shimmer Phase (0-400ms) */}
        {!showCounter && (
          <MotiView
            from={{ opacity: 0.3 }}
            animate={{ opacity: 0.7 }}
            transition={{
              type: 'timing',
              duration: 200,
              loop: true,
            }}
          >
            <DashboardSkeleton isDarkMode={true} />
          </MotiView>
        )}

        {/* Counter Animation Phase (400-900ms) */}
        {showCounter && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400 }}
            className="flex-1 justify-center items-center"
          >
            <Text className="text-lg text-secondaryDark uppercase tracking-wide mb-6">
              Remaining Budget
            </Text>

            <View className="flex-row items-start justify-center mb-8">
              <Text className="text-4xl text-white font-light mr-2 mt-3">
                {currencySymbol}
              </Text>
              <AnimatedRollingNumber
                value={displayAmount}
                spinningAnimationConfig={{ duration: 500 }}
                textStyle={{
                  fontSize: 72,
                  fontWeight: '200',
                  color: '#FFFFFF',
                  letterSpacing: -2,
                }}
                toFixed={0}
              />
            </View>

            {/* Progress Bar (0% initially) */}
            <View className="w-4/5 mb-8">
              <View className="w-full h-3 bg-borderDark rounded-full">
                <View
                  className="h-3 bg-accentTeal rounded-full"
                  style={{ width: '0%' }}
                />
              </View>
            </View>

            <Text className="text-base text-textDark text-center font-medium">
              Budget target set at {currencySymbol}
              {pendingMonthlyTarget.toLocaleString()}.
            </Text>
            <Text className="text-sm text-secondaryDark text-center mt-2">
              Dashboard ready.
            </Text>
          </MotiView>
        )}
      </View>
    </View>
  );
}
