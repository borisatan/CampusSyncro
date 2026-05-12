import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Pencil } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { GestureHandlerRootView, Pressable as GHPressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { contributeToGoal, deleteGoalContribution, trackGoalAmount, withdrawFromGoal } from '../../services/backendService';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Account, Goal, GoalContribution } from '../../types/types';
import { parseAmount } from '../../utils/parseAmount';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';
import { EditGoalModal } from './EditGoalModal';

interface GoalDetailModalProps {
  visible: boolean;
  goal: Goal | null;
  accounts: Account[];
  currencySymbol: string;
  onClose: () => void;
  onTransactionComplete: () => void;
  onGoalUpdated: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAmount(amount: number, symbol: string): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function DeleteAction({ drag }: { drag: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(drag.value, [-80, -40, 0], [1, 0.85, 0.7], 'clamp');
    const opacity = interpolate(drag.value, [-80, -30, 0], [1, 0.8, 0], 'clamp');
    return { transform: [{ scale }], opacity };
  });
  return (
    <View className="bg-red-500 rounded-2xl mb-0 justify-center items-center" style={{ width: 80 }}>
      <Animated.View style={animatedStyle} className="items-center justify-center">
        <Ionicons name="trash-outline" size={22} color="white" />
      </Animated.View>
    </View>
  );
}

function SwipeableContributionCard({
  contribution,
  accounts,
  currencySymbol,
  onDelete,
}: {
  contribution: GoalContribution;
  accounts: Account[];
  currencySymbol: string;
  onDelete: (c: GoalContribution) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const isPositive = contribution.amount >= 0;
  const accountName = contribution.source_account_id
    ? accounts.find((a) => String(a.id) === String(contribution.source_account_id))?.account_name ?? 'Unknown'
    : null;

  const handleSwipeOpen = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Contribution',
      'Remove this contribution? The goal amount will be updated.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => swipeableRef.current?.close() },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeableRef.current?.close();
            onDelete(contribution);
          },
        },
      ]
    );
  }, [contribution, onDelete]);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, drag: SharedValue<number>) => (
      <DeleteAction drag={drag} />
    ),
    []
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      friction={1}
    >
      <View className="flex-row items-center bg-surfaceDark border border-borderDark rounded-2xl p-4">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: isPositive ? '#16A34A' : '#DC2626' }}
        >
          <Ionicons name={isPositive ? 'arrow-down' : 'arrow-up'} size={18} color="#fff" />
        </View>
        <View className="flex-1">
          <Text className="text-slate100 text-base font-semibold">
            {isPositive ? 'Added' : 'Withdrawn'}
            {accountName ? (isPositive ? ` from ${accountName}` : ` to ${accountName}`) : ''}
          </Text>
          <Text className="text-slateMuted text-sm mt-0.5">{formatDate(contribution.created_at)}</Text>
        </View>
        <Text className="text-base font-bold" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
          {isPositive ? '+' : '−'}{formatAmount(Math.abs(contribution.amount), currencySymbol)}
        </Text>
      </View>
    </ReanimatedSwipeable>
  );
}

