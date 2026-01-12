import { Ionicons } from '@expo/vector-icons';
import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Category } from '../../types/types';

interface CategorySelectorProps {
  categories: Category[];
  selectedCategoryIds: number[];
  onToggleCategory: (categoryId: number) => void;
  currentBudgetId?: number;
  isDarkMode?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryIds,
  onToggleCategory,
  currentBudgetId,
  isDarkMode = true,
}) => {
  // Filter out Income category and show available categories
  const availableCategories = categories.filter(
    (cat) =>
      cat.category_name !== 'Income' &&
      (cat.budget_id === null || cat.budget_id === currentBudgetId)
  );

  // Categories already assigned to other budgets
  const assignedToOther = categories.filter(
    (cat) =>
      cat.category_name !== 'Income' &&
      cat.budget_id !== null &&
      cat.budget_id !== currentBudgetId
  );

  return (
    <View className="mb-6">
      <Text className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
        Categories
      </Text>

      {availableCategories.length === 0 && assignedToOther.length === 0 ? (
        <Text className={`text-sm italic ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
          No categories available
        </Text>
      ) : (
        <>
          {/* Available categories grid */}
          <View className="flex-row flex-wrap -mx-1.5">
            {availableCategories.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);
              return (
                <View key={category.id} className="w-1/3 px-1.5 mb-3">
                  <TouchableOpacity
                    onPress={() => onToggleCategory(category.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                      isSelected
                        ? isDarkMode ? 'bg-surfaceDark border-accentBlue' : 'bg-blue-50 border-accentBlue'
                        : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
                    }`}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center"
                      style={{ backgroundColor: category.color }}
                    >
                      <Ionicons
                        name={category.icon as any}
                        size={24}
                        color="#fff"
                      />
                      {isSelected && (
                        <View className="absolute -top-1 -right-1 bg-accentBlue rounded-full p-0.5">
                          <Check size={10} color="#fff" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                    <Text
                      className={`text-xs text-center ${
                        isSelected
                          ? isDarkMode ? 'text-white' : 'text-gray-900'
                          : isDarkMode ? 'text-slate-300' : 'text-gray-700'
                      }`}
                      numberOfLines={1}
                    >
                      {category.category_name}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>

          {/* Show categories assigned to other budgets */}
          {assignedToOther.length > 0 && (
            <View className="mt-4">
              <Text className={`text-xs mb-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                Assigned to other budgets:
              </Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {assignedToOther.map((category) => (
                  <View key={category.id} className="w-1/3 px-1.5 mb-3">
                    <View
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border opacity-50 ${
                        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-100 border-gray-300'
                      }`}
                    >
                      <View
                        className="w-12 h-12 rounded-xl items-center justify-center"
                        style={{ backgroundColor: category.color }}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={24}
                          color="#fff"
                        />
                      </View>
                      <Text
                        className={`text-xs text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                        numberOfLines={1}
                      >
                        {category.category_name}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};
