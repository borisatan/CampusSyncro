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
} from "react-native-reanimated";

import { useSavingsProgress } from "../../hooks/useSavingsProgress";
import { useIncomeStore } from "../../store/useIncomeStore";
import { AnimatedToggle } from "../Shared/AnimatedToggle";

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
  const { saved: monthlySaved } = useSavingsProgress();
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUseDynamic, setLocalUseDynamic] = useState(useDynamicIncome);
  const [localManualIncome, setLocalManualIncome] = useState(
    manualIncome > 0 ? manualIncome.toString() : "",
  );

  const totalAllocated = totalBudgeted + monthlySaved;
  const remaining = income - totalAllocated;
  const categoriesPercent = income > 0 ? (totalBudgeted / income) * 100 : 0;
  const savingsPercent = income > 0 ? (monthlySaved / income) * 100 : 0;
  const unallocatedPercent = income > 0 ? Math.max(0, remaining) / income * 100 : 0;
  const categoriesRing = Math.min(categoriesPercent, 100);
  const savingsRing = Math.min(unallocatedPercent, Math.max(0, 100 - categoriesRing));
  const isOverAllocated = remaining < 0;


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
    <View
      className={`rounded-2xl mb-4 overflow-hidden border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-surfaceLight border-slate100'
      }`}
    >
      {/* Main card */}
      <TouchableOpacity
        onPress={handleToggleExpand}
        activeOpacity={0.8}
        className="px-4 pt-4 pb-4"
      >
        {/* Header row */}
        <View className="flex-row items-center justify-between mb-1">
          <Text className={`text-base font-semibold ${isDarkMode ? 'text-slate50' : 'text-slate600'}`}>
            Monthly Income
          </Text>
          <View className="w-8 h-8 rounded-xl items-center justify-center bg-surfaceDark">
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#EDF0FA"
            />
          </View>
        </View>

        {/* Amount */}
        <Text
          className={`font-bold mb-3 ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}
          style={{ fontSize: 26, letterSpacing: -0.5 }}
        >
          {formatAmount(income, currencySymbol)}
        </Text>

        {/* Allocation breakdown widget */}
        <View
          className={`mb-4 rounded-xl overflow-hidden border ${isDarkMode ? 'border-borderDark' : 'border-slate100'}`}
        >
          {/* Budgeted row */}
          <View className={`px-3 py-2.5 ${isDarkMode ? 'bg-inputDark' : 'bg-slate50'}`}>
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#22D97A" }} />
                <Text className={`text-xs font-medium ${isDarkMode ? 'text-slate300' : 'text-slate500'}`}>
                  Budgeted
                </Text>
              </View>
              <Text className={`text-xs font-semibold ${isDarkMode ? 'text-slate100' : 'text-slate700'}`}>
                {formatAmount(totalBudgeted, currencySymbol)}
              </Text>
            </View>
            <View className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-borderDark' : 'bg-slate200'}`}>
              <View
                style={{ width: `${Math.min(categoriesPercent, 100)}%`, height: "100%", borderRadius: 999, backgroundColor: "#22D97A" }}
              />
            </View>
          </View>

          <View className={`h-px ${isDarkMode ? 'bg-borderDark' : 'bg-slate100'}`} />

          {/* Unallocated / Over Budget row */}
          <View className={`px-3 py-2.5 ${isDarkMode ? 'bg-inputDark' : 'bg-slate50'}`}>
            <View className="flex-row items-center justify-between mb-1.5">
              <View className="flex-row items-center" style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOverAllocated ? "#F2514A" : "#8B5CF6" }} />
                <Text className={`text-xs font-medium ${isOverAllocated ? 'text-accentRed' : isDarkMode ? 'text-slate300' : 'text-slate500'}`}>
                  {isOverAllocated ? "Over Budget" : "Unallocated"}
                </Text>
              </View>
              <Text className={`text-xs font-semibold ${isOverAllocated ? 'text-accentRed' : isDarkMode ? 'text-slate100' : 'text-slate700'}`}>
                {formatAmount(Math.abs(remaining), currencySymbol)}
              </Text>
            </View>
            <View className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-borderDark' : 'bg-slate200'}`}>
              <View
                style={{
                  width: `${isOverAllocated ? 100 : Math.min(unallocatedPercent, 100)}%`,
                  height: "100%",
                  borderRadius: 999,
                  backgroundColor: isOverAllocated ? "#F2514A" : "#8B5CF6",
                }}
              />
            </View>
          </View>
        </View>

        {/* Allocated / Remaining stats */}
        <View className="flex-row gap-3">
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
                <Text className={`text-lg mr-2 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`} style={{ lineHeight: 18 }}>
                  {currencySymbol}
                </Text>
                <TextInput
                  value={localManualIncome}
                  onChangeText={setLocalManualIncome}
                  placeholder="0"
                  placeholderTextColor={isDarkMode ? "#334155" : "#CBD5E1"}
                  keyboardType="decimal-pad"
                  className={`flex-1 text-lg ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}
                  style={{ lineHeight: 18 }}
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
