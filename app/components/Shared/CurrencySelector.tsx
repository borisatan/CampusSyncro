import { Ionicons } from "@expo/vector-icons";
import { Globe } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, Text, View } from "react-native";
import { getCurrencySymbol, SupportedCurrency } from "../../types/types";

const CURRENCIES: { code: SupportedCurrency; symbol: string; name: string }[] = [
  { code: "USD", symbol: getCurrencySymbol("USD"), name: "US Dollar" },
  { code: "EUR", symbol: getCurrencySymbol("EUR"), name: "Euro" },
  { code: "GBP", symbol: getCurrencySymbol("GBP"), name: "British Pound" },
  { code: "CAD", symbol: getCurrencySymbol("CAD"), name: "CA Dollar" },
  { code: "AUD", symbol: getCurrencySymbol("AUD"), name: "AU Dollar" },
  { code: "NZD", symbol: getCurrencySymbol("NZD"), name: "NZ Dollar" },
  { code: "CHF", symbol: getCurrencySymbol("CHF"), name: "Swiss Franc" },
  { code: "JPY", symbol: getCurrencySymbol("JPY"), name: "Japanese Yen" },
  { code: "CNY", symbol: getCurrencySymbol("CNY"), name: "Chinese Yuan" },
  { code: "INR", symbol: getCurrencySymbol("INR"), name: "Indian Rupee" },
  { code: "BRL", symbol: getCurrencySymbol("BRL"), name: "Brazilian Real" },
  { code: "MXN", symbol: getCurrencySymbol("MXN"), name: "Mexican Peso" },
  { code: "ZAR", symbol: getCurrencySymbol("ZAR"), name: "South African Rand" },
  { code: "SEK", symbol: getCurrencySymbol("SEK"), name: "Swedish Krona" },
];

const CurrencyRow = ({
  currency,
  isDarkMode,
  isSelected,
  onSelect,
  isLast,
  animOpacity,
  animTranslateY,
}: {
  currency: { code: string; symbol: string; name: string };
  isDarkMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
  animOpacity: Animated.Value;
  animTranslateY: Animated.Value;
}) => (
  <Animated.View style={{ opacity: animOpacity, transform: [{ translateY: animTranslateY }] }}>
    <Pressable
      onPress={onSelect}
      className={`px-4 py-4 flex-row items-center justify-between ${
        !isLast
          ? isDarkMode
            ? "border-b border-borderDark"
            : "border-b border-borderLight"
          : ""
      } ${isSelected ? (isDarkMode ? "bg-backgroundDark" : "bg-backgroundMuted") : ""}`}
    >
      <View className="flex-row items-center">
        <Text
          className={`text-xl mr-3 ${isDarkMode ? "text-textDark" : "text-textLight"}`}
        >
          {currency.symbol}
        </Text>
        <View>
          <Text
            className={`font-medium ${isDarkMode ? "text-textDark" : "text-textLight"}`}
          >
            {currency.name}
          </Text>
          <Text
            className={`text-xs ${isDarkMode ? "text-secondaryDark" : "text-secondaryLight"}`}
          >
            {currency.code}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={isDarkMode ? "#B2A4FF" : "#2563EB"}
        />
      )}
    </Pressable>
  </Animated.View>
);

interface CurrencySelectorProps {
  selectedCurrency: string;
  onSelect: (code: string) => void;
  isDarkMode?: boolean;
}

export const CurrencySelector = ({
  selectedCurrency,
  onSelect,
  isDarkMode = true,
}: CurrencySelectorProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    CURRENCIES.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  const textPrimary = isDarkMode ? "text-white" : "text-black";
  const textSecondary = isDarkMode ? "text-secondaryDark" : "text-secondaryLight";
  const cardBg = isDarkMode
    ? "bg-surfaceDark border-borderDark"
    : "bg-white border-borderLight";

  useEffect(() => {
    if (showPicker) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
      Animated.stagger(
        40,
        itemAnims.map((anim) =>
          Animated.parallel([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 260,
              useNativeDriver: true,
            }),
            Animated.timing(anim.translateY, {
              toValue: 0,
              duration: 260,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    }
  }, [showPicker]);

  const togglePicker = () => {
    if (!showPicker) {
      fadeAnim.setValue(0);
      itemAnims.forEach((anim) => {
        anim.opacity.setValue(0);
        anim.translateY.setValue(10);
      });
      setShowPicker(true);
    } else {
      setShowPicker(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={togglePicker}
        className={`flex-row items-center border rounded-2xl p-4 mb-3 ${cardBg}`}
      >
        <View className="w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center mr-3">
          <Globe color="white" size={20} />
        </View>
        <View className="flex-1">
          <Text className={`font-medium ${textPrimary}`}>Currency</Text>
          <Text className={`text-sm ${textSecondary}`}>
            {CURRENCIES.find((c) => c.code === selectedCurrency)?.name ||
              selectedCurrency}
          </Text>
        </View>
        <Ionicons
          name={showPicker ? "chevron-up" : "chevron-down"}
          size={20}
          color={isDarkMode ? "#9CA3AF" : "#4B5563"}
        />
      </Pressable>

      {showPicker && (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className={`mb-3 rounded-xl border ${cardBg}`}
        >
          <ScrollView
            nestedScrollEnabled
            bounces={false}
            style={{ maxHeight: 300, overflow: "hidden", borderRadius: 12 }}
          >
            {CURRENCIES.map((currency, index) => (
              <CurrencyRow
                key={currency.code}
                currency={currency}
                isDarkMode={isDarkMode}
                isSelected={selectedCurrency === currency.code}
                onSelect={() => {
                  onSelect(currency.code);
                  setShowPicker(false);
                }}
                isLast={index === CURRENCIES.length - 1}
                animOpacity={itemAnims[index].opacity}
                animTranslateY={itemAnims[index].translateY}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </>
  );
};
