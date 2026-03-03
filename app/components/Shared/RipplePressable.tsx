import React, { useRef, useState } from 'react';
import { Pressable, View, Animated, StyleSheet, PressableProps, ViewStyle, LayoutChangeEvent } from 'react-native';
import { Platform } from 'react-native';

interface RipplePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  rippleColor?: string;
  rippleDuration?: number;
  style?: ViewStyle;
  className?: string;
}

export const RipplePressable: React.FC<RipplePressableProps> = ({
  children,
  rippleColor = 'rgba(255, 255, 255, 0.2)',
  rippleDuration = 300,
  style,
  className,
  onPressIn,
  onPressOut,
  ...pressableProps
}) => {
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const rippleX = useRef(new Animated.Value(0)).current;
  const rippleY = useRef(new Animated.Value(0)).current;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<View>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const handlePressIn = (event: any) => {
    // Get touch position relative to the component
    const locationX = event.nativeEvent.locationX;
    const locationY = event.nativeEvent.locationY;

    const finalX = locationX !== undefined ? locationX : dimensions.width / 2;
    const finalY = locationY !== undefined ? locationY : dimensions.height / 2;

    // Set position synchronously using Animated.Value
    rippleX.setValue(finalX);
    rippleY.setValue(finalY);

    // Reset and start ripple animation
    rippleScale.setValue(0);
    rippleOpacity.setValue(1);

    Animated.parallel([
      Animated.timing(rippleScale, {
        toValue: 1,
        duration: rippleDuration,
        useNativeDriver: true,
      }),
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: rippleDuration,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    // Fade out any remaining ripple
    Animated.timing(rippleOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();

    onPressOut?.(event);
  };

  // Note: Disabled Android native ripple because it draws behind children with opaque backgrounds
  // Using custom ripple for all platforms ensures consistent behavior

  // Calculate ripple size to cover entire component
  const rippleSize = Math.max(dimensions.width, dimensions.height) * 2.5;

  // For iOS and older Android, use custom ripple animation
  return (
    <View style={[styles.container, style]} className={className} onLayout={handleLayout}>
      <Pressable
        ref={containerRef}
        style={styles.pressable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...pressableProps}
      >
        {({ pressed }) => (
          <>
            {children}
            {/* Base gray overlay on press - rendered after children so it's on top */}
            {pressed && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(128, 128, 128, 0.1)',
                  },
                ]}
                pointerEvents="none"
              />
            )}
            {/* Ripple overlay - rendered last so it's on top of everything */}
            <Animated.View
              style={[
                styles.ripple,
                {
                  width: rippleSize,
                  height: rippleSize,
                  borderRadius: rippleSize / 2,
                  backgroundColor: rippleColor,
                  opacity: rippleOpacity,
                  transform: [
                    { translateX: Animated.subtract(rippleX, rippleSize / 2) },
                    { translateY: Animated.subtract(rippleY, rippleSize / 2) },
                    { scale: rippleScale },
                  ],
                },
              ]}
              pointerEvents="none"
            />
          </>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  pressable: {
    position: 'relative',
  },
  ripple: {
    position: 'absolute',
  },
});
