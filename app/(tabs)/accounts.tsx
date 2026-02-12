
import { ArrowLeftRight, Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';

import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountListItem } from '../components/AccountsPage/AccountListItem';
import AddAccountPage from '../components/AccountsPage/AddAccountPage';
import EditAccountPage from '../components/AccountsPage/EditAccountPage';
import MoveMoneyPage from '../components/MoveMoneyPage/MoveMoneyPage';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import * as AccountService from '../services/backendService';
import { useAccountsStore } from '../store/useAccountsStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

export default function Accounts() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { registerAccountsRefresh, refreshDashboard, refreshTransactionList } = useDataRefresh();
  
  const accounts = useAccountsStore((state) => state.accounts);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const addAccountOptimistic = useAccountsStore((state) => state.addAccountOptimistic);
  const updateAccountOptimistic = useAccountsStore((state) => state.updateAccountOptimistic);
  const deleteAccountOptimistic = useAccountsStore((state) => state.deleteAccountOptimistic);
  const { currencySymbol, loadCurrency } = useCurrencyStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showMoveMoneyModal, setShowMoveMoneyModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  useEffect(() => {
    registerAccountsRefresh(loadAccounts);
  }, [registerAccountsRefresh]);

  const handleAddAccount = async (newAccountData: { name: string; balance: number; type: string; sort_order?: number }) => {
    const { name, balance, type, sort_order } = newAccountData;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }
    try {
      const tempId = Date.now();
      const insertPosition = sort_order ?? accounts.length;
      addAccountOptimistic({ id: tempId, account_name: name, balance, type, sort_order: insertPosition });
      setShowAddModal(false);

      // Shift existing accounts if inserting at a position that's not at the end
      if (insertPosition < accounts.length) {
        await AccountService.shiftAccountsForInsert(insertPosition, accounts);
      }

      const newAccount = await AccountService.createAccount(name, balance, type, userId, insertPosition);
      deleteAccountOptimistic(tempId);
      addAccountOptimistic(newAccount);

      await Promise.all([loadAccounts(), refreshDashboard(), refreshTransactionList()]);
    } catch (err) {
      Alert.alert('Error', 'Failed to create account');
      await loadAccounts();
    }
  };

  const handleEditAccount = (account: any) => {
    setSelectedAccount(account);
    setShowEditModal(true);
    setEditingAccountId(null);
  };

  const handleSaveEdit = async (updatedData: { name: string; balance: number; type: string; sort_order?: number; monthly_savings_goal?: number | null }) => {
    if (!selectedAccount) return;
    const originalName = selectedAccount.account_name;
    const oldSortOrder = selectedAccount.sort_order ?? 0;
    const { name: newName, balance: newBalance, type: newType, sort_order: newSortOrder, monthly_savings_goal: newGoal } = updatedData;

    updateAccountOptimistic(selectedAccount.id, { account_name: newName, balance: newBalance, type: newType, sort_order: newSortOrder, monthly_savings_goal: newGoal });
    setShowEditModal(false);
    setSelectedAccount(null);

    try {
      if (originalName !== newName) await AccountService.updateAccountName(originalName, newName);
      await AccountService.updateAccountBalance(newName, newBalance);
      await AccountService.updateAccountType(newName, newType);

      // Update savings goal if it changed
      if (newGoal !== selectedAccount.monthly_savings_goal) {
        await AccountService.updateAccountSavingsGoal(selectedAccount.id, newGoal ?? null);
      }

      // Reorder accounts if sort_order changed
      if (newSortOrder !== undefined && newSortOrder !== oldSortOrder) {
        await AccountService.reorderAccountPosition(selectedAccount.id, oldSortOrder, newSortOrder, accounts);
      }

      await Promise.all([loadAccounts(), refreshDashboard(), refreshTransactionList()]);
    } catch (err) {
      Alert.alert('Error', 'Failed to update account');
      await loadAccounts();
    }
  };

  const handleDeleteAccount = (accountId: number) => {
    Alert.alert('Delete Account', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          deleteAccountOptimistic(accountId);
          setEditingAccountId(null);
          try {
            await AccountService.deleteAccount(accountId);
            await Promise.all([refreshDashboard(), refreshTransactionList()]);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete');
            await loadAccounts();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
        <ScrollView className="flex-1">
          <View className="px-2" style={{ paddingBottom: insets.bottom + 20 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between pt-4 pb-3 px-2">
              <View>
                <Text
                  style={{
                    fontSize: 28,
                    fontWeight: "800",
                    color: isDark ? "#F1F5F9" : "#0F172A",
                    letterSpacing: -0.5,
                  }}
                >
                  My Accounts
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? "#7C8CA0" : "#94A3B8",
                    marginTop: 2,
                  }}
                >
                  Manage your financial accounts
                </Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setShowMoveMoneyModal(true)}
                  className={`w-10 h-10 rounded-full items-center justify-center mr-2 ${isDark ? 'bg-surfaceDark' : 'bg-gray-100'}`}
                >
                  <ArrowLeftRight color={isDark ? '#94A3B8' : '#6B7280'} size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowAddModal(true)}
                  className="w-10 h-10 bg-accentBlue rounded-full items-center justify-center"
                >
                  <Plus color="#FFFFFF" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Balance Card */}
            <View className="bg-accentBlue rounded-2xl p-6 mb-6">
              <Text className="text-textDark/70 text-sm mb-2">Total Net Worth</Text>
              <View className="flex-row items-center mb-4">
                <Text style={{ fontSize: 30, fontWeight: '600', color: '#FFFFFF' }}>{currencySymbol}</Text>
                <AnimatedRollingNumber
                  value={totalBalance}
                  spinningAnimationConfig={{ duration: 600 }}
                  textStyle={{ fontSize: 30, fontWeight: '600', color: '#FFFFFF' }}
                  toFixed={2}
                />
              </View>
              <View><Text className="text-textDark/70 text-xs">Accounts</Text><Text className="text-textDark text-xl font-medium mt-1">{accounts.length}</Text></View>
            </View>

            {/* List */}
            <Text className={`text-base font-medium mb-3 ${isDark ? 'text-textDark' : 'text-textLight'}`}>All Accounts</Text>
            {accounts.map((account, index) => (
              <AccountListItem
                key={account.id}
                account={account}
                index={index}
                isDark={isDark}
                currencySymbol={currencySymbol}
                isMenuOpen={editingAccountId === account.id}
                onToggleMenu={() => setEditingAccountId(editingAccountId === account.id ? null : account.id)}
                onEdit={handleEditAccount}
                onDelete={handleDeleteAccount}
              />
            ))}
          </View>
        </ScrollView>

        <Modal visible={showAddModal} animationType="slide"><AddAccountPage currencySymbol={currencySymbol} onBack={() => setShowAddModal(false)} onSave={handleAddAccount} accountCount={accounts.length} /></Modal>

        <Modal visible={showEditModal} animationType="slide">
          {selectedAccount && (
            <EditAccountPage
              account={{ id: selectedAccount.id, name: selectedAccount.account_name, type: selectedAccount.type, balance: selectedAccount.balance, sort_order: selectedAccount.sort_order, monthly_savings_goal: selectedAccount.monthly_savings_goal }}
              onBack={() => setShowEditModal(false)}
              onSave={handleSaveEdit}
              currencySymbol={currencySymbol}
              accountCount={accounts.length}
            />
          )}
        </Modal>

        <Modal visible={showMoveMoneyModal} animationType="slide">
          <MoveMoneyPage
            onBack={() => setShowMoveMoneyModal(false)}
            accounts={accounts}
            currencySymbol={currencySymbol}
          />
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}