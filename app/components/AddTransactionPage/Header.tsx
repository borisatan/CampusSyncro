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
    <View className="relative px-4 py-3">
      <Text
        className={`text-3xl font-semibold text-center ${
          isDarkMode ? 'text-textDark' : 'text-textLight'
        }`}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={onToggleEditMode}
        className={`absolute right-4 top-7 -translate-y-1/2 px-6 py-1 rounded-lg bg-accentTeal items-center`}
        
      >
        <Text
          className={`text-base font-medium ${
            isDarkMode ? 'text-textDark' : 'text-textLight'
          }`}
        >
          {isEditMode ? 'Done' : 'Edit'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Header;
