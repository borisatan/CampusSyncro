import { ChevronUp, Edit2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutAnimation,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      {children}
    </Animated.View>
  );
};


interface IncomeCardProps {
  income: number;
  allocatedPercentage: number;
  currencySymbol: string;
  useDynamicIncome: boolean;
  manualIncome: number;
  dynamicIncome: number;
  isDarkMode: boolean;
  onSave: (useDynamic: boolean, manualIncome: number) => void;
}

const formatAmount = (amount: number, symbol: string): string => {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const IncomeCard: React.FC<IncomeCardProps> = ({
  income,
  allocatedPercentage,
  currencySymbol,
  useDynamicIncome,
  manualIncome,
  dynamicIncome,
  isDarkMode,
  onSave,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localUseDynamic, setLocalUseDynamic] = useState(useDynamicIncome);
  const [localManualIncome, setLocalManualIncome] = useState(
    manualIncome > 0 ? manualIncome.toString() : ''
  );

  const clampedPercentage = Math.min(allocatedPercentage, 100);

  // Sync local state when props change (e.g., after refresh)
  useEffect(() => {
    if (!isExpanded) {
      setLocalUseDynamic(useDynamicIncome);
      setLocalManualIncome(manualIncome > 0 ? manualIncome.toString() : '');
    }
  }, [useDynamicIncome, manualIncome, isExpanded]);

  const handleToggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (isExpanded) {
      // Reset to current values when collapsing without saving
      setLocalUseDynamic(useDynamicIncome);
      setLocalManualIncome(manualIncome > 0 ? manualIncome.toString() : '');
    }
    setIsExpanded(!isExpanded);
  };

  const handleSave = () => {
    const incomeValue = parseFloat(localManualIncome) || 0;
    onSave(localUseDynamic, incomeValue);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(false);
  };

  return (
    <View className="bg-accentBlue rounded-2xl p-5 mb-4">
      {/* Header with edit button */}
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-white/90 text-sm">Total Monthly Income</Text>
        <TouchableOpacity
          onPress={handleToggleExpand}
          className="w-8 h-8 bg-white/20 rounded-lg items-center justify-center"
          activeOpacity={0.7}
        >
          {isExpanded ? (
            <ChevronUp size={16} color="#FFFFFF" />
          ) : (
            <Edit2 size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      {/* Income amount */}
      <Text className="text-white text-3xl font-bold mb-3">
        {formatAmount(income, currencySymbol)}
      </Text>

      {/* Progress bar and percentage */}
      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
          <View
            className="h-full bg-white/50 rounded-full"
            style={{ width: `${clampedPercentage}%` }}
          />
        </View>
        <Text className="text-white/90 text-sm">
          {Math.round(allocatedPercentage)}% allocated
        </Text>
      </View>

      {/* Expanded Editor Section */}
      {isExpanded && (
        <View className="mt-5 pt-5 border border-borderDark bg-surfaceDark -mx-5 px-5 -mb-5 pb-5 rounded-b-2xl">
          {/* Income Source Toggle */}
          <AnimatedRow index={0}>
            <View className="mb-4">
              <Text className="text-white text-sm mb-2">Income Source</Text>
              <View className="flex-row items-center justify-between p-4 rounded-xl border border-borderDark bg-surfaceDark">
                <View className="flex-1 mr-3">
                  <Text className="text-white font-medium">Use Dynamic Income</Text>
                  <Text className="text-white/60 text-xs mt-1">
                    Calculate from Income transactions
                  </Text>
                </View>
                <Switch
                  value={localUseDynamic}
                  onValueChange={setLocalUseDynamic}
                  trackColor={{ false: 'rgba(255,255,255,0.2)', true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </AnimatedRow>

          {/* Dynamic Income Display */}
          {localUseDynamic && (
            <AnimatedRow index={1}>
              <View className="mb-4 p-4 rounded-xl border border-borderDark bg-surfaceDark">
                <Text className="text-white/70 text-sm">Current Month Income</Text>
                <Text className="text-white text-2xl font-bold mt-1">
                  {formatAmount(dynamicIncome, currencySymbol)}
                </Text>
                <Text className="text-white/50 text-xs mt-2 italic">
                  Based on transactions in the Income category this month
                </Text>
              </View>
            </AnimatedRow>
          )}

          {/* Manual Income Input */}
          {!localUseDynamic && (
            <AnimatedRow index={1}>
              <View className="mb-4">
                <Text className="text-white text-sm mb-2">
                  Income Amount
                </Text>
                <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark">
                  <Text className="text-white/70 text-lg mr-2">
                    {currencySymbol}
                  </Text>
                  <TextInput
                    value={localManualIncome}
                    onChangeText={setLocalManualIncome}
                    placeholder="0"
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    keyboardType="decimal-pad"
                    className="flex-1 text-lg text-white"
                  />
                </View>
              </View>
            </AnimatedRow>
          )}

          {/* Save Button */}
          <AnimatedRow index={2}>
            <TouchableOpacity
              onPress={handleSave}
              className="w-full py-3 rounded-xl items-center bg-accentBlue mt-2"
              activeOpacity={0.7}
            >
              <Text className="text-textDark font-semibold text-base">
                Save Changes
              </Text>
            </TouchableOpacity>
          </AnimatedRow>
        </View>
      )}
    </View>
  );
};
