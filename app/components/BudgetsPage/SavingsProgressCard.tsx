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
}) => {
  const { isDarkMode } = useTheme();
  const { setSavingsTarget } = useIncomeStore();
  const hasTarget = target > 0;

  const [expanded, setExpanded] = useState(false);
  const [budgetMode, setBudgetMode] = useState<BudgetMode>("fixed");
  const [amountText, setAmountText] = useState(target > 0 ? target.toString() : "");
  const [percentText, setPercentText] = useState("");

  // Sync amount text when target changes externally
  useEffect(() => {
    setAmountText(target > 0 ? target.toString() : "");
  }, [target]);

  // Animated progress bar
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

  // Animated toggle: 0 = fixed, 1 = percentage
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
    if (!expanded && hasTarget) {
      // Pre-populate when expanding
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
        className="rounded-2xl overflow-hidden"
        style={{
          backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
          borderWidth: 1,
          borderColor: expanded ? "#22C55E40" : (isDarkMode ? "#4B5563" : "#E2E8F0"),
        }}
      >
        <View className="px-4 py-4">
          {/* Header */}
          <View className="flex-row items-center">
            <View
              className="w-11 h-11 rounded-xl items-center justify-center mr-3"
              style={{ backgroundColor: "#8A00C2" }}
            >
              <PiggyBank size={22} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: isDarkMode ? "#F1F5F9" : "#0F172A",
                }}
              >
                Monthly Savings
              </Text>
              {hasTarget ? (
                <Text
                  style={{
                    fontSize: 12,
                    color: "#22C55E",
                    marginTop: 2,
                  }}
                >
                  {saved >= target ? "Goal Reached!" : `${formatAmount(target - saved, currencySymbol)} to go`}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 12,
                    color: isDarkMode ? "#7C8CA0" : "#94A3B8",
                    marginTop: 2,
                  }}
                >
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
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? "#16A34A" : "#22C55E",
                  })}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                </Pressable>
              )}

              <View className="items-end">
                {hasTarget ? (
                  <>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#22C55E",
                      }}
                    >
                      {formatAmount(saved, currencySymbol)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 12,
                        color: isDarkMode ? "#7C8CA0" : "#94A3B8",
                        marginTop: 1,
                      }}
                    >
                      / {formatAmount(target, currencySymbol)}
                    </Text>
                  </>
                ) : (
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: isDarkMode ? "#4B5563" : "#E2E8F0" }}
                  >
                    <Text style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8", fontSize: 12 }}>
                      No target
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Progress bar */}
          {hasTarget && (
            <View className="mt-3">
              <View
                className="h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: "#4B5563" }}
              >
                <Animated.View
                  style={[
                    {
                      height: "100%",
                      borderRadius: 9999,
                      backgroundColor: "#22C55E",
                    },
                    progressBarStyle,
                  ]}
                />
              </View>
              <View className="flex-row justify-end mt-1">
                <Text style={{ fontSize: 11, color: "#22C55E", fontWeight: "600" }}>
                  {Math.round(percentage)}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Expanded Edit Section */}
        {expanded && (
          <View
            className="px-4 pb-4"
            style={{
              borderTopWidth: 1,
              borderTopColor: isDarkMode ? "#4B5563" : "#E2E8F0",
              paddingTop: 14,
            }}
          >
            {/* Mode toggle */}
            <Animated.View entering={FadeIn.duration(200).delay(50)}>
              <View
                className="rounded-xl p-1 flex-row mb-4"
                style={{
                  backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                  position: "relative",
                }}
              >
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: 4,
                      width: "50%",
                      height: "100%",
                      borderRadius: 10,
                      backgroundColor: "#2A9D8F",
                    },
                    sliderStyle,
                  ]}
                />
                <TouchableOpacity
                  onPress={() => handleModeChange("fixed")}
                  className="flex-1 py-2.5 rounded-lg z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[{ textAlign: "center", fontWeight: "500", fontSize: 13 }, fixedTextStyle]}
                  >
                    Fixed Amount
                  </Animated.Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleModeChange("percentage")}
                  className="flex-1 py-2.5 rounded-lg z-10"
                  activeOpacity={0.7}
                >
                  <Animated.Text
                    style={[{ textAlign: "center", fontWeight: "500", fontSize: 13 }, percentTextStyle]}
                  >
                    % of Income
                  </Animated.Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View entering={FadeIn.duration(200).delay(100)}>
              {budgetMode === "fixed" ? (
                <View>
                  <Text
                    style={{
                      color: isDarkMode ? "#8B99AE" : "#64748B",
                      fontSize: 11,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Savings Target
                  </Text>
                  <View
                    className="flex-row items-center px-3 h-12 rounded-xl"
                    style={{
                      backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                      borderWidth: 1,
                      borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
                    }}
                  >
                    <Text style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8", fontSize: 16, marginRight: 4 }}>
                      {currencySymbol}
                    </Text>
                    <TextInput
                      className="flex-1 py-0"
                      style={{ color: isDarkMode ? "#F1F5F9" : "#0F172A", fontSize: 16 }}
                      value={amountText}
                      onChangeText={setAmountText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDarkMode ? "#6B7280" : "#CBD5E1"}
                      selectionColor="#22C55E"
                    />
                  </View>
                  {amountText !== "" && !isNaN(parseFloat(amountText)) && monthlyIncome > 0 && (
                    <Text style={{ color: isDarkMode ? "#8B99AE" : "#64748B", fontSize: 12, marginTop: 6 }}>
                      = {((parseFloat(amountText) / monthlyIncome) * 100).toFixed(1)}% of income
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text
                    style={{
                      color: isDarkMode ? "#8B99AE" : "#64748B",
                      fontSize: 11,
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Percentage of Income ({formatAmount(monthlyIncome, currencySymbol)}/mo)
                  </Text>
                  <View
                    className="flex-row items-center px-3 h-12 rounded-xl"
                    style={{
                      backgroundColor: isDarkMode ? "#1F2937" : "#F1F5F9",
                      borderWidth: 1,
                      borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
                    }}
                  >
                    <TextInput
                      className="flex-1 py-0"
                      style={{ color: isDarkMode ? "#F1F5F9" : "#0F172A", fontSize: 16 }}
                      value={percentText}
                      onChangeText={setPercentText}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={isDarkMode ? "#6B7280" : "#CBD5E1"}
                      selectionColor="#22C55E"
                    />
                    <Text style={{ color: isDarkMode ? "#7C8CA0" : "#94A3B8", fontSize: 16, marginLeft: 4 }}>
                      %
                    </Text>
                  </View>
                  {percentText !== "" && !isNaN(parseFloat(percentText)) && monthlyIncome > 0 && (
                    <Text style={{ color: isDarkMode ? "#8B99AE" : "#64748B", fontSize: 12, marginTop: 6 }}>
                      = {formatAmount(Math.round((parseFloat(percentText) / 100) * monthlyIncome), currencySymbol)}
                    </Text>
                  )}
                </View>
              )}
            </Animated.View>

            {/* Action buttons */}
            <Animated.View entering={FadeIn.duration(200).delay(150)} className="mt-4 flex-row" style={{ gap: 10 }}>
              {hasTarget && (
                <TouchableOpacity
                  onPress={handleRemove}
                  className="flex-1 rounded-xl py-3 items-center"
                  style={{ backgroundColor: "#EF4444" }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>Remove</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                className="flex-1 rounded-xl py-3 items-center"
                style={{ backgroundColor: "#2A9D8F" }}
                activeOpacity={0.7}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
                  {hasTarget ? "Save" : "Set Target"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Show on Dashboard toggle */}
            {hasTarget && (
              <Animated.View entering={FadeIn.duration(200).delay(200)} className="mt-4 flex-row items-center justify-between">
                <Text style={{ color: isDarkMode ? "#8B99AE" : "#64748B", fontSize: 13 }}>Show on Dashboard</Text>
                <View onStartShouldSetResponder={() => true}>
                  <AnimatedToggle
                    value={showOnDashboard}
                    onValueChange={onToggleDashboard}
                    activeColor="#2A9D8F"
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
