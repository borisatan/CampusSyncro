import { WifiOff } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Text } from './AppText';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetwork } from '../../context/NetworkContext';

export function OfflineBanner() {
  const { isConnected } = useNetwork();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-(60 + insets.top));

  useEffect(() => {
    translateY.value = withTiming(isConnected ? -(60 + insets.top) : 0, { duration: 300 });
  }, [isConnected, insets.top]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
        },
      ]}
    >
      <View
        style={{ paddingTop: insets.top }}
        className="bg-red-500 flex-row items-center justify-center gap-2 px-4 py-2"
      >
        <WifiOff size={14} color="white" />
        <Text className="text-white text-sm font-medium">No internet connection</Text>
      </View>
    </Animated.View>
  );
}
