import { WifiOff } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

export function OfflineEmptyState() {
  const { isDarkMode } = useTheme();

  return (
    <View className="flex-1 items-center justify-center gap-3 py-16">
      <WifiOff size={40} color={isDarkMode ? '#6B7280' : '#9CA3AF'} />
      <Text className="text-white font-bold text-lg">You're offline</Text>
      <Text className="text-secondaryDark text-sm text-center px-8">
        Check your connection and pull down to refresh
      </Text>
    </View>
  );
}
