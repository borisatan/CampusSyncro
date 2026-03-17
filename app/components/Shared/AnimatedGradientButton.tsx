import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight } from "lucide-react-native";
import { MotiView } from "moti";
import React, { useMemo, useRef } from "react";
import { Pressable, Text, View } from "react-native";

interface AnimatedGradientButtonProps {
  onPress: () => void;
  text: string;
  disabled?: boolean;
  showIcon?: boolean;
  delay?: number;
  rounded?: "xl" | "3xl";
  gradientColors?: [string, string, string];
}

const ENTRANCE_FROM = { opacity: 0, translateY: 20 } as const;
const ENTRANCE_ANIMATE = { opacity: 1, translateY: 0 } as const;

const SHIMMER_FROM = { translateX: -400 } as const;
const SHIMMER_ANIMATE = { translateX: 400 } as const;
const SHIMMER_TRANSITION = {
  type: "timing",
  duration: 3000,
  loop: true,
  repeatDelay: 1500,
} as const;

const SHIMMER_STYLE = {
  position: "absolute" as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: 200,
};

export const AnimatedGradientButton = React.memo(function AnimatedGradientButton({
  onPress,
  text,
  disabled = false,
  showIcon = false,
  delay = 1000,
  rounded = "3xl",
  gradientColors = ["#1E40AF", "#3B7EFF", "#60A5FA"],
}: AnimatedGradientButtonProps) {
  const borderRadiusClass = rounded === "3xl" ? "rounded-3xl" : "rounded-xl";
  const entranceTransition = useMemo(() => ({ delay, duration: 600 }), [delay]);
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`[AnimatedGradientButton] render #${renderCount.current} — disabled=${disabled}`);

  return (
    <MotiView
      from={ENTRANCE_FROM}
      animate={ENTRANCE_ANIMATE}
      transition={entranceTransition}
    >
      {disabled ? (
        <View className={`w-full py-4 ${borderRadiusClass} bg-surfaceDark border border-borderDark`}>
          <Text className="text-lg text-center font-medium text-secondaryDark">
            {text}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={onPress}
          className={`w-full ${borderRadiusClass} overflow-hidden active:opacity-80`}
          android_ripple={{ color: "rgba(255, 255, 255, 0.1)" }}
        >
          <View className="relative overflow-hidden">
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

            {/* Shimmer effect */}
            <MotiView
              from={SHIMMER_FROM}
              animate={SHIMMER_ANIMATE}
              transition={SHIMMER_TRANSITION}
              style={SHIMMER_STYLE}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0)",
                  "rgba(255, 255, 255, 0.3)",
                  "rgba(255, 255, 255, 0)",
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={{ width: "100%", height: "100%" }}
              />
            </MotiView>
          </View>
        </Pressable>
      )}
    </MotiView>
  );
});
