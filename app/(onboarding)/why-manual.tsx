import { Brain, ChevronLeft, Hand, Zap } from 'lucide-react-native';
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

export default function WhyManualScreen() {
  const setOnboardingStep = useOnboardingStore((state) => state.setOnboardingStep);

  // Pulsing glow animation for "Choice Point" card
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    setOnboardingStep(5);

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
    setOnboardingStep(6);
    router.push('/(onboarding)/practice-entry');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(4);
    router.push('/(onboarding)/cost-of-inattention');
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
            <Text className="text-secondaryDark text-sm">Step 5 of 7</Text>
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
              from={{ width: '57.1%' }}
              animate={{ width: '71.4%' }}
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
            <View className="text-center mb-8">
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 200, duration: 600 }}
              >
                <Text className="text-4xl text-white text-center leading-tight">
                  Why <Text className="text-accentBlue">Manual</Text>?
                </Text>
              </MotiView>
            </View>

            {/* Philosophy Content */}
            <View className="mb-8">
              {/* Automation Card */}
              <MotiView
                from={{ opacity: 0, translateX: -30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 400, duration: 600 }}
                className="mb-6"
              >
                <View className="bg-surfaceDark border border-borderDark rounded-xl p-6">
                  <View className="flex-row gap-4">
                    <View className="w-12 h-12 rounded-xl bg-inputDark items-center justify-center">
                      <Zap size={24} color="#8A96B4" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white mb-2 text-base font-medium">
                        Automation is forgettable
                      </Text>
                      <Text className="text-secondaryDark text-sm leading-relaxed">
                        When apps track purchases automatically, spending becomes
                        invisible. You lose the connection between action and
                        consequence.
                      </Text>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Choice Point Card with Pulsing Glow */}
              <MotiView
                from={{ opacity: 0, translateX: 30 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 600, duration: 600 }}
                className="mb-6"
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
                    <View className="flex-row gap-4">
                      <View className="w-12 h-12 rounded-xl bg-accentBlue items-center justify-center">
                        <Hand size={24} color="#ffffff" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-white mb-2 text-base font-medium">
                          Typing creates a{" "}
                          <Text className="text-accentBlue">"Choice Point"</Text>
                        </Text>
                        <Text className="text-textDark text-sm leading-relaxed">
                          A 3-second pause that changes your brain. Each manual entry
                          builds awareness, making future spending more intentional.
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </MotiView>

              {/* Brain Science Card */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: 800, duration: 600 }}
              >
                <View className="bg-surfaceDark/50 border border-borderDark rounded-xl p-5">
                  <View className="flex-row items-start gap-3">
                    <Brain size={20} color="#3B7EFF" style={{ marginTop: 2 }} />
                    <Text className="text-secondaryDark text-xs leading-relaxed flex-1">
                      Research shows that the act of recording a transaction
                      manually increases financial mindfulness by up to 43% compared
                      to automated tracking.
                    </Text>
                  </View>
                </View>
              </MotiView>
            </View>

            {/* Continue Button */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 1000, duration: 500 }}
            >
              <Pressable
                onPress={handleNext}
                className="w-full py-4 rounded-xl bg-accentBlue active:opacity-80"
                android_ripple={{ color: 'rgba(255, 255, 255, 0.1)' }}
              >
                <Text className="text-white text-lg text-center font-medium">
                  Try a practice entry
                </Text>
              </Pressable>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
