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

import { Account } from '../../types/types';
import { SuccessModal } from '../Shared/SuccessModal';

interface QuickSavingsModalProps {
  visible: boolean;
  accounts: Account[];
  currencySymbol: string;
  targetRemaining: number;
  onSave: (accountId: number, accountName: string, amount: number) => Promise<void>;
  onClose: () => void;
}

export const QuickSavingsModal: React.FC<QuickSavingsModalProps> = ({
  visible,
  accounts,
  currencySymbol,
  targetRemaining,
  onSave,
  onClose,
}) => {
  const [amountText, setAmountText] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Filter to non-savings accounts (accounts you'd typically save FROM)
  const sourceAccounts = accounts.filter(
    (acc) => acc.type?.toLowerCase() !== 'savings' && acc.type?.toLowerCase() !== 'investment'
  );

  // Auto-select first account and focus input when modal opens
  useEffect(() => {
    if (visible && sourceAccounts.length > 0 && !selectedAccount) {
      setSelectedAccount(sourceAccounts[0]);
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
      setSelectedAccount(null);
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleSave = async () => {
    if (!selectedAccount) return;
    const amount = parseFloat(amountText);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > selectedAccount.balance) return;

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
  const isValid = amount > 0 && selectedAccount && amount <= selectedAccount.balance;

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
                className="w-10 h-10 items-center justify-center mr-2"
              >
                <ArrowLeft color="#94A3B8" size={24} />
              </TouchableOpacity>
              <Text className="text-xl font-semibold text-textDark">Add to Savings</Text>
            </View>

            {/* Content */}
            <View className="px-4 mt-4">
              <View className="bg-surfaceDark rounded-3xl p-4 border border-borderDark">
                {/* Target info */}
                <View className="flex-row items-center gap-3 mb-5">
                  <View className="w-12 h-12 rounded-xl items-center justify-center bg-accentPurple">
                    <PiggyBank size={24} color="#FFFFFF" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-textDark text-lg font-semibold">
                      Contribute to your savings goal
                    </Text>
                    {targetRemaining > 0 && (
                      <Text className="text-secondaryDark text-sm">
                        {formatCurrency(targetRemaining)} left to reach your goal
                      </Text>
                    )}
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
                {targetRemaining > 0 && (
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

                {/* Account selector */}
                <Text className="text-sm text-secondaryDark mt-4 mb-2">Deduct from</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="always"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {sourceAccounts.map((account) => {
                    const isSelected = selectedAccount?.id === account.id;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => setSelectedAccount(account)}
                        className={`px-4 py-3 rounded-xl border ${
                          isSelected
                            ? 'bg-accentBlue/20 border-accentBlue'
                            : 'bg-backgroundDark border-borderDark'
                        }`}
                        activeOpacity={0.7}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            isSelected ? 'text-accentBlue' : 'text-textDark'
                          }`}
                        >
                          {account.account_name}
                        </Text>
                        <Text className="text-secondaryDark text-xs mt-0.5">
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Insufficient balance warning */}
                {selectedAccount && amount > selectedAccount.balance && (
                  <View className="flex-row items-center gap-2 mt-4 p-3 rounded-xl bg-accentRed/10 border border-accentRed/30">
                    <Ionicons name="warning" size={16} color="#F2514A" />
                    <Text className="text-accentRed text-sm flex-1">
                      Insufficient balance in {selectedAccount.account_name}
                    </Text>
                  </View>
                )}

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSave}
                  disabled={!isValid || isSubmitting}
                  className={`mt-4 py-4 rounded-xl items-center ${
                    isValid && !isSubmitting ? 'bg-accentTeal' : 'bg-gray-600'
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
                      Add to Savings
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
