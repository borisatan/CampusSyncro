import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";

// Map autopilot category names to their icons and colors
const CATEGORY_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  "Dining Out": { icon: "cafe-outline", color: "#FF6B6B" },
  "Impulse Buys": { icon: "cart-outline", color: "#F06292" },
  "Subscriptions": { icon: "card-outline", color: "#8A00C2" },
  "Grocery Runs": { icon: "bag-handle-outline", color: "#22D97A" },
  "Digital Entertainment": { icon: "tv-outline", color: "#3B7EFF" },
};

interface OnboardingCategoryGridProps {
  categories: string[]; // Just category names from Screen 2
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  isDarkMode: boolean;
}

export const OnboardingCategoryGrid = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  isDarkMode,
}: OnboardingCategoryGridProps) => {
  return (
    <View className="mb-6">
      <Text
        className={`text-sm mb-3 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}
      >
        Category
      </Text>

      <View className="flex-row flex-wrap -mx-1.5">
        {categories.map((categoryName, index) => {
          const categoryInfo = CATEGORY_MAP[categoryName];
          if (!categoryInfo) return null;

          return (
            <AnimatedCategoryItem
              key={categoryName}
              categoryName={categoryName}
              icon={categoryInfo.icon}
              color={categoryInfo.color}
              index={index}
              isDarkMode={isDarkMode}
              isSelected={selectedCategory === categoryName}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedCategory(categoryName);
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

// Animated category item component
const AnimatedCategoryItem = ({
  categoryName,
  icon,
  color,
  index,
  isDarkMode,
  isSelected,
  onPress,
}: {
  categoryName: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
  isDarkMode: boolean;
  isSelected: boolean;
  onPress: () => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 30,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 80,
        delay: index * 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      className="w-1/3 px-1.5 mb-3"
      style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        onPress={onPress}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
          isSelected
            ? isDarkMode
              ? "bg-surfaceDark border-accentBlue"
              : "bg-blue-50 border-accentBlue"
            : isDarkMode
              ? "bg-surfaceDark border-borderDark"
              : "bg-background border-borderLight"
        }`}
      >
        <View
          className="w-12 h-12 rounded-xl items-center justify-center"
          style={{
            backgroundColor: color,
          }}
        >
          <Ionicons
            name={icon}
            size={24}
            color="#fff"
          />
        </View>
        <Text
          className={`text-sm text-center ${isDarkMode ? "text-slate200" : "text-gray700"}`}
        >
          {categoryName}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
