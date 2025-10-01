import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Category } from '../../types/types';

interface CategoryGridProps {
  categories: Category[];
  isEditMode: boolean;
  onEditCategory: (category: Category | null) => void;
  onDeleteCategory: (category: Category) => void;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({
  categories,
  isEditMode,
  onEditCategory,
  onDeleteCategory,
}) => {
  const { isDarkMode } = useTheme();

  const renderRows = () => {
    if (!categories) return null;

    // Add the "Add" button as a pseudo-category if in edit mode
    const displayCategories: (Category | { id: string; category_name: string; isAddButton: true })[] = [
      ...categories,
    ];

    if (isEditMode) {
      displayCategories.push({
        id: 'add-tile',
        category_name: 'Add',
        isAddButton: true,
      } as any);
    }

    const rows = [];
    for (let i = 0; i < displayCategories.length; i += 3) {
      const rowItems = displayCategories.slice(i, i + 3);

      rows.push(
        <View key={`row-${i}`} className="flex-row justify-start mb-5">
          {rowItems.map((category: any) => {
            const isAddButton = category.isAddButton;

            return (
              <View key={category.id} className="w-[32%] items-center mr-[1%]">
                <TouchableOpacity
                  className="w-20 h-20 rounded-3xl justify-center items-center mb-2 relative"
                  style={{
                    backgroundColor: isAddButton
                      ? '#ffffff'
                      : category.color ?? '#ccc',
                  }}
                  onPress={() =>
                    isAddButton ? onEditCategory(null) : onEditCategory(category)
                  }
                >
                  <Ionicons
                    name={isAddButton ? 'add-outline' : (category.icon as any)}
                    size={24}
                    color={isAddButton ? 'black' : 'white'}
                  />

                  {!isAddButton && isEditMode && (
                    <TouchableOpacity
                      onPress={() => onDeleteCategory(category)}
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                    >
                      <Ionicons name="remove" size={16} color="white" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                <Text
                  className={
                    isDarkMode
                      ? 'text-gray-200 text-sm'
                      : 'text-gray-800 text-sm'
                  }
                >
                  {isAddButton ? 'Add' : category.category_name ?? 'Unknown'}
                </Text>
              </View>
            );
          })}
        </View>
      );
    }

    return rows;
  };

  return <>{renderRows()}</>;
};

export default CategoryGrid;
