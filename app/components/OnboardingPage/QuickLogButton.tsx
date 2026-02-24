import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface QuickLogButtonProps {
  icon: string;
  label: string;
  amount: number;
  onPress: () => void;
}

export const QuickLogButton: React.FC<QuickLogButtonProps> = ({
  icon,
  label,
  amount,
  onPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 bg-surfaceDark rounded-xl p-4 border border-borderDark items-center active:opacity-70"
      activeOpacity={0.7}
    >
      <Text className="text-4xl mb-2">{icon}</Text>
      <Text className="text-textDark text-sm font-medium mb-1">{label}</Text>
      <Text className="text-secondaryDark text-xs">${amount}</Text>
    </TouchableOpacity>
  );
};
