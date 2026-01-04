import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../../types/types';

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
        <Text className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
          Loading categories...
        </Text>
      </View>
    );
  }

  if (categories.length === 0) {
    return (
      <View className="flex items-center justify-center py-8">
        <Text className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
          No categories found
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
          Category
        </Text>
        <TouchableOpacity
          onPress={() => setIsEditMode(!isEditMode)}
          className={`px-4 py-1 rounded-lg border ${
            isEditMode
              ? 'bg-accentBlue border-surfaceDark'
              : isDarkMode ? 'bg-surfaceDark border-slate-800' : 'bg-white border-gray-200'
          }`}
        >
          <Text className={`text-sm ${
            isEditMode
              ? 'text-white'
              : isDarkMode ? 'text-textDark' : 'text-textLight'
          }`}>
            {isEditMode ? 'Done Editing' : 'Edit Categories'}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap -mx-1.5">
        {categories.filter(cat => cat.category_name !== 'Income').map((category) => (
          <View key={category.id} className="w-1/3 px-1.5 mb-3 bg-backgroundDark">
            <TouchableOpacity
              onPress={() => {
                if (isEditMode) {
                  router.navigate({
                    pathname: '/components/AddTransactionPage/edit-category',
                    params: {
                      id: category.id,
                      name: category.category_name,
                      icon: category.icon,
                      color: category.color
                    }
                  });
                } else {
                  setSelectedCategory(category);
                }
              }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                isEditMode
                  ? isDarkMode ? 'bg-backgroundDark border-borderDark' : 'bg-backgroundMuted border-borderLight'
                  : selectedCategory?.id === category.id
                    ? isDarkMode ? 'bg-surfaceDark border-accentBlue' : 'bg-blue-50 border-accentBlue'
                    : isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
              }`}
            >
              <View
                className="w-12 h-12 rounded-xl items-center justify-center"
                style={{ backgroundColor: category.color }}
              >
                <Ionicons name={category.icon as any} size={24} color="#fff" />
                {isEditMode && (
                  <View className="absolute -top-1 -right-1 bg-white rounded-full border border-white">
                    <Ionicons name="pencil" size={10} color="#000" />
                  </View>
                )}
              </View>
              <Text className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                {category.category_name}
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        {isEditMode && (
          <View className="w-1/3 px-1.5 mb-3">
            <TouchableOpacity
              onPress={() => router.navigate('/components/AddTransactionPage/edit-category')}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                isDarkMode ? 'bg-backgroundDark border-slate-500' : 'bg-gray-100 border-gray-400'
              }`}
            >
              <View className="w-12 h-12 rounded-xl items-center justify-center bg-white border border-gray-300">
                <Ionicons name="add-outline" size={24} color="#6366f1" />
              </View>
              <Text className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                Add New
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};