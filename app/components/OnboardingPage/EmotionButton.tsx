import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface EmotionButtonProps {
  emoji: string;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function EmotionButton({ emoji, label, isSelected, onPress, index = 0 }: EmotionButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(400 + index * 100, withTiming(1, { duration: 400 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedTouchable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
      className={`w-full py-5 px-6 rounded-2xl mb-3 flex-row items-center border-2 border-borderDark ${isSelected ? 'bg-backgroundDark' : 'bg-surfaceDark'}`}
    >
      <Text className="text-4xl mr-4">{emoji}</Text>
      <Text className="text-lg font-semibold text-textDark flex-1">
        {label}
      </Text>

      {/* Checkmark indicator */}
      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-accentBlue items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </AnimatedTouchable>
  );
}
