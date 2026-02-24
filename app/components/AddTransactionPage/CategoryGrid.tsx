import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { Category } from "../../types/types";

interface CategoryGridProps {
  categories: Category[];
  selectedCategory: Category | null;
  setSelectedCategory: (category: Category) => void;
  isDarkMode: boolean;
  isLoadingCategories: boolean;
  isEditMode: boolean;
  setIsEditMode: (val: boolean) => void;
}

export const CategoryGrid = ({
  categories,
  selectedCategory,
  setSelectedCategory,
  isDarkMode,
  isLoadingCategories,
  isEditMode,
  setIsEditMode,
}: CategoryGridProps) => {
  const router = useRouter();

  if (isLoadingCategories) {
    return (
      <View className="flex items-center justify-center py-8">
        <Text className={isDarkMode ? "text-slate300" : "text-secondaryLight"}>
          Loading categories...
        </Text>
      </View>
    );
  }

  // Filter categories once to maintain consistent indexing for the stagger
  const displayCategories = categories.filter(
    (cat) => cat.category_name !== "Income",
  );

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text
          className={`text-sm mb-1 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}
        >
          Category
        </Text>
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-1 rounded-lg border ${
            isEditMode
              ? "bg-accentBlue border-surfaceDark"
              : isDarkMode
                ? "bg-surfaceDark border-slate700"
                : "bg-background border-borderLight"
          }`}
        >
          <Text
            className={`text-sm ${isEditMode ? "text-white" : isDarkMode ? "text-textDark" : "text-textLight"}`}
          >
            {isEditMode ? "Done Editing" : "Edit Categories"}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap -mx-1.5">
        {displayCategories.map((category, index) => (
          <AnimatedCategoryItem
            key={category.id}
            category={category}
            index={index}
            isDarkMode={isDarkMode}
            isEditMode={isEditMode}
            isSelected={selectedCategory?.id === category.id}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (isEditMode) {
                router.navigate({
                  pathname: "/components/AddTransactionPage/edit-category",
                  params: {
                    id: category.id,
                    name: category.category_name,
                    icon: category.icon,
                    color: category.color,
                  },
                });
              } else {
                setSelectedCategory(category);
              }
            }}
          />
        ))}

        {isEditMode && (
          <AnimatedCategoryItem
            index={displayCategories.length} // Stagger last
            isDarkMode={isDarkMode}
            isEditMode={true}
            onPress={() =>
              router.navigate("/components/AddTransactionPage/edit-category")
            }
            isAddBtn
          />
        )}
      </View>
    </View>
  );
};

// --- New Animated Component ---
const AnimatedCategoryItem = ({
  category,
  index,
  isDarkMode,
  isEditMode,
  isSelected,
  onPress,
  isAddBtn = false,
}: any) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current; // Scale up from 80%

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 30, // Faster stagger for grid
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
          isAddBtn
            ? isDarkMode
              ? "bg-backgroundDark border-slate400"
              : "bg-surfaceLightGray border-gray400"
            : isEditMode
              ? isDarkMode
                ? "bg-backgroundDark border-borderDark"
                : "bg-backgroundMuted border-borderLight"
              : isSelected
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
            backgroundColor: isAddBtn ? "#fff" : category.color,
            borderWidth: isAddBtn ? 1 : 0,
            borderColor: "#d1d5db",
          }}
        >
          <Ionicons
            name={isAddBtn ? "add-outline" : (category.icon as any)}
            size={24}
            color={isAddBtn ? "#6366f1" : "#fff"}
          />
          {isEditMode && !isAddBtn && (
            <View className="absolute -top-1 -right-1 bg-white rounded-full border border-white">
              <Ionicons name="pencil" size={10} color="#000" />
            </View>
          )}
        </View>
        <Text
          className={`text-sm text-center ${isDarkMode ? "text-slate200" : "text-gray700"}`}
        >
          {isAddBtn ? "Add New" : category.category_name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
