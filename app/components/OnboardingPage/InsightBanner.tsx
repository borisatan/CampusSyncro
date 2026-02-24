import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface InsightBannerProps {
  message: string;
  submessage?: string;
}

export const InsightBanner: React.FC<InsightBannerProps> = ({
  message,
  submessage,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);

  useEffect(() => {
    opacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(600, withTiming(0, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="bg-surfaceDark rounded-xl p-4 border border-accentTeal mb-4"
    >
      <View className="flex-row items-start">
        <Text className="text-2xl mr-2">✨</Text>
        <View className="flex-1">
          <Text className="text-textDark text-base font-medium">{message}</Text>
          {submessage && (
            <Text className="text-secondaryDark text-sm mt-1">{submessage}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
};
