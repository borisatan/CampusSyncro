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
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { contributeToGoal, withdrawFromGoal } from '../../services/backendService';
import { Account, Goal } from '../../types/types';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';

interface GoalTransactionModalProps {
  visible: boolean;
  goal: Goal | null;
  mode: 'add' | 'withdraw';
  accounts: Account[];
  currencySymbol: string;
  onClose: () => void;
  onTransactionComplete: () => void;
}

export function GoalTransactionModal({
  visible,
  goal,
  mode,
  accounts,
  currencySymbol,
  onClose,
  onTransactionComplete,
}: GoalTransactionModalProps) {
  const { userId } = useAuth();
  const { isDarkMode } = useTheme();
  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setAmount('');
      setSelectedAccountId(null);
      setSelectedAccountName('');
      setShowAccountDropdown(false);
    }
  }, [visible]);

  if (!goal) return null;

  // Find the savings account linked to this goal
  const goalAccount = accounts.find((acc) => acc.id === goal.account_id);

  // For adding: filter to non-savings accounts (source accounts)
  // For withdrawing: filter to non-savings accounts (destination accounts)
  const availableAccounts = accounts.filter(
    (acc) => acc.type !== 'savings' && acc.type !== 'investment'
  );

  const parsedAmount = parseFloat(amount);
  const canSubmit =
    parsedAmount > 0 &&
    selectedAccountName.trim() !== '' &&
    !isSubmitting &&
    goalAccount !== undefined;

  // Additional validation for withdraw
  const canWithdraw = mode === 'withdraw'
    ? parsedAmount <= goal.current_amount
    : true;

  const handleSubmit = async () => {
    const selectedAccount = availableAccounts.find(
      (acc) => acc.account_name === selectedAccountName
    );

    if (!canSubmit || !userId || !goalAccount || !selectedAccount || !canWithdraw) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      if (mode === 'add') {
        await contributeToGoal({
          goal_id: goal.id,
          user_id: userId,
          amount: parsedAmount,
          source_account_id: selectedAccount.id,
          source_account_name: selectedAccount.account_name,
          destination_account_name: goalAccount.account_name,
        });
      } else {
        await withdrawFromGoal({
          goal_id: goal.id,
          user_id: userId,
          amount: parsedAmount,
          destination_account_id: selectedAccount.id,
          destination_account_name: selectedAccount.account_name,
          source_account_name: goalAccount.account_name,
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
    setAmount('');
    setSelectedAccountName('');
    setShowAccountDropdown(false);
    onClose();
  };

  const progress =
    goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;

  const isAddMode = mode === 'add';
  const modalIcon = isAddMode ? 'add-circle' : 'remove-circle';
  const modalTitle = isAddMode ? 'Add to Goal' : 'Withdraw from Goal';
  const modalColor = isAddMode ? '#10B981' : '#F59E0B';
  const accountLabel = isAddMode ? 'From Account' : 'To Account';
  const submitButtonText = isAddMode ? 'Add Funds' : 'Withdraw Funds';
  const submitButtonColor = isAddMode ? 'bg-green-600' : 'bg-orange-600';

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
        <Pressable
          className="flex-1"
          onPress={handleClose}
        />
        <View className="bg-surfaceDark rounded-t-3xl p-6 border-t border-borderDark max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: `${modalColor}20` }}
              >
                <Ionicons name={modalIcon as any} size={20} color={modalColor} />
              </View>
              <Text className="text-white text-lg font-semibold">{modalTitle}</Text>
            </View>
            <Pressable
              onPress={handleClose}
              style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="close" size={24} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Goal Info */}
            <View className="bg-backgroundDark rounded-xl p-4 mb-4">
              <View className="flex-row items-center mb-3">
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: goal.color || '#a78bfa' }}
                >
                  <Ionicons
                    name={(goal.icon as any) || 'flag-outline'}
                    size={16}
                    color="#fff"
                  />
                </View>
                <Text className="text-white font-medium">{goal.name}</Text>
              </View>
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondaryDark text-sm">Current Progress</Text>
                <Text className="text-purple-400 font-semibold">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: goal.color || '#a78bfa',
                  }}
                />
              </View>
              <Text className="text-white text-sm">
                {currencySymbol}
                {goal.current_amount.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                of {currencySymbol}
                {goal.target_amount.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </Text>
            </View>

            {/* Amount Input */}
            <View className="mb-4">
              <Text className="text-secondaryDark text-sm mb-2">Amount</Text>
              <View className="flex-row items-center px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark">
                <Text className="text-white/70 text-lg mr-2">{currencySymbol}</Text>
                <TextInput
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  className="flex-1 text-lg text-white"
                />
              </View>
              {mode === 'withdraw' && parsedAmount > goal.current_amount && (
                <Text className="text-red-400 text-xs mt-1">
                  Amount exceeds current goal balance
                </Text>
              )}
            </View>

            {/* Account Selector */}
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

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || !canWithdraw}
              className={`py-4 rounded-xl items-center ${
                canSubmit && canWithdraw ? submitButtonColor : 'bg-gray-600'
              }`}
              style={({ pressed }) => [{ opacity: pressed && canSubmit && canWithdraw ? 0.8 : 1 }]}
            >
              <Text
                className={`font-semibold text-base ${
                  canSubmit && canWithdraw ? 'text-white' : 'text-gray-400'
                }`}
              >
                {isSubmitting ? 'Processing...' : submitButtonText}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
