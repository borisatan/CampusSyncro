import { ChevronLeft, CloudRain, Sun, TrendingUp, TrendingDown } from 'lucide-react-native';
import { MotiView } from 'moti';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, ScrollView, Text, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

export default function CostOfInattentionScreen() {
  const { setOnboardingStep, newOnboardingData } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();

  // Calculate 15% retention
  const monthlyIncome = newOnboardingData.estimatedIncome || 0;
  const retentionAmount = Math.round(monthlyIncome * 0.15);

  // Pulsing glow animation
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    setOnboardingStep(4);

    // Start pulsing animation
    glowOpacity.value = withRepeat(
      withTiming(0.6, { duration: 3000 }),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(5);
    router.push('/(onboarding)/why-manual');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(3);
    router.push('/(onboarding)/monthly-income');
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Pressable
              onPress={handleBack}
              className="flex-row items-center gap-1 active:opacity-60"
            >
              <ChevronLeft size={20} color="#8A96B4" />
              <Text className="text-secondaryDark text-sm">Back</Text>
            </Pressable>
            <Text className="text-secondaryDark text-sm">Step 4 of 7</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace('/(tabs)/dashboard');
              }}
              className="active:opacity-60"
            >
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
          <View className="h-1 bg-surfaceDark rounded-full overflow-hidden">
            <MotiView
              from={{ width: '42.9%' }}
              animate={{ width: '57.1%' }}
              transition={{ type: 'timing', duration: 500 }}
              className="h-full overflow-hidden relative"
            >
              <LinearGradient
                colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: "100%", height: "100%" }}
              />
              <MotiView
                from={{ translateX: -200 }}
                animate={{ translateX: 200 }}
                transition={{
                  type: "timing",
                  duration: 3000,
                  loop: true,
                  repeatDelay: 1500,
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: 100,
                }}
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

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600 }}
            className="flex-1"
          >
            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-3xl text-white text-center leading-tight">
                The Cost of <Text className="text-accentRed">Inattention</Text>
              </Text>
            </MotiView>

            {/* Comparison Cards */}
            <View className="mb-6">
              {/* Without App Card */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-6">
                  <View className="flex-row items-center gap-3 mb-4">
                    <View className="w-12 h-12 rounded-xl bg-inputDark items-center justify-center">
                      <CloudRain size={24} color="#8A96B4" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-secondaryDark text-sm">
                        Without Monelo
                      </Text>
                      <Text className="text-white text-xl font-semibold">
                        {currencySymbol}0
                      </Text>
                    </View>
                    <View className="items-center">
                      <TrendingDown size={20} color="#F2514A" />
                    </View>
                  </View>
                  <View className="pt-3 border-t border-borderDark">
                    <Text className="text-secondaryDark text-xs">
                      Status: <Text className="text-slate400">Foggy</Text>
                    </Text>
                  </View>
                </View>
              </MotiView>

              {/* With App Card (Pulsing) */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600, duration: 600 }}
              >
                <View className="relative rounded-xl overflow-hidden">
                  {/* Pulsing glow background */}
                  <Animated.View
                    style={[
                      {
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#3B7EFF',
                      },
                      glowStyle,
                    ]}
                  />

                  <View className="bg-surfaceDark border border-accentBlue rounded-xl p-6 relative">
                    <View className="flex-row items-center gap-3 mb-4">
                      <View className="w-12 h-12 rounded-xl bg-accentBlue items-center justify-center">
                        <Sun size={24} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-accentBlue text-sm font-medium">
                          With Monelo
                        </Text>
                        <Text className="text-white text-xl font-semibold">
                          {currencySymbol}{retentionAmount.toLocaleString()}
                        </Text>
                      </View>
                      <View className="items-center">
                        <TrendingUp size={20} color="#22D97A" />
                      </View>
                    </View>
                    <View className="pt-3 border-t border-borderDark">
                      <Text className="text-textDark text-xs">
                        Status: <Text className="text-accentGreen">Intentional</Text>
                      </Text>
                    </View>
                  </View>
                </View>
              </MotiView>
            </View>

            {/* Spacer to push button to bottom */}
            <View className="flex-1" />

            {/* Continue Button */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 500 }}
              className="mb-2"
            >
              <Pressable
                onPress={handleNext}
                className="w-full py-4 rounded-xl bg-accentBlue active:opacity-80"
                android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
              >
                <Text className="text-white text-lg text-center font-medium">
                  Secure my clarity
                </Text>
              </Pressable>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
