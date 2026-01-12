import { Check } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isDarkMode?: boolean;
}

const BUDGET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#1F2937', // Dark Gray
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
  isDarkMode = true,
}) => {
  return (
    <View className="mb-6">
      <Text className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Color</Text>
      <View className="flex-row flex-wrap gap-3">
        {BUDGET_COLORS.map((color) => (
          <TouchableOpacity
            key={color}
            onPress={() => onColorSelect(color)}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              selectedColor === color ? 'border-2 border-white' : ''
            }`}
            style={{ backgroundColor: color }}
          >
            {selectedColor === color && (
              <Check size={20} color="#FFFFFF" strokeWidth={3} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export { BUDGET_COLORS };
