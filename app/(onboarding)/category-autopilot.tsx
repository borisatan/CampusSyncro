import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { MotiView } from "moti";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useOnboardingStore } from "../store/useOnboardingStore";

const AUTOPILOT_CATEGORIES = [
  {
    id: "dining-out",
    name: "Dining Out",
    icon: "restaurant-outline" as const,
    color: "#F57C00",
  },
  {
    id: "impulse-buys",
    name: "Impulse Buys",
    icon: "bag-outline" as const,
    color: "#FF3333",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: "card-outline" as const,
    color: "#8A00C2",
  },
  {
    id: "grocery-runs",
    name: "Grocery Runs",
    icon: "cart-outline" as const,
    color: "#009933",
  },
  {
    id: "digital-entertainment",
    name: "Nightlife",
    icon: "beer-outline" as const,
    color: "#3B7EFF",
  },
];

export default function CategoryAutopilotScreen() {
  const { setOnboardingStep, setNewOnboardingData } = useOnboardingStore();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    setOnboardingStep(2);
  }, []);

  const toggleCategory = (categoryName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName],
    );
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNewOnboardingData({ selectedAutopilotCategories: selectedCategories });
    setOnboardingStep(3);
    router.push("/(onboarding)/monthly-income");
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOnboardingStep(1);
    router.push("/(onboarding)/welcome");
  };

  const isNextDisabled = selectedCategories.length === 0;

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
            <Text className="text-secondaryDark text-sm">Step 2 of 7</Text>
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
              from={{ width: "14.3%" }}
              animate={{ width: "28.6%" }}
              transition={{ type: "timing", duration: 500 }}
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
          >
            {/* Headline */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 200, duration: 600 }}
              className="mb-8"
            >
              <Text className="text-3xl text-white text-center leading-tight mb-2">
                Where does your spending feel on{" "}
                <Text className="text-accentBlue">autopilot</Text>?
              </Text>
              <Text className="text-secondaryDark text-sm text-center mt-2">
                Select all that apply
              </Text>
            </MotiView>

            {/* Category Cards */}
            <View className="mb-8">
              {AUTOPILOT_CATEGORIES.map((category, index) => {
                const isSelected = selectedCategories.includes(category.name);

                return (
                  <MotiView
                    key={category.id}
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: 400 + index * 100, duration: 500 }}
                    className="mb-3"
                  >
                    <Pressable
                      onPress={() => toggleCategory(category.name)}
                      className={`p-5 rounded-xl border-2 ${
                        isSelected
                          ? "bg-accentBlue/10 border-accentBlue"
                          : "bg-surfaceDark border-borderDark"
                      }`}
                      android_ripple={{ color: "rgba(59, 126, 255, 0.1)" }}
                    >
                      <View className="flex-row items-center gap-4">
                        <View
                          className="w-14 h-14 rounded-xl items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          <Ionicons
                            name={category.icon}
                            size={28}
                            color="#ffffff"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white text-lg font-medium">
                            {category.name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={28}
                            color="#3B7EFF"
                          />
                        )}
                      </View>
                    </Pressable>
                  </MotiView>
                );
              })}
            </View>

            {/* Continue Button */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: 900, duration: 500 }}
            >
              <Pressable
                onPress={handleNext}
                disabled={isNextDisabled}
                className={`w-full py-4 rounded-xl ${
                  isNextDisabled
                    ? "bg-surfaceDark border border-borderDark"
                    : "bg-accentBlue active:opacity-80"
                }`}
                android_ripple={
                  !isNextDisabled
                    ? { color: "rgba(255, 255, 255, 0.1)" }
                    : undefined
                }
              >
                <Text
                  className={`text-lg text-center font-medium ${
                    isNextDisabled ? "text-secondaryDark" : "text-white"
                  }`}
                >
                  Continue
                </Text>
              </Pressable>
            </MotiView>
          </MotiView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
