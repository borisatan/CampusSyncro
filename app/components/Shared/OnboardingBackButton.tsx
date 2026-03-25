import { ChevronLeft } from "lucide-react-native";
import React from "react";
import { Pressable } from "react-native";

interface OnboardingBackButtonProps {
  onPress: () => void;
}

export const OnboardingBackButton = React.memo(function OnboardingBackButton({
  onPress,
}: OnboardingBackButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className="active:opacity-60"
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: "#8A96B4",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ChevronLeft size={18} color="#8A96B4" />
    </Pressable>
  );
});
