import { MotiView } from "moti";
import React from "react";

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  isDarkMode: boolean;
  style?: object;
}

export const SkeletonBox = ({
  width,
  height,
  borderRadius = 8,
  isDarkMode,
  style,
}: SkeletonProps) => (
  <MotiView
    from={{ opacity: 0.5 }}
    animate={{ opacity: 1 }}
    transition={{
      type: "timing",
      duration: 800,
      loop: true,
    }}
    style={[
      {
        width,
        height,
        borderRadius,
        backgroundColor: isDarkMode ? "#2D3748" : "#E2E8F0",
      },
      style,
    ]}
  />
);

export const SkeletonCircle = ({
  size,
  isDarkMode,
  style,
}: {
  size: number;
  isDarkMode: boolean;
  style?: object;
}) => (
  <SkeletonBox
    width={size}
    height={size}
    borderRadius={size / 2}
    isDarkMode={isDarkMode}
    style={style}
  />
);

export const SkeletonText = ({
  width,
  isDarkMode,
  style,
  size = "md",
}: {
  width: number | string;
  isDarkMode: boolean;
  style?: object;
  size?: "sm" | "md" | "lg" | "xl";
}) => {
  const heights = {
    sm: 12,
    md: 16,
    lg: 20,
    xl: 28,
  };

  return (
    <SkeletonBox
      width={width}
      height={heights[size]}
      borderRadius={4}
      isDarkMode={isDarkMode}
      style={style}
    />
  );
};
