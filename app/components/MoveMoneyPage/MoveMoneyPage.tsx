import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, CreditCard, PiggyBank, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { contributeToGoal, createTransfer, fetchGoalsByAccount, recordSavingsTransfer } from '../../services/backendService';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Account, Goal } from '../../types/types';
import { SuccessModal } from '../Shared/SuccessModal';
import { AccountTransferCard } from './AccountTransferCard';
import { GoalSelector } from './GoalSelector';

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
  const { refreshAccounts, refreshBudgets, refreshGoals } = useDataRefresh();
  const updateAccountBalanceStore = useAccountsStore((state) => state.updateAccountBalance);
  const incrementGoalAmount = useGoalsStore((state) => state.incrementGoalAmount);

  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [destinationAccount, setDestinationAccount] = useState<Account | null>(null);
  const [accountGoals, setAccountGoals] = useState<Goal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

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

  // Load goals when destination changes to savings/investment
  useEffect(() => {
    if (actualDestination && isSavingsTransfer) {
      fetchGoalsByAccount(actualDestination.id).then(setAccountGoals);
    } else {
      setAccountGoals([]);
      setSelectedGoal(null);
    }
  }, [actualDestination?.id, isSavingsTransfer]);
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
      // Optimistic UI update for accounts
      const newSourceBalance = actualSource.balance - numericAmount;
      const newDestBalance = actualDestination.balance + numericAmount;
      updateAccountBalanceStore(actualSource.account_name, newSourceBalance);
      updateAccountBalanceStore(actualDestination.account_name, newDestBalance);

      // Optimistic UI update for goal if selected
      if (selectedGoal) {
        incrementGoalAmount(selectedGoal.id, numericAmount);
      }

      setShowSuccess(true);

      // If a goal is selected, use contributeToGoal (handles transfer + contribution record)
      if (selectedGoal) {
        await contributeToGoal({
          goal_id: selectedGoal.id,
          user_id: userId,
          amount: numericAmount,
          source_account_id: actualSource.id,
          source_account_name: actualSource.account_name,
          destination_account_name: actualDestination.account_name,
        });
      } else {
        // Regular transfer (just updates balances, no transactions created)
        await createTransfer({
          from_account: actualSource.account_name,
          to_account: actualDestination.account_name,
          amount: numericAmount,
          user_id: userId,
        });

        // If transferring to a savings/investment account, record it as savings progress
        if (isSavingsTransfer) {
          await recordSavingsTransfer({
            user_id: userId,
            amount: numericAmount,
            source_account_id: actualSource.id,
          });
        }
      }

      // Refresh to sync with server state
      await Promise.all([refreshAccounts(), refreshBudgets(), refreshGoals()]);
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
      if (selectedGoal) {
        incrementGoalAmount(selectedGoal.id, -numericAmount);
      }
      setShowSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const TYPE_CONFIG: { [key: string]: { icon: string; color: string } } = {
    checking: { icon: 'credit-card', color: 'blue' },
    savings: { icon: 'piggy-bank', color: 'purple' },
    investment: { icon: 'trending-up', color: 'teal' },
    investments: { icon: 'trending-up', color: 'teal' },
    credit: { icon: 'credit-card', color: 'red' },
  };

  const ICON_MAP: { [key: string]: any } = {
    'credit-card': CreditCard,
    'piggy-bank': PiggyBank,
    'trending-up': TrendingUp,
  };

  const COLOR_MAP: { [key: string]: string } = {
    blue: 'bg-accentBlue',
    teal: 'bg-accentTeal',
    red: 'bg-accentRed',
    purple: 'bg-accentPurple',
  };

  const getAccountIconAndColor = (type: string) => {
    const config = TYPE_CONFIG[type?.toLowerCase().trim()] || TYPE_CONFIG.checking;
    const IconComponent = ICON_MAP[config.icon] || CreditCard;
    const colorClass = COLOR_MAP[config.color] || 'bg-accentBlue';
    return { IconComponent, colorClass };
  };

  const renderAccountPicker = (
    visible: boolean,
    onClose: () => void,
    onSelect: (account: Account) => void,
    excludeAccountId?: number
  ) => (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end">
          <TouchableWithoutFeedback>
            <View className="bg-backgroundDark rounded-t-3xl max-h-[70%]">
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-borderDark bg-surfaceDark rounded-t-3xl">
                <Text className="text-lg font-semibold text-textDark">Select Account</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#94A3B8" />
                </TouchableOpacity>
              </View>
              <ScrollView className="px-2 py-2">
                {accounts
                  .filter((acc) => acc.id !== excludeAccountId)
                  .map((account) => {
                    const { IconComponent, colorClass } = getAccountIconAndColor(account.type);
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => onSelect(account)}
                        activeOpacity={0.6}
                        className="px-4 py-4 flex-row items-center mb-2 rounded-xl bg-surfaceDark border border-borderDark"
                      >
                        <View className={`w-12 h-12 ${colorClass} rounded-xl items-center justify-center mr-3`}>
                          <IconComponent color="#FFFFFF" size={24} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-base font-medium text-textDark">
                            {account.account_name}
                          </Text>
                          <Text className="text-sm text-secondaryDark">
                            {currencySymbol}{account.balance.toFixed(2)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
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
          <View className="flex-row items-center px-2 py-3 my-2">
            <TouchableOpacity
              onPress={onBack}
              className="w-10 h-10 items-center justify-center mr-2"
            >
              <ArrowLeft color="#94A3B8" size={24} />
            </TouchableOpacity>
            <Text className="text-2xl font-semibold text-textDark">{headerText}</Text>
          </View>

          <TouchableWithoutFeedback onPress={() => {
            setShowSourcePicker(false);
            setShowDestinationPicker(false);
            Keyboard.dismiss();
          }}>
            <ScrollView
              className="flex-1"
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Account Cards */}
              <View className="px-2 mt-4">
              <View className="bg-surfaceDark rounded-3xl p-2">
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
                    autoFocus
                  />
                </View>
              </View>

              {/* Goal Selector (only shown for savings transfers with goals) */}
              {isSavingsTransfer && accountGoals.length > 0 && numericAmount > 0 && (
                <GoalSelector
                  goals={accountGoals}
                  selectedGoal={selectedGoal}
                  onSelect={setSelectedGoal}
                  currencySymbol={currencySymbol}
                />
              )}

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
            </ScrollView>
          </TouchableWithoutFeedback>
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
