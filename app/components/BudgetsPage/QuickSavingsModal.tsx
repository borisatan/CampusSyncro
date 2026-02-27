import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, PiggyBank } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../context/ThemeContext';
import { Account } from '../../types/types';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';
import { SuccessModal } from '../Shared/SuccessModal';

interface QuickSavingsModalProps {
  visible: boolean;
  mode: 'add' | 'withdraw';
  accounts: Account[];
  currencySymbol: string;
  targetRemaining: number;
  currentlySaved: number;
  onSave: (accountId: number, accountName: string, amount: number) => Promise<void>;
  onClose: () => void;
}

export const QuickSavingsModal: React.FC<QuickSavingsModalProps> = ({
  visible,
  mode,
  accounts,
  currencySymbol,
  targetRemaining,
  currentlySaved,
  onSave,
  onClose,
}) => {
  const { isDarkMode } = useTheme();
  const [amountText, setAmountText] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter to non-savings accounts (accounts you'd typically save FROM)
  const sourceAccounts = accounts.filter(
    (acc) => acc.type?.toLowerCase() !== 'savings' && acc.type?.toLowerCase() !== 'investment'
  );

  // Auto-select first account and focus input when modal opens
  useEffect(() => {
    if (visible && sourceAccounts.length > 0 && !selectedAccountName) {
      setSelectedAccountName(sourceAccounts[0].account_name);
    }
    if (visible) {
      // Delay focus to allow modal animation to complete
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [visible, sourceAccounts.length]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setAmountText('');
      setSelectedAccountName('');
      setShowAccountDropdown(false);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleSave = async () => {
    const selectedAccount = sourceAccounts.find(acc => acc.account_name === selectedAccountName);
    if (!selectedAccount) return;
    const amount = parseFloat(amountText);
    if (isNaN(amount) || amount <= 0) return;

    // Validation based on mode
    if (mode === 'add') {
      if (amount > selectedAccount.balance) return;
    } else {
      if (amount > currentlySaved) return;
    }

    setIsSubmitting(true);
    try {
      await onSave(selectedAccount.id, selectedAccount.account_name, amount);
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = parseFloat(amountText) || 0;
  const selectedAccount = sourceAccounts.find(acc => acc.account_name === selectedAccountName);
  const isValid = mode === 'add'
    ? amount > 0 && selectedAccount && amount <= selectedAccount.balance
    : amount > 0 && selectedAccount && amount <= currentlySaved;

  const formatCurrency = (value: number) =>
    `${currencySymbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-backgroundDark" edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <View className="flex-1">
            {/* Header */}
            <View className="flex-row items-center px-4 py-2">
              <TouchableOpacity
                onPress={onClose}
                className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
              >
                <ArrowLeft color="#94A3B8" size={20} />
              </TouchableOpacity>
              <Text className="text-xl font-semibold text-textDark">
                {mode === 'add' ? 'Add to Savings' : 'Withdraw from Savings'}
              </Text>
            </View>

            {/* Content */}
            <View className="px-2 mt-4">
              <View className="bg-surfaceDark rounded-3xl p-4 border border-borderDark">
                {/* Target info */}
                <View className="flex-row items-center gap-3 mb-5">
                  <View className="w-12 h-12 rounded-xl items-center justify-center bg-accentPurple">
                    <PiggyBank size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textDark text-lg font-semibold">
                      {mode === 'add'
                        ? 'Contribute to your savings goal'
                        : 'Take from your savings'}
                    </Text>
                    {mode === 'add' && targetRemaining > 0 ? (
                      <Text className="text-secondaryDark text-sm">
                        {formatCurrency(targetRemaining)} left to reach your goal
                      </Text>
                    ) : mode === 'withdraw' && currentlySaved > 0 ? (
                      <Text className="text-secondaryDark text-sm">
                        {formatCurrency(currentlySaved)} available to withdraw
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Amount input */}
                <Text className="text-sm text-secondaryDark mb-2">Amount</Text>
                <View className="flex-row items-center bg-backgroundDark rounded-xl px-4">
                  <Text className="text-xl text-secondaryDark mr-2">{currencySymbol}</Text>
                  <TextInput
                    ref={inputRef}
                    value={amountText}
                    onChangeText={setAmountText}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    keyboardType="decimal-pad"
                    className="flex-1 py-4 text-textDark text-xl"
                  />
                </View>

                {/* Quick amount buttons */}
                {mode === 'add' && targetRemaining > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    {[25, 50, 100].map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setAmountText(preset.toString())}
                        className="flex-1 py-2 rounded-lg bg-backgroundDark border border-borderDark items-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-secondaryDark text-sm">
                          {currencySymbol}{preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setAmountText(Math.floor(targetRemaining).toString())}
                      className="flex-1 py-2 rounded-lg bg-backgroundDark border border-green-500/30 items-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-green-400 text-sm">Fill</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {mode === 'withdraw' && currentlySaved > 0 && (
                  <View className="flex-row gap-2 mt-4">
                    {[25, 50, 100].map((preset) => (
                      <TouchableOpacity
                        key={preset}
                        onPress={() => setAmountText(preset.toString())}
                        className="flex-1 py-2 rounded-lg bg-backgroundDark border border-borderDark items-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-secondaryDark text-sm">
                          {currencySymbol}{preset}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={() => setAmountText(Math.floor(currentlySaved).toString())}
                      className="flex-1 py-2 rounded-lg bg-backgroundDark border border-accentBlue/30 items-center"
                      activeOpacity={0.7}
                    >
                      <Text className="text-accentBlue text-sm">All</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Account selector */}
                <View className="mt-4">
                  <AccountSelector
                    isDarkMode={isDarkMode}
                    showAccountDropdown={showAccountDropdown}
                    setShowAccountDropdown={setShowAccountDropdown}
                    isLoadingAccounts={false}
                    selectedAccount={selectedAccountName || 'Select account'}
                    setSelectedAccount={setSelectedAccountName}
                    accountOptions={sourceAccounts}
                    expenseAccountOptions={sourceAccounts}
                    transactionType="expense"
                  />
                </View>

                {/* Validation warnings */}
                {mode === 'add' && selectedAccount && amount > selectedAccount.balance && (
                  <View className="flex-row items-center gap-2 mt-4 p-3 rounded-xl bg-accentRed/10 border border-accentRed/30">
                    <Ionicons name="warning" size={16} color="#F2514A" />
                    <Text className="text-accentRed text-sm flex-1">
                      Insufficient balance in {selectedAccount.account_name}
                    </Text>
                  </View>
                )}
                {mode === 'withdraw' && amount > currentlySaved && (
                  <View className="flex-row items-center gap-2 mt-4 p-3 rounded-xl bg-accentRed/10 border border-accentRed/30">
                    <Ionicons name="warning" size={16} color="#F2514A" />
                    <Text className="text-accentRed text-sm flex-1">
                      Amount exceeds available savings ({formatCurrency(currentlySaved)})
                    </Text>
                  </View>
                )}

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!isValid || isSubmitting}
                  className={`mt-4 py-4 rounded-xl items-center ${
                    isValid && !isSubmitting
                      ? mode === 'add' ? 'bg-accentTeal' : 'bg-accentBlue'
                      : 'bg-gray-600'
                  }`}
                  activeOpacity={0.7}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text
                      className={`font-semibold text-base ${
                        isValid && !isSubmitting ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {mode === 'add' ? 'Add to Savings' : 'Withdraw'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
