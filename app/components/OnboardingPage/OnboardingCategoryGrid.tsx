import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { V3_DEFAULT_CATEGORIES } from "../../constants/onboardingCategories";

// Map filled icons to outline variants
const getOutlineIcon = (icon: string): keyof typeof Ionicons.glyphMap => {
  // If already an outline icon, return as-is
  if (icon.endsWith('-outline')) {
    return icon as keyof typeof Ionicons.glyphMap;
  }

  const outlineMap: Record<string, string> = {
    'home': 'home-outline',
    'cart': 'cart-outline',
    'restaurant': 'restaurant-outline',
    'tv': 'tv-outline',
    'car': 'car-outline',
    'bag-handle': 'bag-outline',
    'apps': 'apps-outline',
  };
  return (outlineMap[icon] || icon) as keyof typeof Ionicons.glyphMap;
};

// Build category map from V3_DEFAULT_CATEGORIES
const CATEGORY_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> =
  V3_DEFAULT_CATEGORIES.reduce((acc, cat) => {
    acc[cat.name] = { icon: getOutlineIcon(cat.icon) as keyof typeof Ionicons.glyphMap, color: cat.color };
    return acc;
  }, {} as Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }>);

interface OnboardingCategoryGridProps {
  categories: string[]; // Just category names from Screen 2
  selectedCategory: string | null;
  setSelectedCategory: (category: string) => void;
  isDarkMode: boolean;
  enabledCategories?: string[]; // If provided, only these are selectable
}

export const OnboardingCategoryGrid = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  isDarkMode,
  enabledCategories,
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

          const isDisabled = enabledCategories !== undefined && !enabledCategories.includes(categoryName);

          return (
            <AnimatedCategoryItem
              key={categoryName}
              categoryName={categoryName}
              icon={categoryInfo.icon}
              color={categoryInfo.color}
              index={index}
              isDarkMode={isDarkMode}
              isSelected={selectedCategory === categoryName}
              isDisabled={isDisabled}
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
  isDisabled,
  onPress,
}: {
  categoryName: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  index: number;
  isDarkMode: boolean;
  isSelected: boolean;
  isDisabled: boolean;
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
  }, [fadeAnim, index, scaleAnim]);

  return (
    <Animated.View
      className="w-1/3 px-1.5 mb-3"
      style={{ opacity: isDisabled ? 0.4 : fadeAnim, transform: [{ scale: scaleAnim }] }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
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
          className={`text-sm text-center ${isDarkMode ? "text-white" : "text-gray700"}`}
        >
          {categoryName}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
