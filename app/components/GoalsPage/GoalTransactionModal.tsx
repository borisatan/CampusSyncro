import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { contributeToGoal, trackGoalAmount, withdrawFromGoal } from '../../services/backendService';
import { Account, Goal } from '../../types/types';
import { parseAmount } from '../../utils/parseAmount';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';

interface GoalTransactionModalProps {
  visible: boolean;
  goal: Goal | null;
  accounts: Account[];
  currencySymbol: string;
  onClose: () => void;
  onTransactionComplete: () => void;
}

export function GoalTransactionModal({
  visible,
  goal,
  accounts,
  currencySymbol,
  onClose,
  onTransactionComplete,
}: GoalTransactionModalProps) {
  const { userId } = useAuth();
  const { isDarkMode } = useTheme();
  const [mode, setMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animated slider: 0 = add, 1 = withdraw
  const sliderProgress = useSharedValue(0);

  useEffect(() => {
    sliderProgress.value = withTiming(mode === 'withdraw' ? 1 : 0, { duration: 200 });
  }, [mode]);

  const sliderStyle = useAnimatedStyle(() => ({
    left: `${sliderProgress.value * 50}%`,
    backgroundColor: interpolateColor(sliderProgress.value, [0, 1], ['#1DB8A3', '#F2514A']),
  }));

  const addTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sliderProgress.value, [0, 1], ['#ffffff', '#94a3b8']),
  }));

  const withdrawTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(sliderProgress.value, [0, 1], ['#94a3b8', '#ffffff']),
  }));

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setMode('add');
      setAmount('');
      setSelectedAccountName('');
      setShowAccountDropdown(false);
    }
  }, [visible]);

  if (!goal) return null;

  const goalAccount = accounts.find((acc) => acc.id === goal.account_id);
  const availableAccounts = accounts.filter(
    (acc) => acc.type !== 'savings' && acc.type !== 'investment'
  );

  const hasLinkedAccount = goalAccount !== undefined;
  const parsedAmount = parseAmount(amount);
  const requiresAccountSelection = mode === 'add' || hasLinkedAccount;
  const canSubmit =
    parsedAmount > 0 &&
    (!requiresAccountSelection || selectedAccountName.trim() !== '') &&
    !isSubmitting;
  const canWithdraw = mode === 'withdraw' ? parsedAmount <= goal.current_amount : true;

  const handleModeChange = (newMode: 'add' | 'withdraw') => {
    if (newMode === mode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAmount('');
    setSelectedAccountName('');
    setMode(newMode);
  };

  const handleSubmit = async () => {
    const selectedAccount = availableAccounts.find(
      (acc) => acc.account_name === selectedAccountName
    );

    if (!canSubmit || !userId || !canWithdraw) return;
    if (hasLinkedAccount && (!goalAccount || !selectedAccount)) return;
    if (mode === 'add' && !hasLinkedAccount && !selectedAccount) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      if (!hasLinkedAccount) {
        await trackGoalAmount({
          goal_id: goal.id,
          user_id: userId,
          amount: mode === 'add' ? parsedAmount : -parsedAmount,
          source_account_id: selectedAccount?.id,
        });
      } else if (mode === 'add') {
        await contributeToGoal({
          goal_id: goal.id,
          user_id: userId,
          amount: parsedAmount,
          source_account_id: selectedAccount!.id,
          source_account_name: selectedAccount!.account_name,
          destination_account_name: goalAccount!.account_name,
        });
      } else {
        await withdrawFromGoal({
          goal_id: goal.id,
          user_id: userId,
          amount: parsedAmount,
          destination_account_id: selectedAccount!.id,
          destination_account_name: selectedAccount!.account_name,
          source_account_name: goalAccount!.account_name,
        });
      }

      onTransactionComplete();
      onClose();
    } catch (error) {
      console.error(`Error ${mode === 'add' ? 'contributing to' : 'withdrawing from'} goal:`, error);
      Alert.alert('Error', `Failed to ${mode === 'add' ? 'add to' : 'withdraw from'} goal. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;

  const accentColor = goal.color || '#a78bfa';
  const submitActive = canSubmit && canWithdraw;
  const submitBg = submitActive ? (mode === 'add' ? 'bg-accentTeal' : 'bg-accentRed') : 'bg-gray-600';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <Pressable className="flex-1" onPress={handleClose} />

        <View className="bg-surfaceDark rounded-t-3xl border-t border-borderDark max-h-[85%]">
          {/* Handle bar */}
          <View className="items-center pt-3 pb-1">
            <View className="w-10 h-1 rounded-full bg-borderDark" />
          </View>

          {/* Goal header */}
          <View className="flex-row items-center px-4 pt-3 pb-4">
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: accentColor }}
            >
              <Ionicons name={(goal.icon as any) || 'flag-outline'} size={18} color="#fff" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-semibold">{goal.name}</Text>
              <Text className="text-secondaryDark text-xs mt-0.5">
                {currencySymbol}{goal.current_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                {' / '}
                {currencySymbol}{goal.target_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                {'  ·  '}{Math.round(progress)}%
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Progress bar */}
          <View className="px-4 pb-4">
            <View className="h-1.5 rounded-full overflow-hidden bg-gray-700">
              <View
                className="h-full rounded-full"
                style={{ width: `${progress}%`, backgroundColor: accentColor }}
              />
            </View>
          </View>

          <View className="border-b border-borderDark" />

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="bg-backgroundDark"
            contentContainerStyle={{ padding: 16, paddingBottom: 44 }}
            keyboardDismissMode="on-drag"
          >
            {/* Mode slider */}
            <View
              className="bg-inputDark border border-borderDark rounded-2xl flex-row mb-5"
              style={{ overflow: 'hidden' }}
            >
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: '50%',
                    borderRadius: 12,
                  },
                  sliderStyle,
                ]}
              />
              <TouchableOpacity
                onPress={() => handleModeChange('add')}
                className="flex-1 py-3 z-10"
                activeOpacity={0.7}
              >
                <Animated.Text style={[{ textAlign: 'center', fontWeight: '600', fontSize: 14 }, addTextStyle]}>
                  Add Funds
                </Animated.Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleModeChange('withdraw')}
                className="flex-1 py-3 z-10"
                activeOpacity={0.7}
              >
                <Animated.Text style={[{ textAlign: 'center', fontWeight: '600', fontSize: 14 }, withdrawTextStyle]}>
                  Withdraw
                </Animated.Text>
              </TouchableOpacity>
            </View>

            {/* Amount input */}
            <Text className="text-secondaryDark text-sm mb-2">Amount</Text>
            <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark mb-4">
              <Text className="text-white/70 text-lg mr-2" style={{ lineHeight: 18 }}>{currencySymbol}</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                placeholderTextColor="#64748B"
                keyboardType="decimal-pad"
                className="flex-1 text-lg text-white"
                style={{ lineHeight: 18 }}
              />
            </View>
            {mode === 'withdraw' && parsedAmount > goal.current_amount && (
              <Text className="text-accentRed text-xs -mt-3 mb-3">
                Amount exceeds current goal balance
              </Text>
            )}

            {/* Account selector — always rendered to prevent layout shift */}
            <View
              className="mb-4"
              pointerEvents={requiresAccountSelection ? 'auto' : 'none'}
              style={{ opacity: requiresAccountSelection ? 1 : 0 }}
            >
              <AccountSelector
                isDarkMode={isDarkMode}
                showAccountDropdown={showAccountDropdown}
                setShowAccountDropdown={setShowAccountDropdown}
                isLoadingAccounts={false}
                selectedAccount={selectedAccountName || 'Select account'}
                setSelectedAccount={setSelectedAccountName}
                accountOptions={availableAccounts}
                expenseAccountOptions={availableAccounts}
                transactionType="expense"
              />
            </View>

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!submitActive}
              className={`py-4 rounded-xl items-center ${submitBg}`}
              style={({ pressed }) => [{ opacity: pressed && submitActive ? 0.8 : 1 }]}
            >
              <Text className={`font-semibold text-base ${submitActive ? 'text-white' : 'text-gray-400'}`}>
                {isSubmitting ? 'Processing...' : mode === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
