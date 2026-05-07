import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface Props {
  suggestions: string[];
  onSelect: (value: string) => void;
  isDarkMode: boolean;
}

export const DescriptionSuggestions = ({ suggestions, onSelect, isDarkMode }: Props) => {
  if (suggestions.length === 0) return null;

  return (
    <View
      style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, marginTop: 4 }}
      className={`rounded-xl border-2 overflow-hidden ${
        isDarkMode ? "bg-inputDark border-borderDark" : "bg-background border-borderLight"
      }`}
    >
      {suggestions.map((item, index) => (
        <TouchableOpacity
          key={item}
          onPress={() => onSelect(item)}
          activeOpacity={0.7}
          className={`px-4 py-3 ${
            index < suggestions.length - 1
              ? isDarkMode
                ? "border-b border-borderDark"
                : "border-b border-borderLight"
              : ""
          }`}
        >
          <Text className={isDarkMode ? "text-textDark" : "text-textLight"}>{item}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};
