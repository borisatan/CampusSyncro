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
    maximumFractionDigits: 2,
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
  const totalBudgeted = useIncomeStore((state) => state.totalBudgeted);
  const monthlySavingsTarget = useIncomeStore(
    (state) => state.monthlySavingsTarget,
  );
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUseDynamic, setLocalUseDynamic] = useState(useDynamicIncome);
  const [localManualIncome, setLocalManualIncome] = useState(
    manualIncome > 0 ? manualIncome.toString() : "",
  );

  const totalAllocated = totalBudgeted + monthlySavingsTarget;
  const remaining = income - totalAllocated;
  const allocationPercent = income > 0 ? (totalAllocated / income) * 100 : 0;
  const ringPercent = Math.min(allocationPercent, 100);
  const isOverAllocated = remaining < 0;

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
      ? "#F2514A"
      : allocationPercent < 80
        ? "#F4A623"
        : "#22D97A";

  return (
    <View
      className={`rounded-2xl mb-4 overflow-hidden border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-surfaceLight border-slate100'
      }`}
    >
      {/* Main card */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.8}
        className="px-4 py-4"
      >
        <View className="flex-row items-center">
          {/* Progress Ring */}
          <View className="mr-4" style={{ width: ringSize, height: ringSize }}>
            <Svg width={ringSize} height={ringSize}>
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={radius}
                stroke={isDarkMode ? "#2A3250" : "#E2E8F0"}
                strokeWidth={strokeWidth}
                fill="none"
              />
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
            <View className="absolute inset-0 items-center justify-center">
              <Text style={{ fontSize: 14, fontWeight: "700", color: ringColor }}>
                {Math.round(allocationPercent)}%
              </Text>
            </View>
          </View>

          {/* Income info */}
          <View className="flex-1">
            <Text className={`text-md mb-1 ${isDarkMode ? 'text-secondaryDark' : 'text-slate400'}`}>
              Monthly Income
            </Text>
            <Text
              className={`font-bold ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}
              style={{ fontSize: 26, letterSpacing: -0.5 }}
            >
              {formatAmount(income, currencySymbol)}
            </Text>
          </View>

          {/* Chevron */}
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-surfaceDark">
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#EDF0FA"
            />
          </View>
        </View>

        {/* Allocated / Remaining stats */}
        <View className="flex-row mt-4 gap-3">
          <View
            className={`flex-1 rounded-xl px-3 py-2.5 border ${
              isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
            }`}
          >
            <Text className={`text-xs mb-0.5 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
              Allocated
            </Text>
            <Text className={`font-semibold text-base ${isDarkMode ? 'text-slate50' : 'text-slate600'}`}>
              {formatAmount(totalAllocated, currencySymbol)}
            </Text>
          </View>
          <View
            className={`flex-1 rounded-xl px-3 py-2.5 border ${
              isOverAllocated
                ? isDarkMode
                  ? 'bg-overlayRed border-overlayRedDark'
                  : 'bg-overlayRedLight border-overlayRedMedium'
                : isDarkMode
                  ? 'bg-inputDark border-borderDark'
                  : 'bg-slate50 border-slate100'
            }`}
          >
            <Text
              className={`text-xs mb-0.5 ${
                isOverAllocated ? 'text-accentRed' : isDarkMode ? 'text-slate400' : 'text-slate300'
              }`}
            >
              {isOverAllocated ? "Over Budget" : "Remaining"}
            </Text>
            <Text
              className={`font-semibold text-base ${
                isOverAllocated ? 'text-accentRed' : 'text-accentGreen'
              }`}
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
          className={`px-4 pb-4 pt-4 border-t ${isDarkMode ? 'border-borderDark' : 'border-slate100'}`}
        >
          {/* Dynamic Income Toggle */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-3">
              <Text className={`font-medium ${isDarkMode ? 'text-slate100' : 'text-slate700'}`}>
                Dynamic Income
              </Text>
              <Text className={`text-xs mt-0.5 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                Auto-calculate from transactions
              </Text>
            </View>
            <AnimatedToggle
              value={localUseDynamic}
              onValueChange={setLocalUseDynamic}
              activeColor="#1DB8A3"
              inactiveColor={isDarkMode ? "#334155" : "#CBD5E1"}
            />
          </View>

          {/* Manual Income Input */}
          {!localUseDynamic && (
            <Animated.View entering={FadeIn.duration(200)} className="mb-4">
              <Text className={`text-xs mb-2 uppercase tracking-wide ${isDarkMode ? 'text-secondaryDark' : 'text-slate300'}`}>
                Monthly Amount
              </Text>
              <View
                className={`flex-row items-center px-4 h-12 rounded-xl border ${
                  isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
                }`}
              >
                <Text className={`text-lg mr-2 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                  {currencySymbol}
                </Text>
                <TextInput
                  value={localManualIncome}
                  onChangeText={setLocalManualIncome}
                  placeholder="0"
                  placeholderTextColor={isDarkMode ? "#334155" : "#CBD5E1"}
                  keyboardType="decimal-pad"
                  className={`flex-1 text-lg ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}
                  style={{ textAlignVertical: "center", paddingVertical: 0 }}
                />
              </View>
            </Animated.View>
          )}

          {/* Dynamic Income Display */}
          {localUseDynamic && (
            <Animated.View
              entering={FadeIn.duration(200)}
              className={`mb-4 p-4 rounded-xl border ${
                isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
              }`}
            >
              <Text className={`text-xs uppercase tracking-wide ${isDarkMode ? 'text-secondaryDark' : 'text-slate300'}`}>
                This Month
              </Text>
              <Text className={`text-2xl font-bold mt-1 ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}>
                {formatAmount(dynamicIncome, currencySymbol)}
              </Text>
              <Text className={`text-xs mt-1.5 italic ${isDarkMode ? 'text-slate400' : 'text-slate300'}`}>
                Based on Income transactions this month
              </Text>
            </Animated.View>
          )}

          {/* Cancel / Save buttons */}
          <View className="flex-row gap-2.5">
            <TouchableOpacity
              onPress={handleCancel}
              className={`flex-1 py-3 rounded-xl items-center justify-center border ${
                isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`font-semibold text-base ${isDarkMode ? 'text-slate300' : 'text-slate400'}`}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-3 rounded-xl items-center justify-center bg-accentTeal"
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-base text-white">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};
