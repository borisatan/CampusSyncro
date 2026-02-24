import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface CategoryGridItemProps {
  name: string;
  icon: string;
  color: string;
  selected: boolean;
  onToggle: () => void;
}

export const CategoryGridItem: React.FC<CategoryGridItemProps> = ({
  name,
  icon,
  color,
  selected,
  onToggle,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className="flex-1 rounded-xl p-4 items-center justify-center min-h-[120px]"
      style={{
        backgroundColor: '#20283A',
        borderWidth: selected ? 2 : 1,
        borderColor: selected ? '#3B82F6' : '#4B5563',
      }}
      activeOpacity={0.7}
    >
      <View className="items-center">
        <Ionicons name={icon as any} size={32} color={color} />
        <Text className="text-textDark text-sm font-medium mt-2 text-center">
          {name}
        </Text>
        {selected && (
          <View className="absolute -top-1 -right-1">
            <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
