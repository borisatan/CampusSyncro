import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onBack?: () => void; // optional callback for back button
  title?: string; // optional, defaults to "Categories"
}

const Header: React.FC<HeaderProps> = ({ isEditMode, onToggleEditMode, onBack, title = 'Categories' }) => {
  const { isDarkMode } = useTheme();

  return (
    <View className="flex-row justify-between items-center px-4 py-3">
      <TouchableOpacity className="p-2" onPress={onBack}>
        <Ionicons name="chevron-back" size={24} color={isDarkMode ? "white" : "black"} />
      </TouchableOpacity>

      <Text className={isDarkMode ? "text-2xl font-semibold text-textDark" : "text-base font-semibold text-textLight"}>
        {title}
      </Text>

      <TouchableOpacity 
        onPress={onToggleEditMode}
        className={`px-3 py-1 rounded-lg w-16 items-center bg-accentTeal`}
      >
        <Text className={`text-base font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
          {isEditMode ? 'Done' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Header;
