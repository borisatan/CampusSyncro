import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutAnimation,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { AnimatedRollingNumber } from "react-native-animated-rolling-numbers";
import { AnimatedToggle } from "../Shared/AnimatedToggle";

// Animated wrapper for staggered fade-in effect
const AnimatedRow: React.FC<{ index: number; children: React.ReactNode }> = ({
  index,
  children,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
    >
      {children}
    </Animated.View>
  );
};

interface IncomeCardProps {
  income: number;
  currencySymbol: string;
  useDynamicIncome: boolean;
  manualIncome: number;
  dynamicIncome: number;
  totalBudgeted: number;
  isDarkMode: boolean;
  onSave: (useDynamic: boolean, manualIncome: number) => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  currencySymbol,
  useDynamicIncome,
  manualIncome,
  dynamicIncome,
  totalBudgeted,
  isDarkMode,
  onSave,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUseDynamic, setLocalUseDynamic] = useState(useDynamicIncome);
  const [localManualIncome, setLocalManualIncome] = useState(
    manualIncome > 0 ? manualIncome.toString() : "",
  );

  const remaining = income - totalBudgeted;

  // Sync local state when props change (e.g., after refresh)
  useEffect(() => {
    if (!isExpanded) {
      setLocalUseDynamic(useDynamicIncome);
      setLocalManualIncome(manualIncome > 0 ? manualIncome.toString() : "");
    }
  }, [useDynamicIncome, manualIncome, isExpanded]);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isExpanded) {
      setLocalUseDynamic(useDynamicIncome);
      setLocalManualIncome(manualIncome > 0 ? manualIncome.toString() : "");
    }
    setIsExpanded(!isExpanded);
  };

  const handleSave = () => {
    const incomeValue = parseFloat(localManualIncome) || 0;
    onSave(localUseDynamic, incomeValue);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  };

  const handleCancel = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLocalUseDynamic(useDynamicIncome);
    setLocalManualIncome(manualIncome > 0 ? manualIncome.toString() : "");
    setIsExpanded(false);
  };

  return (
    <View className="bg-accentBlue rounded-2xl mb-4 overflow-hidden border border-borderDark">
      {/* Main card content */}
      <View className="p-5">
        {/* Header with chevron */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-white/80 text-sm">Total Monthly Income</Text>
          <TouchableOpacity
            onPress={handleToggleExpand}
            className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={18}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Income amount */}
        <View className="flex-row items-center mb-4">
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#FFFFFF" }}>
            {currencySymbol}
          </Text>
          <AnimatedRollingNumber
            value={income}
            spinningAnimationConfig={{ duration: 600 }}
            textStyle={{ fontSize: 32, fontWeight: "700", color: "#FFFFFF" }}
            toFixed={0}
          />
        </View>

        {/* Allocated / Remaining row */}
        <View className="flex-row">
          <View className="flex-1">
            <Text className="text-white/60 text-xs mb-0.5">Allocated</Text>
            <Text className="text-white text-lg font-semibold">
              {formatAmount(totalBudgeted, currencySymbol)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-white/60 text-xs mb-0.5">Remaining</Text>
            <Text
              className="text-lg font-semibold"
              style={{ color: remaining < 0 ? "#fca5a5" : "#FFFFFF" }}
            >
              {formatAmount(remaining, currencySymbol)}
            </Text>
          </View>
        </View>
      </View>

      {/* Expanded Editor Section - same blue bg */}
      {isExpanded && (
        <View className="border-t border-white/15 px-5 pt-5 pb-5 bg-surfaceDark rounded-b-2xl">
          {/* Dynamic Income Toggle */}
          <AnimatedRow index={0}>
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-1 mr-3">
                <Text className="text-white font-medium">
                  Use Dynamic Income
                </Text>
                <Text className="text-white/50 text-xs mt-0.5">
                  Calculate based on recent transactions
                </Text>
              </View>
              <AnimatedToggle
                value={localUseDynamic}
                onValueChange={setLocalUseDynamic}
                activeColor="rgba(255,255,255,0.5)"
                inactiveColor="rgba(255,255,255,0.2)"
              />
            </View>
          </AnimatedRow>

          {/* Manual Income Input */}
          {!localUseDynamic && (
            <AnimatedRow index={1}>
              <View className="mb-4">
                <Text className="text-white/80 text-sm mb-2">
                  Monthly Income Amount
                </Text>
                <View
                  className="flex-row items-center px-4 py-3 rounded-xl border border-white/20"
                  style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
                >
                  <Text className="text-white/60 text-lg mr-2">
                    {currencySymbol}
                  </Text>
                  <TextInput
                    value={localManualIncome}
                    onChangeText={setLocalManualIncome}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="decimal-pad"
                    className="flex-1 text-lg text-white"
                  />
                </View>
              </View>
            </AnimatedRow>
          )}

          {/* Dynamic Income Display */}
          {localUseDynamic && (
            <AnimatedRow index={1}>
              <View
                className="mb-4 p-4 rounded-xl border border-white/20"
                style={{ backgroundColor: "rgba(0,0,0,0.15)" }}
              >
                <Text className="text-white/60 text-sm">
                  This Month's Income
                </Text>
                <Text className="text-white text-2xl font-bold mt-1">
                  {formatAmount(dynamicIncome, currencySymbol)}
                </Text>
                <Text className="text-white/40 text-xs mt-2 italic">
                  Based on transactions in the Income category this month
                </Text>
              </View>
            </AnimatedRow>
          )}

          {/* Cancel / Save buttons */}
          <AnimatedRow index={2}>
            <View className="flex-row gap-3 mt-1">
              <TouchableOpacity
                onPress={handleCancel}
                className="flex-1 py-3 rounded-xl items-center justify-center bg-surfaceDark border border-borderDark"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-base">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 py-3 rounded-xl items-center justify-center bg-accentBlue"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-base">Save</Text>
              </TouchableOpacity>
            </View>
          </AnimatedRow>
        </View>
      )}
    </View>
  );
};
