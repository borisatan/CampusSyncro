import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './context/ThemeContext';

export default function BudgetHelpScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className={`text-2xl font-semibold ${textPrimary}`}>
          Budget Help
        </Text>
      </View>

      {/* Content */}
      <View className="flex-1 px-4 pt-4">
        <Text className={`text-base leading-6 ${textSecondary}`}>
          This is the budget help page. More content coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}
