
import { Plus } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { Easing } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountListItem } from '../components/AccountsPage/AccountListItem';
import AddAccountPage from '../components/AccountsPage/AddAccountPage';
import EditAccountPage from '../components/AccountsPage/EditAccountPage';
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
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  useEffect(() => {
    registerAccountsRefresh(loadAccounts);
  }, [registerAccountsRefresh]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadAccounts(), loadCurrency()]);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddAccount = async (newAccountData: { name: string; balance: number; type: string }) => {
    const { name, balance, type } = newAccountData;
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }
    try {
      const tempId = Date.now();
      addAccountOptimistic({ id: tempId, account_name: name, balance, type });
      setShowAddModal(false);

      const newAccount = await AccountService.createAccount(name, balance, type, userId);
      deleteAccountOptimistic(tempId);
      addAccountOptimistic(newAccount);
      
      await Promise.all([refreshDashboard(), refreshTransactionList()]);
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

  const handleSaveEdit = async (updatedData: { name: string; balance: number; type: string }) => {
    if (!selectedAccount) return;
    const originalName = selectedAccount.account_name;
    const { name: newName, balance: newBalance, type: newType } = updatedData;

    updateAccountOptimistic(selectedAccount.id, { account_name: newName, balance: newBalance, type: newType });
    setShowEditModal(false);
    setSelectedAccount(null);

    try {
      if (originalName !== newName) await AccountService.updateAccountName(originalName, newName);
      await AccountService.updateAccountBalance(newName, newBalance);
      await AccountService.updateAccountType(newName, newType);
      await Promise.all([refreshDashboard(), refreshTransactionList()]);
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
        <ScrollView 
          className="flex-1" 
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />}
        >
          <View className="p-2" style={{ paddingBottom: insets.bottom + 20 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className={`text-2xl font-semibold ${isDark ? 'text-textDark' : 'text-textLight'}`}>My Accounts</Text>
                <Text className={`mt-1 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>Manage your financial accounts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="w-10 h-10 bg-accentBlue rounded-full items-center justify-center"
              >
                <Plus color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>

            {/* Total Balance Card */}
            <View className="bg-accentBlue rounded-2xl p-6 mb-6">
              <Text className="text-textDark/70 text-sm mb-2">Total Net Worth</Text>
              <View className="flex-row items-center mb-4">
                <Text style={{ fontSize: 30, fontWeight: '600', color: '#FFFFFF' }}>{currencySymbol}</Text>
                <AnimatedRollingNumber
                  value={totalBalance}
                  spinningAnimationConfig={{ duration: 1200, easing: Easing.bounce }}
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

        <Modal visible={showAddModal} animationType="slide"><AddAccountPage currencySymbol={currencySymbol} onBack={() => setShowAddModal(false)} onSave={handleAddAccount} /></Modal>
        
        <Modal visible={showEditModal} animationType="slide">
          {selectedAccount && (
            <EditAccountPage
              account={{ id: selectedAccount.id, name: selectedAccount.account_name, type: selectedAccount.type, balance: selectedAccount.balance }}
              onBack={() => setShowEditModal(false)}
              onSave={handleSaveEdit}
              currencySymbol={currencySymbol}
            />
          )}
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}