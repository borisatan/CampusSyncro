import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import React from "react";
import { Pressable, Text, View } from "react-native";

interface AnimatedGradientButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
  showIcon?: boolean;
  rounded?: "xl" | "3xl";
  gradientColors?: [string, string, string];
}

export const AnimatedGradientButton = React.memo(function AnimatedGradientButton({
  onPress,
  text,
  disabled = false,
  showIcon = false,
  rounded = "3xl",
  gradientColors = ["#1E40AF", "#3B7EFF", "#60A5FA"],
}: AnimatedGradientButtonProps) {
  const borderRadiusClass = rounded === "3xl" ? "rounded-3xl" : "rounded-xl";

  if (disabled) {
    return (
      <View className={`w-full py-4 ${borderRadiusClass} bg-surfaceDark border border-borderDark`}>
        <Text className="text-lg text-center font-medium text-secondaryDark">
          {text}
        </Text>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      className={`w-full ${borderRadiusClass} overflow-hidden active:opacity-80`}
      android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: "100%" }}
      >
        <View className="py-5 flex-row items-center justify-center gap-2">
          <Text className="text-white text-lg font-medium">{text}</Text>
          {showIcon && <ArrowRight size={20} color="#ffffff" />}
        </View>
      </LinearGradient>
    </Pressable>
  );
});
