import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  LayoutAnimation,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withSpring,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { useIncomeStore } from "../../store/useIncomeStore";
import { AnimatedToggle } from "../Shared/AnimatedToggle";

// Animated SVG circle for the gauge
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface IncomeCardProps {
  income: number;
  currencySymbol: string;
  useDynamicIncome: boolean;
  manualIncome: number;
  dynamicIncome: number;
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
  isDarkMode,
  onSave,
}) => {
  // Subscribe to totalBudgeted and savings target from store for reactive updates
  const totalBudgeted = useIncomeStore((state) => state.totalBudgeted);
  const monthlySavingsTarget = useIncomeStore(
    (state) => state.monthlySavingsTarget,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUseDynamic, setLocalUseDynamic] = useState(useDynamicIncome);
  const [localManualIncome, setLocalManualIncome] = useState(
    manualIncome > 0 ? manualIncome.toString() : "",
  );

  // Include monthly savings in total allocated amount
  const totalAllocated = totalBudgeted + monthlySavingsTarget;
  const remaining = income - totalAllocated;
  const allocationPercent = income > 0 ? (totalAllocated / income) * 100 : 0;
  const ringPercent = Math.min(allocationPercent, 100);
  const isOverAllocated = remaining < 0;

  // Ring animation
  const ringSize = 72;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const ringProgress = useSharedValue(0);

  useEffect(() => {
    ringProgress.value = withDelay(
      200,
      withSpring(ringPercent / 100, { damping: 18, stiffness: 80 }),
    );
  }, [ringPercent]);

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - ringProgress.value),
  }));

  // Sync local state when props change
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

  const ringColor =
    allocationPercent < 30
      ? "#EF4444" // Red: < 30%
      : allocationPercent < 80
        ? "#F59E0B" // Yellow: 30-80%
        : "#22C55E"; // Green: >= 80%

  return (
    <View
      className="rounded-2xl mb-4 overflow-hidden"
      style={{
        backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
        borderWidth: 1,
        borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
      }}
    >
      {/* Main card — compact gauge layout */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.8}
        className="px-4 py-4"
      >
        <View className="flex-row items-center">
          {/* Progress Ring */}
          <View className="mr-4" style={{ width: ringSize, height: ringSize }}>
            <Svg width={ringSize} height={ringSize}>
              {/* Track */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={isDarkMode ? "#4B5563" : "#E2E8F0"}
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Progress */}
              <AnimatedCircle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                animatedProps={ringAnimatedProps}
                transform={`rotate(-90, ${ringSize / 2}, ${ringSize / 2})`}
              />
            </Svg>
            {/* Center text */}
            <View className="absolute inset-0 items-center justify-center">
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: ringColor }}
              >
                {Math.round(allocationPercent)}%
              </Text>
            </View>
          </View>

          {/* Income info */}
          <View className="flex-1">
            <Text
              className="text-md mb-1"
              style={{ color: isDarkMode ? "#8B99AE" : "#64748B" }}
            >
              Monthly Income
            </Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: "700",
                color: isDarkMode ? "#F1F5F9" : "#0F172A",
                letterSpacing: -0.5,
              }}
            >
              {formatAmount(income, currencySymbol)}
            </Text>
          </View>

          {/* Chevron */}
          <View
            className="w-8 h-8 rounded-xl items-center justify-center"
            style={{ backgroundColor: "#20283A" }}
          >
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* Allocated / Remaining stats */}
        <View className="flex-row mt-4" style={{ gap: 12 }}>
          <View
            className="flex-1 rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
              borderWidth: 1,
              borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
            }}
          >
            <Text
              className="text-xs mb-0.5"
              style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8" }}
            >
              Allocated
            </Text>
            <Text
              className="font-semibold"
              style={{
                fontSize: 16,
                color: isDarkMode ? "#F1F5F9" : "#334155",
              }}
            >
              {formatAmount(totalAllocated, currencySymbol)}
            </Text>
          </View>
          <View
            className="flex-1 rounded-xl px-3 py-2.5"
            style={{
              backgroundColor: isOverAllocated
                ? isDarkMode
                  ? "rgba(239,68,68,0.1)"
                  : "rgba(239,68,68,0.06)"
                : isDarkMode
                  ? "#1F2937"
                  : "#F1F5F9",
              borderWidth: 1,
              borderColor: isOverAllocated
                ? isDarkMode
                  ? "rgba(239,68,68,0.3)"
                  : "rgba(239,68,68,0.2)"
                : isDarkMode
                  ? "#4B5563"
                  : "#E2E8F0",
            }}
          >
            <Text
              className="text-xs mb-0.5"
              style={{
                color: isOverAllocated
                  ? "#EF4444"
                  : isDarkMode
                    ? "#64748B"
                    : "#94A3B8",
              }}
            >
              {isOverAllocated ? "Over Budget" : "Remaining"}
            </Text>
            <Text
              className="font-semibold"
              style={{
                fontSize: 16,
                color: isOverAllocated
                  ? "#EF4444"
                  : isDarkMode
                    ? "#22C55E"
                    : "#22C55E",
              }}
            >
              {formatAmount(remaining, currencySymbol)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Editor Section */}
      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(250)}
          className="px-4 pb-4"
          style={{
            borderTopWidth: 1,
            borderTopColor: isDarkMode ? "#4B5563" : "#E2E8F0",
            paddingTop: 16,
          }}
        >
          {/* Dynamic Income Toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text
                className="font-medium"
                style={{ color: isDarkMode ? "#E2E8F0" : "#1E293B" }}
              >
                Dynamic Income
              </Text>
              <Text
                className="text-xs mt-0.5"
                style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8" }}
              >
                Auto-calculate from transactions
              </Text>
            </View>
            <AnimatedToggle
              value={localUseDynamic}
              onValueChange={setLocalUseDynamic}
              activeColor="#2A9D8F"
              inactiveColor={isDarkMode ? "#334155" : "#CBD5E1"}
            />
          </View>

          {/* Manual Income Input */}
          {!localUseDynamic && (
            <Animated.View entering={FadeIn.duration(200)} className="mb-4">
              <Text
                className="text-xs mb-2 uppercase tracking-wider"
                style={{
                  color: isDarkMode ? "#8B99AE" : "#94A3B8",
                  letterSpacing: 0.5,
                }}
              >
                Monthly Amount
              </Text>
              <View
                className="flex-row items-center px-4 h-12 rounded-xl"
                style={{
                  backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                  borderWidth: 1,
                  borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
                }}
              >
                <Text
                  className="text-lg mr-2"
                  style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8" }}
                >
                  {currencySymbol}
                </Text>
                <TextInput
                  value={localManualIncome}
                  onChangeText={setLocalManualIncome}
                  placeholder="0"
                  placeholderTextColor={isDarkMode ? "#334155" : "#CBD5E1"}
                  keyboardType="decimal-pad"
                  className="flex-1 text-lg"
                  style={{
                    color: isDarkMode ? "#F1F5F9" : "#0F172A",
                    textAlignVertical: "center",
                    paddingVertical: 0,
                  }}
                />
              </View>
            </Animated.View>
          )}

          {/* Dynamic Income Display */}
          {localUseDynamic && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className="mb-4 p-4 rounded-xl"
              style={{
                backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                borderWidth: 1,
                borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
              }}
            >
              <Text
                className="text-xs uppercase tracking-wider"
                style={{
                  color: isDarkMode ? "#8B99AE" : "#94A3B8",
                  letterSpacing: 0.5,
                }}
              >
                This Month
              </Text>
              <Text
                className="text-2xl font-bold mt-1"
                style={{ color: isDarkMode ? "#F1F5F9" : "#0F172A" }}
              >
                {formatAmount(dynamicIncome, currencySymbol)}
              </Text>
              <Text
                className="text-xs mt-1.5 italic"
                style={{ color: isDarkMode ? "#64748B" : "#94A3B8" }}
              >
                Based on Income transactions this month
              </Text>
            </Animated.View>
          )}

          {/* Cancel / Save buttons */}
          <View className="flex-row" style={{ gap: 10 }}>
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 py-3 rounded-xl items-center justify-center"
              style={{
                backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                borderWidth: 1,
                borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
              }}
              activeOpacity={0.7}
            >
              <Text
                className="font-semibold text-base"
                style={{ color: isDarkMode ? "#94A3B8" : "#64748B" }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-3 rounded-xl items-center justify-center"
              style={{ backgroundColor: "#2A9D8F" }}
              activeOpacity={0.7}
            >
              <Text
                className="font-semibold text-base"
                style={{ color: "#FFFFFF" }}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};
