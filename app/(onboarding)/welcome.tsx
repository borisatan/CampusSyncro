import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useOnboardingStore } from "../store/useOnboardingStore";

export default function WelcomeScreen() {
  const setOnboardingStep = useOnboardingStore(
    (state) => state.setOnboardingStep,
  );

  useEffect(() => {
    setOnboardingStep(1);
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(2);
    router.push("/(onboarding)/category-autopilot");
  };

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark">
      <ScrollView className="flex-1">
        {/* Progress Bar */}
        <View className="px-2 pt-12 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            <View className="w-12" />
            <Text className="text-secondaryDark text-sm">Step 1 of 7</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.replace("/(tabs)/dashboard");
              }}
              className="active:opacity-60"
            >
              <Text className="text-accentBlue text-sm font-medium">Skip</Text>
            </Pressable>
          </View>
          <View className="h-1 bg-surfaceDark rounded-full overflow-hidden">
            <MotiView
              from={{ width: "0%" }}
              animate={{ width: "14.3%" }}
              transition={{ type: "timing", duration: 500 }}
              className="h-full overflow-hidden"
            >
              <LinearGradient
                colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: "100%", height: "100%" }}
              />
            </MotiView>
          </View>
        </View>

        <View className="flex-1 px-2 py-8 pt-4">
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 800 }}
            className="flex-1"
          >
            {/* Icon/Logo Area */}
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2, opacity: 1 }}
              transition={{ delay: 200, duration: 800, type: "spring" }}
              className="items-center mt-16 mb-8"
            >
              <Image
                source={require("../../assets/icons/logo-gray-300.png")}
                className="w-20 h-20"
                resizeMode="contain"
              />
            </MotiView>

            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 400, duration: 800 }}
              className="px-2"
            >
              <Text className="text-4xl text-white text-center leading-tight mb-4 mt-8">
                Stop watching your money{" "}
                <Text className="text-accentRed">leave</Text>.
              </Text>
              <Text className="text-4xl text-white text-center leading-tight">
                Start deciding where it{" "}
                <Text className="text-accentGreen">goes</Text>.
              </Text>
            </MotiView>

            {/* Spacer to push content to bottom */}

            {/* Sub-headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 600, duration: 800 }}
              className="mb-2 mt-12"
            >
              <Text className="text-secondaryDark text-lg italic text-center mt-8 px-6">
                Mastery begins with awareness.
              </Text>
            </MotiView>

            {/* Primary Button with Static Gradient and Shimmer */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 800, duration: 600 }}
              className="mb-2"
            >
              <Pressable
                onPress={handleNext}
                className="w-full rounded-3xl overflow-hidden active:opacity-80"
                android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
              >
                <View className="relative overflow-hidden">
                  <LinearGradient
                    colors={["#1E40AF", "#3B7EFF", "#60A5FA"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={{ width: "100%" }}
                  >
                    <View className="py-5 flex-row items-center justify-center gap-2">
                      <Text className="text-white text-lg font-medium">
                        Begin your journey
                      </Text>
                      <ArrowRight size={20} color="#ffffff" />
                    </View>
                  </LinearGradient>

                  {/* Shimmer effect */}
                  <MotiView
                    from={{ translateX: -400 }}
                    animate={{ translateX: 400 }}
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
                      width: 200,
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
                </View>
              </Pressable>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
