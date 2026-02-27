import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import { Pressable, Text, TextInput, TouchableOpacity, View } from "react-native";
import { PiggyBank } from "lucide-react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import { useTheme } from "../../context/ThemeContext";
import { useIncomeStore } from "../../store/useIncomeStore";
import { AnimatedToggle } from "../Shared/AnimatedToggle";

type BudgetMode = "fixed" | "percentage";

interface SavingsProgressCardProps {
  target: number;
  saved: number;
  percentage: number;
  currencySymbol: string;
  monthlyIncome: number;
  showOnDashboard: boolean;
  onToggleDashboard: () => void;
  onAddPress?: () => void;
  onWithdrawPress?: () => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export const SavingsProgressCard: React.FC<SavingsProgressCardProps> = ({
  target,
  saved,
  percentage,
  currencySymbol,
  monthlyIncome,
  showOnDashboard,
  onToggleDashboard,
  onAddPress,
  onWithdrawPress,
}) => {
  const { isDarkMode } = useTheme();
  const { setSavingsTarget } = useIncomeStore();
  const hasTarget = target > 0;

  const [expanded, setExpanded] = useState(false);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("fixed");
  const [amountText, setAmountText] = useState(target > 0 ? target.toString() : "");
  const [percentText, setPercentText] = useState("");

  useEffect(() => {
    setAmountText(target > 0 ? target.toString() : "");
  }, [target]);

  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (hasTarget) {
      progressWidth.value = withDelay(
        100,
        withSpring(Math.min(percentage, 100) / 100, {
          damping: 20,
          stiffness: 90,
        })
      );
    } else {
      progressWidth.value = withTiming(0, { duration: 200 });
    }
  }, [percentage, hasTarget]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value * 100}%`,
  }));

  const toggleProgress = useSharedValue(0);

  useEffect(() => {
    toggleProgress.value = withTiming(budgetMode === "percentage" ? 1 : 0, { duration: 200 });
  }, [budgetMode]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${toggleProgress.value * 50}%`,
  }));

  const fixedTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ["#ffffff", "#64748B"]),
  }));

  const percentTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(toggleProgress.value, [0, 1], ["#64748B", "#ffffff"]),
  }));

  const handleModeChange = (newMode: BudgetMode) => {
    if (newMode === budgetMode) return;

    if (newMode === "percentage") {
      const currentAmount = parseFloat(amountText) || target;
      if (currentAmount > 0 && monthlyIncome > 0) {
        const pct = (currentAmount / monthlyIncome) * 100;
        setPercentText(pct.toFixed(1));
      }
    } else {
      const currentPct = parseFloat(percentText);
      if (!isNaN(currentPct) && currentPct > 0 && monthlyIncome > 0) {
        const amount = Math.round((currentPct / 100) * monthlyIncome);
        setAmountText(amount.toString());
      }
    }
    setBudgetMode(newMode);
  };

  const handleSave = async () => {
    let finalAmount = 0;
    if (budgetMode === "percentage") {
      const pct = parseFloat(percentText);
      if (isNaN(pct) || pct <= 0 || monthlyIncome <= 0) return;
      finalAmount = Math.round((pct / 100) * monthlyIncome);
    } else {
      const amount = parseFloat(amountText);
      if (isNaN(amount) || amount <= 0) return;
      finalAmount = amount;
    }
    await setSavingsTarget(finalAmount);
    setExpanded(false);
  };

  const handleRemove = async () => {
    await setSavingsTarget(0);
    setAmountText("");
    setPercentText("");
    setBudgetMode("fixed");
    setExpanded(false);
  };

  const handleToggleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!expanded && hasTarget) {
      setAmountText(target.toString());
      if (monthlyIncome > 0) {
        setPercentText(((target / monthlyIncome) * 100).toFixed(1));
      }
    }
    setExpanded(!expanded);
  };

  return (
    <Pressable onPress={handleToggleExpand}>
      <View
        className={`rounded-2xl overflow-hidden border ${
          isDarkMode ? 'bg-surfaceDark' : 'bg-surfaceLight'
        } ${
          expanded ? 'border-overlayGreen' : isDarkMode ? 'border-borderDark' : 'border-slate100'
        }`}
      >
        {/* Header */}
        <View className="p-4 flex-row items-center">
          <View className="w-11 h-11 rounded-xl items-center justify-center mr-3 bg-accentPurple">
            <PiggyBank size={22} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className={`text-[15px] font-semibold ${isDarkMode ? 'text-slate50' : 'text-slate800'}`}>
              Monthly Savings
            </Text>
            {hasTarget ? (
              <Text className="text-xs mt-0.5 text-accentGreen">
                {saved >= target ? "Goal Reached!" : `${formatAmount(target - saved, currencySymbol)} to go`}
              </Text>
            ) : (
              <Text className={`text-xs mt-0.5 ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                Goal contributions this month
              </Text>
            )}
          </View>

          <View className="flex-row items-center" style={{ gap: 10 }}>
            {/* Add button */}
            {onAddPress && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onAddPress();
                }}
                className="w-9 h-9 rounded-full items-center justify-center border border-borderDark"
                style={({ pressed }: any) => ({
                  backgroundColor: pressed ? "#16A34A" : "#22D97A",
                })}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            {/* Withdraw button */}
            {onWithdrawPress && saved > 0 && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  onWithdrawPress();
                }}
                className="w-9 h-9 rounded-full items-center justify-center border border-borderDark"
                style={({ pressed }: any) => ({
                  backgroundColor: pressed ? "#2563EB" : "#3B7EFF",
                })}
              >
                <Ionicons name="remove" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            <View className="items-end">
              {hasTarget ? (
                <>
                  <Text className="text-slate50 text-base font-bold">
                    {formatAmount(saved, currencySymbol)}
                  </Text>
                  <Text className="text-slateMuted text-xs mt-0.5">
                    / {formatAmount(target, currencySymbol)}
                  </Text>
                </>
              ) : (
                <View className={`px-3 py-1 rounded-full ${isDarkMode ? 'bg-gray600' : 'bg-slate100'}`}>
                  <Text className={`text-xs ${isDarkMode ? 'text-slateMuted' : 'text-slate300'}`}>
                    No target
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Progress bar */}
        {hasTarget && (
          <View className="px-4 pb-3">
            <View className="h-1.5 rounded-full overflow-hidden bg-gray600">
              <Animated.View
                className="h-full rounded-full bg-accentGreen"
                style={progressBarStyle}
              />
            </View>
            <View className="flex-row justify-end mt-1">
              <Text className="text-[11px] text-accentGreen font-semibold">
                {Math.round(percentage)}%
              </Text>
            </View>
          </View>
        )}

        {/* Expanded Edit Section */}
        {expanded && (
          <View className="px-4 pb-4 pt-[14px] border-t border-borderDark">
            {/* Mode toggle */}
            <Animated.View entering={FadeIn.duration(200).delay(50)}>
              <View className="rounded-xl flex-row mb-4 bg-inputDark border border-borderDark overflow-hidden">
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      width: '50%',
                      borderRadius: 11,
                      backgroundColor: '#3B7EFF',
                    },
                    sliderStyle,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleModeChange("fixed")}
                  className="flex-1 py-2.5 z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: "center", fontWeight: "500", fontSize: 13 }, fixedTextStyle]}>
                    Fixed Amount
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleModeChange("percentage")}
                  className="flex-1 py-2.5 z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text style={[{ textAlign: "center", fontWeight: "500", fontSize: 13 }, percentTextStyle]}>
                    % of Income
                  </Animated.Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(200).delay(100)}>
              {budgetMode === "fixed" ? (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Savings Target
                  </Text>
                  <View className="flex-row items-center px-3 h-12 rounded-xl bg-inputDark border border-borderDark">
                    <Text className="text-slateMuted text-base mr-1">{currencySymbol}</Text>
                    <TextInput
                      className="flex-1 py-0 text-slate50 text-base"
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor="#22D97A"
                    />
                  </View>
                  {amountText !== "" && !isNaN(parseFloat(amountText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {((parseFloat(amountText) / monthlyIncome) * 100).toFixed(1)}% of income
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Percentage of Income ({formatAmount(monthlyIncome, currencySymbol)}/mo)
                  </Text>
                  <View className="flex-row items-center px-3 h-12 rounded-xl bg-inputDark border border-borderDark">
                    <TextInput
                      className="flex-1 py-0 text-slate50 text-base"
                      value={percentText}
                      onChangeText={setPercentText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#6B7280"
                      selectionColor="#22D97A"
                    />
                    <Text className="text-slateMuted text-base ml-1">%</Text>
                  </View>
                  {percentText !== "" && !isNaN(parseFloat(percentText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {formatAmount(Math.round((parseFloat(percentText) / 100) * monthlyIncome), currencySymbol)}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeIn.duration(200).delay(150)} className="mt-4 flex-row gap-2.5">
              {hasTarget && (
                <TouchableOpacity
                  onPress={handleRemove}
                  className="flex-1 rounded-xl py-3 items-center bg-accentRed"
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-sm">Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 rounded-xl py-3 items-center bg-accentTeal"
                activeOpacity={0.7}
              >
                <Text className="text-white font-semibold text-sm">
                  {hasTarget ? "Save" : "Set Target"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Show on Dashboard toggle */}
            {hasTarget && (
              <Animated.View entering={FadeIn.duration(200).delay(200)} className="mt-4 flex-row items-center justify-between">
                <Text className="text-secondaryDark text-[13px]">Show on Dashboard</Text>
                <View onStartShouldSetResponder={() => true}>
                  <AnimatedToggle
                    value={showOnDashboard}
                    onValueChange={onToggleDashboard}
                    activeColor="#1DB8A3"
                    inactiveColor="#334155"
                  />
                </View>
              </Animated.View>
            )}
          </View>
        )}
      </View>
    </Pressable>
  );
};
