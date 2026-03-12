import React, { useRef, useState } from "react";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

interface RipplePressableProps extends Omit<PressableProps, "style"> {
  children: React.ReactNode;
  rippleColor?: string;
  rippleDuration?: number;
  fadeOutDuration?: number;
  style?: ViewStyle;
  className?: string;
}

export const RipplePressable: React.FC<RipplePressableProps> = ({
  children,
  rippleColor = "rgba(255, 255, 255, 0.2)",
  rippleDuration = 600,
  fadeOutDuration = 300,
  style,
  className,
  onPressIn,
  onPressOut,
  ...pressableProps
}) => {
  const rippleScale = useRef(new Animated.Value(0)).current;
  const rippleOpacity = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const rippleX = useRef(new Animated.Value(0)).current;
  const rippleY = useRef(new Animated.Value(0)).current;
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [layoutPosition, setLayoutPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<View>(null);
  const fadeOutAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });

    // Measure the container's position on screen
    containerRef.current?.measureInWindow((x, y) => {
      setLayoutPosition({ x, y });
    });
  };

  const handlePressIn = (event: any) => {
    // Cancel any ongoing fade-out animation
    if (fadeOutAnimationRef.current) {
      fadeOutAnimationRef.current.stop();
      fadeOutAnimationRef.current = null;
    }

    // Use pageX/pageY (absolute screen coordinates) for more reliable positioning
    const pageX = event.nativeEvent.pageX;
    const pageY = event.nativeEvent.pageY;

    // Calculate relative position by subtracting container's position
    let finalX = dimensions.width / 2; // default to center
    let finalY = dimensions.height / 2;

    if (pageX !== undefined && pageY !== undefined) {
      finalX = pageX - layoutPosition.x;
      finalY = pageY - layoutPosition.y;
    }

    // Set position synchronously using Animated.Value
    rippleX.setValue(finalX);
    rippleY.setValue(finalY);

    // Reset and start ripple animation
    rippleScale.setValue(0.05);
    rippleOpacity.setValue(1);
    overlayOpacity.setValue(1);

    Animated.timing(rippleScale, {
      toValue: 1,
      duration: rippleDuration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    // Smoothly fade out both ripple and overlay
    fadeOutAnimationRef.current = Animated.parallel([
      Animated.timing(rippleOpacity, {
        toValue: 0,
        duration: fadeOutDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: fadeOutDuration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]);

    fadeOutAnimationRef.current.start(() => {
      fadeOutAnimationRef.current = null;
    });

    onPressOut?.(event);
  };

  // Note: Disabled Android native ripple because it draws behind children with opaque backgrounds
  // Using custom ripple for all platforms ensures consistent behavior

  // Calculate ripple width to cover entire component horizontally
  const rippleWidth = dimensions.width * 40;
  const rippleHeight = dimensions.height;

  // For iOS and older Android, use custom ripple animation
  return (
    <Pressable
      ref={containerRef}
      style={[styles.container, style]}
      className={className}
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...pressableProps}
    >
      <>
        {children}
        {/* Base gray overlay on press - rendered after children so it's on top */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: "rgba(128, 128, 128, 0.1)",
              opacity: overlayOpacity,
            },
          ]}
          pointerEvents="none"
        />
        {/* Ripple overlay - rendered last so it's on top of everything */}
        <Animated.View
          style={[
            styles.ripple,
            {
              width: rippleWidth,
              height: rippleHeight,
              borderRadius: 16,
              backgroundColor: rippleColor,
              opacity: rippleOpacity,
              transform: [
                { translateX: Animated.subtract(rippleX, rippleWidth / 2) },
                { translateY: 0 },
                { scaleX: rippleScale },
              ],
            },
          ]}
          pointerEvents="none"
        />
      </>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  ripple: {
    position: "absolute",
  },
});
