import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ValueCardProps {
  icon: string;
  label: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function ValueCard({ icon, label, color, isSelected, onPress, index = 0 }: ValueCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(400 + index * 80, withTiming(1, { duration: 400 }));
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

  // Get outline version of icon
  const outlineIcon = icon.includes('-outline') ? icon : `${icon}-outline`;

  return (
    <AnimatedTouchable
      style={animatedStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
      className={`flex-1 m-2 p-4 rounded-2xl items-center justify-center min-h-[120px] border-2 border-borderDark ${isSelected ? 'bg-backgroundDark' : 'bg-surfaceDark'}`}
    >
      <View
        style={{ backgroundColor: color }}
        className="w-14 h-14 rounded-xl items-center justify-center mb-3"
      >
        <Ionicons
          name={outlineIcon as any}
          size={28}
          color="#FFFFFF"
        />
      </View>
      <Text className="text-sm font-medium text-center text-textDark">
        {label}
      </Text>

      {/* Checkmark indicator */}
      {isSelected && (
        <View className="absolute top-2 right-2 w-6 h-6 rounded-full bg-accentBlue items-center justify-center">
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        </View>
      )}
    </AnimatedTouchable>
  );
}
