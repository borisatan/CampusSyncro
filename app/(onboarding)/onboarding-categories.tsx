import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryModal } from '../components/Shared/category-modal';
import { Category } from '../types/types';

// Define a more flexible type for onboarding categories
type OnboardingCategoryName = string;

interface CustomCategory {
  name: string;
  icon: string;
  color: string;
}

// Category icons using Ionicons
const categoryIcons: Record<string, string> = {
  'Food': 'restaurant',
  'Transport': 'bus',
  'Entertainment': 'film',
  'Utilities': 'flash',
  'Shopping': 'cart',
  'Healthcare': 'medkit',
  'Education': 'school',
  'Savings': 'wallet',
  'Rent/Mortgage': 'home',
  'Insurance': 'shield-checkmark',
  'Travel': 'airplane',
  'Personal Care': 'person',
};

export default function OnboardingCategories() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<OnboardingCategoryName[]>([]);
  const [customCategories, setCustomCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);

  const predefinedCategories: OnboardingCategoryName[] = [
    'Food',
    'Transport',
    'Entertainment',
    'Utilities',
    'Shopping',
    'Healthcare',
    'Education',
    'Savings',
    'Rent/Mortgage',
    'Insurance',
    'Travel',
    'Personal Care',
  ];

  const toggleCategory = (category: OnboardingCategoryName): void => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddCustomCategory = (category: Category) => {
    setCustomCategories(prev => [...prev, category]);
    setSelectedCategories(prev => [...prev, category.name]);
    setShowCategoryModal(false);
  };

  const allCategories = [
    ...predefinedCategories.map(name => ({ name, icon: categoryIcons[name], color: '#2A9D8F' })),
    ...customCategories
  ];

  const handleNext = (): void => {
    router.push({
      pathname: '/(onboarding)/onboarding-budget',
      params: {
        selectedCategories: JSON.stringify(selectedCategories),
        customCategories: JSON.stringify(customCategories.map(c => c.name))
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#282A36]">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-sm font-medium text-[#5F6368] dark:text-[#BBBBBB] mb-2">
          Step 1 of 3
        </Text>
        <Text className="text-2xl font-bold text-[#212121] dark:text-[#FFFFFF] mb-2">
          Select Budget Categories
        </Text>
        <Text className="text-base text-[#5F6368] dark:text-[#BBBBBB]">
          Choose the categories you want to track in your budget
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        <View className="space-y-3 mb-6">
          {allCategories.map((category) => (
            <TouchableOpacity
              key={category.name}
              className={`flex-row items-center p-4 rounded-xl border ${
                selectedCategories.includes(category.name)
                  ? 'bg-[#2A9D8F]/10 border-[#2A9D8F]'
                  : 'bg-[#FFFFFF] dark:bg-[#1E1E1E] border-[#E0E0E0] dark:border-[#2C2C2C]'
              }`}
              onPress={() => toggleCategory(category.name)}
            >
              <View 
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <Ionicons 
                  name={category.icon as any} 
                  size={20} 
                  color={category.color} 
                />
              </View>
              <Text
                className={`flex-1 text-base ${
                  selectedCategories.includes(category.name)
                    ? 'text-[#2A9D8F] font-medium'
                    : 'text-[#212121] dark:text-[#FFFFFF]'
                }`}
              >
                {category.name}
              </Text>
              <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                selectedCategories.includes(category.name)
                  ? 'border-[#2A9D8F] bg-[#2A9D8F]'
                  : 'border-[#E0E0E0] dark:border-[#2C2C2C]'
              }`}>
                {selectedCategories.includes(category.name) && (
                  <Ionicons name="checkmark" size={16} color="white" />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mb-8">
          <TouchableOpacity
            className="flex-row items-center justify-center py-5 px-6 border-2 border-dashed border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl"
            onPress={() => setShowCategoryModal(true)}
          >
            <Ionicons name="add-circle-outline" size={28} color="#2A9D8F" className="mr-2" />
            <Text className="text-[#2A9D8F] font-semibold text-lg ml-2">
              Add Custom Category
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="px-6 pb-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2C2C2C]">
        <TouchableOpacity
          className={`py-4 rounded-xl ${
            selectedCategories.length > 0
              ? 'bg-[#2A9D8F]'
              : 'bg-[#E0E0E0] dark:bg-[#2C2C2C]'
          }`}
          onPress={handleNext}
          disabled={selectedCategories.length === 0}
        >
          <Text
            className={`text-center font-semibold text-base ${
              selectedCategories.length > 0
                ? 'text-white'
                : 'text-[#9E9E9E] dark:text-[#777777]'
            }`}
          >
            Next
          </Text>
        </TouchableOpacity>
      </View>

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={handleAddCustomCategory}
        mode="add"
        existingCategories={allCategories.map(c => c.name)}
      />
    </SafeAreaView>
  );
}