export function GoalDetailModal({
  visible,
  goal,
  accounts,
  currencySymbol,
  onClose,
  onTransactionComplete,
  onGoalUpdated,
}: GoalDetailModalProps) {
  const { userId } = useAuth();
  const { isDarkMode } = useTheme();
  const { contributions, isLoadingContributions, loadContributions } = useGoalsStore();

  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'withdraw'>('add');
  const [amount, setAmount] = useState('');
  const [selectedAccountName, setSelectedAccountName] = useState('');
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    if (visible && goal) {
      loadContributions(goal.id);
    }
  }, [visible, goal?.id]);

  useEffect(() => {
    if (!visible) {
      setShowForm(false);
      setAmount('');
      setSelectedAccountName('');
      setShowAccountDropdown(false);
    }
  }, [visible]);

  const handleOpenForm = useCallback((mode: 'add' | 'withdraw') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormMode(mode);
    setAmount('');
    setSelectedAccountName('');
    setShowAccountDropdown(false);
    setShowForm(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setAmount('');
    setSelectedAccountName('');
  }, []);

  const handleDeleteContribution = useCallback(async (c: GoalContribution) => {
    if (!goal) return;
    try {
      await deleteGoalContribution(c.id, goal.id, c.amount);
      await loadContributions(goal.id);
      onTransactionComplete();
    } catch (error) {
      console.error('Delete contribution error:', error);
      Alert.alert('Error', 'Failed to delete contribution. Please try again.');
    }
  }, [goal, loadContributions, onTransactionComplete]);

  const handleSubmit = useCallback(async () => {
    if (!goal || !userId) return;

    const parsedAmount = parseAmount(amount);
    if (parsedAmount <= 0) return;
    if (formMode === 'withdraw' && parsedAmount > goal.current_amount) {
      Alert.alert('Error', 'Amount exceeds current goal balance.');
      return;
    }

    const goalAccount = accounts.find((a) => String(a.id) === String(goal.account_id));
    const selectedAccount = accounts.find((a) => a.account_name === selectedAccountName);
    const availableAccounts = accounts.filter((a) => a.type !== 'savings' && a.type !== 'investment');

    if (formMode === 'add') {
      if (!selectedAccount) {
        Alert.alert('Error', 'Please select an account.');
        return;
      }
    } else {
      if (!goalAccount && !selectedAccount) {
        Alert.alert('Error', 'Please select a destination account.');
        return;
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSubmitting(true);

    try {
      if (formMode === 'add') {
        if (goalAccount) {
          await contributeToGoal({
            goal_id: goal.id,
            user_id: userId,
            amount: parsedAmount,
            source_account_id: selectedAccount!.id,
            source_account_name: selectedAccount!.account_name,
            destination_account_name: goalAccount.account_name,
          });
        } else {
          await trackGoalAmount({
            goal_id: goal.id,
            user_id: userId,
            amount: parsedAmount,
            source_account_id: selectedAccount?.id,
          });
        }
      } else {
        if (goalAccount) {
          const destinationAccount = availableAccounts.find((a) => a.account_name === selectedAccountName);
          await withdrawFromGoal({
            goal_id: goal.id,
            user_id: userId,
            amount: parsedAmount,
            source_account_id: goalAccount.id,
            source_account_name: goalAccount.account_name,
            destination_account_name: destinationAccount?.account_name ?? '',
          });
        } else {
          await withdrawFromGoal({
            goal_id: goal.id,
            user_id: userId,
            amount: parsedAmount,
            destination_account_id: selectedAccount?.id,
          });
        }
      }

      await loadContributions(goal.id);
      onTransactionComplete();
      handleCloseForm();
    } catch (error) {
      console.error('Goal transaction error:', error);
      Alert.alert('Error', `Failed to ${formMode === 'add' ? 'add funds' : 'withdraw'}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [goal, userId, amount, formMode, accounts, selectedAccountName, loadContributions, onTransactionComplete, handleCloseForm]);

  if (!goal) return null;

  const goalContributions = contributions[goal.id] ?? [];
  const goalAccount = accounts.find((a) => String(a.id) === String(goal.account_id));
  const availableAccounts = accounts.filter((a) => a.type !== 'savings' && a.type !== 'investment');

  const progress = goal.target_amount > 0
    ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
    : 0;
  const accentColor = goal.color || '#a78bfa';
  const isComplete = goal.current_amount >= goal.target_amount;

  const { start: monthStart, end: monthEnd } = getCurrentMonthRange();
  const thisMonthSaved = goalContributions
    .filter((c) => {
      const d = new Date(c.created_at);
      return d >= monthStart && d < monthEnd;
    })
    .reduce((sum, c) => sum + c.amount, 0);
  const monthlyTarget = goal.monthly_contribution ?? 0;
  const monthlyPct = monthlyTarget > 0 ? Math.min((thisMonthSaved / monthlyTarget) * 100, 100) : 0;

  const parsedAmount = parseAmount(amount);
  const canSubmit = parsedAmount > 0 && !isSubmitting;
  const needsAccount = formMode === 'add' || !goalAccount;
  const hasAccountSelected = !needsAccount || selectedAccountName.trim() !== '';
  const isFormReady = canSubmit && hasAccountSelected;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-backgroundDark" edges={['top', 'bottom']}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              className="flex-1"
            >
              {/* Header — back | logo + name | edit */}
              <View className="flex-row items-center px-4 pt-2 pb-4 gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center"
                  activeOpacity={0.7}
                >
                  <ArrowLeft color="#94A3B8" size={20} />
                </TouchableOpacity>
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: accentColor }}
                >
                  <Ionicons name={(goal.icon as any) || 'flag-outline'} size={26} color="#fff" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold -tracking-tight" numberOfLines={1}>
                    {goal.name}
                  </Text>
                  {goal.target_date ? (
                    <Text className="text-slateMuted text-xs mt-0.5">
                      Target: {formatDate(goal.target_date)}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => setShowEditModal(true)}
                  className="w-10 h-10 bg-backgroundDark border border-borderDark rounded-xl items-center justify-center"
                  activeOpacity={0.7}
                >
                  <Pencil color="#94A3B8" size={16} />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 16 }}
                keyboardDismissMode="on-drag"
              >

                {/* Progress hero */}
                <View className="mx-4 mb-4 bg-surfaceDark rounded-2xl p-6 border border-borderDark">
                  <Text className="text-slateMuted text-sm font-medium mb-2">Total saved</Text>
                  <Text className="text-white font-bold" style={{ fontSize: 40, lineHeight: 46 }}>
                    {currencySymbol}{goal.current_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </Text>
                  <Text className="text-slateMuted text-base mb-4">
                    of {currencySymbol}{goal.target_amount.toLocaleString('en-US', { maximumFractionDigits: 0 })} goal
                  </Text>
                  <View className="h-3 rounded-full overflow-hidden bg-gray-700 mb-3">
                    <View
                      className="h-full rounded-full"
                      style={{ width: `${progress}%`, backgroundColor: '#22c55e' }}
                    />
                  </View>
                  <Text className="text-base font-semibold" style={{ color: '#22c55e' }}>
                    {isComplete ? 'Goal reached!' : `${Math.round(progress)}% complete`}
                  </Text>
                </View>

                {/* Monthly tracker — secondary */}
                {monthlyTarget > 0 && !isComplete && (
                  <View className="mx-4 mb-6 bg-surfaceDark rounded-2xl p-4 border border-borderDark">
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-slate300 text-sm font-medium">This month</Text>
                      <Text className="text-slate100 text-sm font-semibold">
                        {formatAmount(thisMonthSaved, currencySymbol)} / {formatAmount(monthlyTarget, currencySymbol)} target
                      </Text>
                    </View>
                    <View className="h-1.5 rounded-full overflow-hidden bg-gray-700">
                      <View
                        className="h-full rounded-full"
                        style={{ width: `${monthlyPct}%`, backgroundColor: '#22c55e' }}
                      />
                    </View>
                    <Text className="text-xs mt-1.5 text-right" style={{ color: '#22c55e' }}>
                      {Math.round(monthlyPct)}%
                    </Text>
                  </View>
                )}

                {/* Contributions */}
                <View className="mx-4">
                  <Text className="text-slateMuted text-xs font-semibold uppercase tracking-wide mb-3">
                    Contributions
                  </Text>

                  {isLoadingContributions && goalContributions.length === 0 && (
                    <Text className="text-slateMuted text-sm text-center py-4">Loading...</Text>
                  )}

                  {!isLoadingContributions && goalContributions.length === 0 && (
                    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark items-center">
                      <Text className="text-slateMuted text-sm">No contributions yet</Text>
                    </View>
                  )}

                  <View className="gap-3">
                    {goalContributions.map((c) => (
                      <SwipeableContributionCard
                        key={c.id}
                        contribution={c}
                        accounts={accounts}
                        currencySymbol={currencySymbol}
                        onDelete={handleDeleteContribution}
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>

              {/* Sticky bottom bar */}
              <View className="flex-row gap-3 px-4 pt-3 pb-3 border-t border-borderDark bg-backgroundDark">
                <TouchableOpacity
                  onPress={() => handleOpenForm('add')}
                  className="flex-1 py-3 rounded-xl items-center bg-accentTeal"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold text-sm">Add Funds</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleOpenForm('withdraw')}
                  className="flex-1 py-3 rounded-xl items-center border border-borderDark bg-surfaceDark"
                  activeOpacity={0.8}
                >
                  <Text className="text-slate200 font-semibold text-sm">Withdraw</Text>
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </GestureHandlerRootView>
        </SafeAreaView>
      </SafeAreaProvider>

      {/* Add / Withdraw bottom sheet */}
      <Modal
        visible={showForm}
        transparent
        animationType="slide"
        onRequestClose={handleCloseForm}
      >
        <Pressable className="flex-1 bg-black/60" onPress={handleCloseForm} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="bg-backgroundDark border-t border-borderDark px-4 pt-5 pb-8">
            <Text className="text-white text-lg font-bold mb-4">
              {formMode === 'add' ? 'Add Funds' : 'Withdraw'}
            </Text>

            <View className="flex-row items-center px-4 rounded-xl border bg-inputDark border-borderDark mb-3">
              <Text className="text-2xl mr-1 text-slate400" style={{ lineHeight: 24 }}>
                {currencySymbol}
              </Text>
              <TextInput
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#475569"
                value={amount}
                onChangeText={setAmount}
                className="flex-1 py-4 text-2xl text-textDark"
                style={{ lineHeight: 24 }}
                autoFocus
              />
            </View>

            {formMode === 'add' && goalAccount ? (
              <View className="flex-row items-center px-3 py-3 rounded-xl bg-inputDark border border-borderDark mb-3">
                <Ionicons name="arrow-forward" size={14} color="#64748B" />
                <Text className="text-slate400 text-sm ml-2">
                  Transfers to <Text className="text-slate200">{goalAccount.account_name}</Text>
                </Text>
              </View>
            ) : (
              <View className="mb-3">
                <AccountSelector
                  isDarkMode={isDarkMode}
                  showAccountDropdown={showAccountDropdown}
                  setShowAccountDropdown={setShowAccountDropdown}
                  isLoadingAccounts={false}
                  selectedAccount={selectedAccountName || (formMode === 'add' ? 'Source account' : 'Destination account')}
                  setSelectedAccount={setSelectedAccountName}
                  accountOptions={availableAccounts}
                  expenseAccountOptions={availableAccounts}
                  transactionType="expense"
                />
              </View>
            )}

            {formMode === 'withdraw' && parsedAmount > goal.current_amount && (
              <Text className="text-red-400 text-xs mb-3">Amount exceeds current goal balance</Text>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!isFormReady || (formMode === 'withdraw' && parsedAmount > goal.current_amount)}
              className={`py-4 rounded-xl items-center ${isFormReady && !(formMode === 'withdraw' && parsedAmount > goal.current_amount) ? (formMode === 'add' ? 'bg-accentTeal' : 'bg-accentRed') : 'bg-gray-700'}`}
              activeOpacity={0.8}
            >
              <Text className={`font-semibold text-base ${isFormReady ? 'text-white' : 'text-gray-400'}`}>
                {isSubmitting ? 'Processing...' : formMode === 'add' ? 'Confirm' : 'Confirm Withdrawal'}
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <EditGoalModal
        visible={showEditModal}
        goal={goal}
        currencySymbol={currencySymbol}
        onClose={() => setShowEditModal(false)}
        onGoalUpdated={() => {
          setShowEditModal(false);
          onGoalUpdated();
        }}
      />
    </Modal>
  );
}
