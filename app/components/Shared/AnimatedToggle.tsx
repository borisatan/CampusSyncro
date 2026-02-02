import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  activeColor?: string;
  inactiveColor?: string;
  size?: 'sm' | 'md';
}

const CONFIGS = {
  sm: { trackW: 44, trackH: 26, thumbSize: 20, padding: 3 },
  md: { trackW: 50, trackH: 30, thumbSize: 24, padding: 3 },
};

export const AnimatedToggle: React.FC<AnimatedToggleProps> = ({
  value,
  onValueChange,
  activeColor = '#22c55e',
  inactiveColor = '#334155',
  size = 'sm',
}) => {
  const { trackW, trackH, thumbSize, padding } = CONFIGS[size];
  const travel = trackW - thumbSize - padding * 2;

  const progress = useDerivedValue(() =>
    withTiming(value ? 1 : 0, { duration: 200 })
  );

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [inactiveColor, activeColor]
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * travel }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View
        style={[
          {
            width: trackW,
            height: trackH,
            borderRadius: trackH / 2,
            padding,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              backgroundColor: '#FFFFFF',
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};
