import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface CategoryListItemProps {
  name: string;
  icon: string;
  color: string;
  isSelected: boolean;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function CategoryListItem({
  name,
  icon,
  color,
  isSelected,
  onPress,
  index = 0,
}: CategoryListItemProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(400 + index * 60, withTiming(1, { duration: 350 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  // Use outline version of the icon
  const outlineIcon = `${icon}-outline` as any;

  return (
    <AnimatedTouchable
      style={animatedStyle}
      onPress={handlePress}
      activeOpacity={0.7}
      className={`flex-row items-center py-4 px-4 rounded-xl mb-2 border border-borderDark ${isSelected ? 'bg-backgroundDark' : 'bg-surfaceDark'}`}
    >
      {/* Icon Circle */}
      <View
        className="w-11 h-11 rounded-xl items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <Ionicons name={outlineIcon} size={22} color="#FFFFFF" />
      </View>

      {/* Name */}
      <Text className="flex-1 text-textDark text-base font-medium ml-4">
        {name}
      </Text>

      {/* Checkbox */}
      <View
        className={`
          w-6 h-6 rounded-md items-center justify-center
          ${isSelected ? 'bg-accentBlue' : 'border-2 border-borderDark'}
        `}
      >
        {isSelected && (
          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
        )}
      </View>
    </AnimatedTouchable>
  );
}
