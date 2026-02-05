import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { createTransfer } from '../../services/backendService';
import { useAccountsStore } from '../../store/useAccountsStore';
import { Account } from '../../types/types';
import { SuccessModal } from '../Shared/SuccessModal';
import { AccountTransferCard } from './AccountTransferCard';

interface MoveMoneyPageProps {
  onBack: () => void;
  accounts: Account[];
  currencySymbol: string;
}

export default function MoveMoneyPage({
  onBack,
  accounts,
  currencySymbol,
}: MoveMoneyPageProps) {
  const isDark = true;
  const { userId } = useAuth();
  const { refreshAccounts, refreshBudgets } = useDataRefresh();
  const updateAccountBalanceStore = useAccountsStore((state) => state.updateAccountBalance);

  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<Account | null>(null);

  // Pre-select accounts based on sort_order (positions 1 and 2)
  useEffect(() => {
    if (accounts.length >= 2 && !sourceAccount && !destinationAccount) {
      const sortedAccounts = [...accounts].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999));
      setSourceAccount(sortedAccounts[0]);
      setDestinationAccount(sortedAccounts[1]);
    }
  }, [accounts]);
  const [amount, setAmount] = useState<string>('');
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showDestinationPicker, setShowDestinationPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirectionDown, setIsDirectionDown] = useState(true);

  const numericAmount = parseFloat(amount) || 0;

  // Determine actual source/destination based on arrow direction
  const actualSource = isDirectionDown ? sourceAccount : destinationAccount;
  const actualDestination = isDirectionDown ? destinationAccount : sourceAccount;

  // Check if destination is a savings or investment account
  const isSavingsTransfer = actualDestination?.type === 'savings' || actualDestination?.type === 'investment';
  const headerText = isSavingsTransfer && actualDestination
    ? `Save to ${actualDestination.account_name}`
    : 'Move money';
  const successText = isSavingsTransfer ? 'Saved!' : 'Transfer Complete!';

  const canSubmit =
    actualSource &&
    actualDestination &&
    actualSource.id !== actualDestination.id &&
    numericAmount > 0 &&
    numericAmount <= (actualSource?.balance || 0) &&
    !isSubmitting;

  const handleSelectSourceAccount = (account: Account) => {
    if (destinationAccount && account.id === destinationAccount.id) {
      setDestinationAccount(sourceAccount);
    }
    setSourceAccount(account);
    setShowSourcePicker(false);
  };

  const handleSelectDestinationAccount = (account: Account) => {
    if (sourceAccount && account.id === sourceAccount.id) {
      setSourceAccount(destinationAccount);
    }
    setDestinationAccount(account);
    setShowDestinationPicker(false);
  };

  const handleToggleDirection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDirectionDown(!isDirectionDown);
  };

  const handleSubmit = async () => {
    if (!canSubmit || !actualSource || !actualDestination || !userId) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      // Optimistic UI update
      const newSourceBalance = actualSource.balance - numericAmount;
      const newDestBalance = actualDestination.balance + numericAmount;
      updateAccountBalanceStore(actualSource.account_name, newSourceBalance);
      updateAccountBalanceStore(actualDestination.account_name, newDestBalance);

      setShowSuccess(true);

      // Backend transfer (just updates balances, no transactions created)
      await createTransfer({
        from_account: actualSource.account_name,
        to_account: actualDestination.account_name,
        amount: numericAmount,
        user_id: userId,
      });

      // Refresh to sync with server state
      await Promise.all([refreshAccounts(), refreshBudgets()]);
    } catch (error) {
      console.error('Transfer error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to complete transfer: ${message}`);
      // Rollback optimistic update
      if (actualSource) {
        updateAccountBalanceStore(actualSource.account_name, actualSource.balance);
      }
      if (actualDestination) {
        updateAccountBalanceStore(actualDestination.account_name, actualDestination.balance);
      }
      setShowSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderAccountPicker = (
    visible: boolean,
    onClose: () => void,
    onSelect: (account: Account) => void,
    excludeAccountId?: number
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 justify-end">
        <View className="bg-backgroundDark rounded-t-3xl max-h-[70%]">
          <View className="flex-row items-center justify-between p-4 border-b border-borderDark">
            <Text className="text-lg font-semibold text-textDark">Select Account</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <ScrollView className="p-4">
            {accounts
              .filter((acc) => acc.id !== excludeAccountId)
              .map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => onSelect(account)}
                  className="flex-row items-center justify-between p-4 mb-2 bg-surfaceDark rounded-xl"
                >
                  <View>
                    <Text className="text-base font-medium text-textDark">
                      {account.account_name}
                    </Text>
                    <Text className="text-sm text-secondaryDark">
                      {currencySymbol}{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#64748B" />
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView className="flex-1 bg-backgroundDark" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1">
          {/* Header */}
          <View className="flex-row items-center px-4 py-2">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center mr-2"
            >
              <ArrowLeft color="#94A3B8" size={24} />
            </TouchableOpacity>
            <Text className="text-xl font-semibold text-textDark">{headerText}</Text>
          </View>

          {/* Account Cards */}
          <View className="px-4 mt-4">
            <View className="bg-surfaceDark rounded-3xl p-4">
              {/* Top Account */}
              <AccountTransferCard
                account={sourceAccount}
                type={isDirectionDown ? "source" : "destination"}
                amount={numericAmount}
                currencySymbol={currencySymbol}
                onPress={() => setShowSourcePicker(true)}
                isDarkMode={isDark}
              />

              {/* Arrow Indicator */}
              <View className="items-center py-2">
                <TouchableOpacity
                  onPress={handleToggleDirection}
                  className="w-10 h-10 bg-white rounded-full items-center justify-center"
                >
                  <Ionicons name={isDirectionDown ? "arrow-down" : "arrow-up"} size={20} color="#1F2937" />
                </TouchableOpacity>
              </View>

              {/* Bottom Account */}
              <AccountTransferCard
                account={destinationAccount}
                type={isDirectionDown ? "destination" : "source"}
                amount={numericAmount}
                currencySymbol={currencySymbol}
                onPress={() => setShowDestinationPicker(true)}
                isDarkMode={isDark}
              />

              {/* Amount Input */}
              <View className="mt-4">
                <Text className="text-sm text-secondaryDark mb-2">Amount</Text>
                <View className="flex-row items-center bg-backgroundDark rounded-xl px-4">
                  <Text className="text-xl text-secondaryDark mr-2">{currencySymbol}</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0.00"
                    placeholderTextColor="#64748B"
                    keyboardType="decimal-pad"
                    className="flex-1 py-4 text-textDark text-xl"
                  />
                </View>
              </View>

              {/* Move Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit}
                className={`mt-4 py-4 rounded-xl items-center ${
                  canSubmit ? 'bg-accentBlue' : 'bg-gray-600'
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    canSubmit ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  Move
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Pickers */}
        {renderAccountPicker(
          showSourcePicker,
          () => setShowSourcePicker(false),
          handleSelectSourceAccount
        )}
        {renderAccountPicker(
          showDestinationPicker,
          () => setShowDestinationPicker(false),
          handleSelectDestinationAccount
        )}

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccess}
          text={successText}
          onDismiss={() => {
            setShowSuccess(false);
            onBack();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
