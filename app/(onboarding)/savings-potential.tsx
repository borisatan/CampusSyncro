import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function SavingsPotentialScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currencySymbol } = useCurrencyStore();
  const { setOnboardingStep, pendingIncome } = useOnboardingStore();

  const [showYearly, setShowYearly] = useState(false);
  const [canTap, setCanTap] = useState(false);
  const [displayMonthly, setDisplayMonthly] = useState(0);
  const [displayYearly, setDisplayYearly] = useState(0);

  // Calculate savings (20% of income)
  const monthlySavings = Math.round(pendingIncome * 0.2);
  const yearlySavings = monthlySavings * 12;

  // Animation values
  const monthlyOpacity = useSharedValue(0);
  const monthlyScale = useSharedValue(0.9);
  const yearlyOpacity = useSharedValue(0);
  const yearlyScale = useSharedValue(0.8);
  const labelOpacity = useSharedValue(0);

  useEffect(() => {
    setOnboardingStep(5);

    // Initial animations
    monthlyOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    monthlyScale.value = withDelay(200, withTiming(1, { duration: 600 }));
    labelOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));

    // Trigger the rolling number after a short delay
    const numberTimeout = setTimeout(() => {
      setDisplayMonthly(monthlySavings);
    }, 600);

    // Enable tap after initial animation
    const tapTimeout = setTimeout(() => {
      setCanTap(true);
    }, 2000);

    return () => {
      clearTimeout(tapTimeout);
      clearTimeout(numberTimeout);
    };
  }, []);

  const handleTap = () => {
    if (!canTap) return;

    if (!showYearly) {
      // Transition to yearly view
      setShowYearly(true);
      monthlyOpacity.value = withTiming(0, { duration: 400 });
      monthlyScale.value = withTiming(0.8, { duration: 400 });

      setTimeout(() => {
        yearlyOpacity.value = withTiming(1, { duration: 600 });
        yearlyScale.value = withTiming(1, { duration: 600 });
        labelOpacity.value = withTiming(1, { duration: 600 });

        // Trigger yearly rolling number
        setTimeout(() => {
          setDisplayYearly(yearlySavings);
        }, 200);
      }, 300);
    } else {
      // Navigate to next screen
      router.push('/(onboarding)/intentionality-map');
    }
  };

  const monthlyStyle = useAnimatedStyle(() => ({
    opacity: monthlyOpacity.value,
    transform: [{ scale: monthlyScale.value }],
  }));

  const yearlyStyle = useAnimatedStyle(() => ({
    opacity: yearlyOpacity.value,
    transform: [{ scale: yearlyScale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  return (
    <Pressable className="flex-1 bg-[#050810]" onPress={handleTap}>
      {/* Deep gradient background */}
      <LinearGradient
        colors={['#050810', '#0A1628', '#0D1F35', '#0A1628', '#050810']}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        className="absolute inset-0"
      />

      {/* Main content */}
      <View
        className="flex-1 justify-center items-center"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        {/* Monthly savings view */}
        {!showYearly && (
          <Animated.View className="items-center justify-center" style={monthlyStyle}>
            <Animated.Text
              className="text-xl text-slate-500 uppercase tracking-[4px] mb-4"
              style={[{ fontWeight: '300' }, labelStyle]}
            >
              You can save
            </Animated.Text>

            <View className="flex-row items-start justify-center">
              <Text className="text-white mr-1 text-5xl font-extralight mt-3">
                {currencySymbol || '$'}
              </Text>
              <AnimatedRollingNumber
                value={displayMonthly}
                spinningAnimationConfig={{ duration: 3000 }}
                textStyle={{ fontSize: 88, fontWeight: '200', color: '#FFFFFF', letterSpacing: -2 }} // Third-party component prop
                toFixed={0}
              />
            </View>

            <Animated.Text
              className="text-2xl text-accentTeal tracking-wide mt-5"
              style={[{ fontWeight: '300' }, labelStyle]}
            >
              every month
            </Animated.Text>
          </Animated.View>
        )}

        {/* Yearly savings view */}
        {showYearly && (
          <Animated.View className="items-center justify-center" style={yearlyStyle}>
            <Animated.Text
              className="text-xl text-slate-500 uppercase tracking-[4px] mb-4"
              style={[{ fontWeight: '300' }, labelStyle]}
            >
              That's
            </Animated.Text>

            <View className="flex-row items-start justify-center">
              <Text className="text-white mr-1 text-5xl font-extralight mt-3">
                {currencySymbol || '$'}
              </Text>
              <AnimatedRollingNumber
                value={displayYearly}
                spinningAnimationConfig={{ duration: 3000 }}
                textStyle={{ fontSize: 88, fontWeight: '200', color: '#FFFFFF', letterSpacing: -2 }} // Third-party component prop
                toFixed={0}
              />
            </View>

            <Animated.Text
              className="text-2xl text-accentTeal tracking-wide mt-5"
              style={[{ fontWeight: '300' }, labelStyle]}
            >
              per year
            </Animated.Text>
          </Animated.View>
        )}
      </View>
    </Pressable>
  );
}
