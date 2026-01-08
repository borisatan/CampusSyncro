import { Building2, CreditCard, Edit2, MoreVertical, PiggyBank, Plus, Trash2, TrendingUp } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { Easing } from 'react-native-reanimated';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AddAccountPage from '../components/AccountsPage/AddAccountPage';
import EditAccountPage from '../components/AccountsPage/EditAccountPage';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { createAccount, deleteAccount, updateAccountBalance, updateAccountName, updateAccountType } from '../services/backendService';
import { useAccountsStore } from '../store/useAccountsStore';
import { useCurrencyStore } from '../store/useCurrencyStore';

interface Account {
  id: number;
  account_name: string;
  balance: number;
  type: string;
}

const typeConfig: { [key: string]: { icon: string; color: string } } = {
  checking: { icon: 'credit-card', color: 'blue' },
  savings: { icon: 'piggy-bank', color: 'purple' },
  investment: { icon: 'trending-up', color: 'teal' },
  investments: { icon: 'trending-up', color: 'teal' },
  credit: { icon: 'credit-card', color: 'red' },    
};

const iconMap: { [key: string]: any } = {
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'building': Building2,
};

const colorMap: { [key: string]: string } = {
  blue: 'bg-accentBlue',
  teal: 'bg-accentTeal',
  red: 'bg-accentRed',
  purple: 'bg-accentPurple',
};

const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay, // Staggered effect
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      {children}
    </Animated.View>
  );
};

export default function Accounts() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();
  const { registerAccountsRefresh, refreshDashboard, refreshTransactionList } = useDataRefresh();
  
  // Use global store instead of local state
  const accounts = useAccountsStore((state) => state.accounts);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  const addAccountOptimistic = useAccountsStore((state) => state.addAccountOptimistic);
  const updateAccountOptimistic = useAccountsStore((state) => state.updateAccountOptimistic);
  const deleteAccountOptimistic = useAccountsStore((state) => state.deleteAccountOptimistic);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Add account form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountType, setNewAccountType] = useState('checking');
  const { currencySymbol, isLoading: isCurrencyLoading, loadCurrency } = useCurrencyStore();
  
  // Edit account form
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
  
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadAccounts(), loadCurrency()]);
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
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
      // Optimistic update: Add temporary account immediately
      const tempId = Date.now();
      const optimisticAccount = {
        id: tempId,
        account_name: name,
        balance,
        type,
      };
      addAccountOptimistic(optimisticAccount);
      
      setShowAddModal(false);
      
      // Make actual API call in background
      const newAccount = await createAccount(name, balance, type, userId);
      
      // Replace temp with real account
      deleteAccountOptimistic(tempId);
      addAccountOptimistic(newAccount);
      
      // Refresh dashboard and transaction-list pages
      await Promise.all([
        refreshDashboard(),
        refreshTransactionList(),
      ]);
      
    } catch (err) {
      console.error('Failed to add account:', err);
      Alert.alert('Error', 'Failed to create account');
      // Reload accounts to revert optimistic update
      await loadAccounts();
    }
  };
  
  const handleEditAccount = (account: Account) => {
    setSelectedAccount(account);
    setEditName(account.account_name);
    setEditBalance(account.balance.toString());
    setShowEditModal(true);
    setEditingAccount(null);
  };
  
  const handleSaveEdit = async (updatedData: { name: string; balance: number; type: string }) => {
    if (!selectedAccount) return;
    
    const originalName = selectedAccount.account_name;
    const { name: newName, balance: newBalance, type: newType } = updatedData;
    
    // Optimistic update
    updateAccountOptimistic(selectedAccount.id, {
      account_name: newName,
      balance: newBalance,
      type: newType,
    });
    
    setShowEditModal(false);
    setSelectedAccount(null);
    
    try {
      if (originalName !== newName) {
        await updateAccountName(originalName, newName);
      }
      
      await updateAccountBalance(newName, newBalance);
      await updateAccountType(newName, newType);
      
      // Refresh dashboard and transaction-list pages
      await Promise.all([
        refreshDashboard(),
        refreshTransactionList(),
      ]);
      
    } catch (err) {
      console.error('Failed to update account:', err);
      Alert.alert('Error', 'Failed to update account details');
      // Reload accounts to revert optimistic update
      await loadAccounts();
    }
  };
  const handleDeleteAccount = (accountId: number) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            // Optimistic update: Remove immediately
            deleteAccountOptimistic(accountId);
            setEditingAccount(null);
            
            try {
              await deleteAccount(accountId);
              
              // Refresh dashboard and transaction-list pages
              await Promise.all([
                refreshDashboard(),
                refreshTransactionList(),
              ]);
              
            } catch (err) {
              console.error('Failed to delete account:', err);
              Alert.alert('Error', 'Failed to delete account');
              // Reload accounts to revert optimistic update
              await loadAccounts();
            }
          },
        },
      ]
    );
  };

  // Register refresh function so it can be called from other screens
  useEffect(() => {
    registerAccountsRefresh(loadAccounts);
  }, [registerAccountsRefresh]);
  
  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
          }
        >
          <View className="p-2" style={{ paddingBottom: insets.bottom + 20 }}>
            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className={`text-2xl font-semibold ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                  My Accounts
                </Text>
                <Text className={`mt-1 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  Manage your financial accounts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="w-10 h-10 bg-accentBlue rounded-full items-center justify-center active:opacity-80"
              >
                <Plus color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>

            {/* Total Balance */}
            <View className="bg-accentBlue rounded-2xl p-6 mb-6">
              <Text className="text-textDark/70 text-sm mb-2">Total Net Worth</Text>

              <View className="flex-row items-center mb-4">
                <Text
                  style={{
                    fontSize: 30,
                    fontWeight: '600',
                    color: '#FFFFFF', // textDark actual color, not class name
                  }}
                >
                  {currencySymbol}
                </Text>

                <AnimatedRollingNumber
                  value={totalBalance}
                  spinningAnimationConfig={{ duration: 800, easing: Easing.bounce }}
                  textStyle={{
                    fontSize: 30,
                    fontWeight: '600',
                    color: '#FFFFFF',
                  }}
                  toFixed={2}
                />
              </View>

              <View className="flex-row gap-4">
                <View>
                  <Text className="text-textDark/70 text-xs">Accounts</Text>
                  <Text className="text-textDark text-xl font-medium mt-1">
                    {accounts.length}
                  </Text>
                </View>
              </View>
            </View>


            {/* Accounts List */}
            <View>
              <Text className={`text-base font-medium mb-3 ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                All Accounts
              </Text>
              {accounts.map((account, index) => {
                const config = typeConfig[account.type.toLowerCase().trim()] || typeConfig.checking;
                const IconComponent = iconMap[config.icon] || CreditCard;
                const colorClass = colorMap[config.color] || 'bg-accentBlue';
                
                return (
                    <MotiView
                      key={account.id}
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                        delay: index * 100, // Staggered entrance
                      }}
                      className=""
                    >
                    <View key={account.id} className="mb-2">
                      <View className={`${isDark ? 'bg-surfaceDark border-borderDark' : 'bg-backgroundMuted border-borderLight'} rounded-2xl p-4 border`}>
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center flex-1">
                            <View className={`w-12 h-12 ${colorClass} rounded-xl items-center justify-center`}>
                              <IconComponent color="#FFFFFF" size={24} />
                            </View>
                            <View className="flex-1 ml-4">
                              <Text className={`font-medium ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                                {account.account_name}
                              </Text>
                              <Text className={`text-sm capitalize mt-0.5 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                                {account.type}
                              </Text>
                            </View>
                            <View className="items-end">
                              <View className="flex-row items-center">
                                <Text
                                  style={{
                                    fontSize: 18,
                                    fontWeight: '500',
                                    color: account.balance < 0 ? '#EF4444' : (isDark ? '#FFFFFF' : '#1F2937'),
                                  }}
                                >
                                  {currencySymbol}
                                </Text>
                                <AnimatedRollingNumber
                                  value={Math.abs(account.balance)}
                                  spinningAnimationConfig={{ duration: 800, easing: Easing.bounce }}
                                  textStyle={{
                                    fontSize: 18,
                                    fontWeight: '500',
                                    color: account.balance < 0 ? '#EF4444' : (isDark ? '#FFFFFF' : '#1F2937'),
                                  }}
                                  toFixed={2}
                                />
                              </View>
                              {account.balance < 0 && (
                                <Text className="text-xs text-accentRed mt-0.5">Outstanding</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            onPress={() => setEditingAccount(editingAccount === account.id ? null : account.id)}
                            className="w-8 h-8 items-center justify-center ml-2 active:opacity-70"
                          >
                            <MoreVertical color={isDark ? "#9CA3AF" : "#4B5563"} size={20} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      {editingAccount === account.id && (
                        <View className={`${isDark ? 'bg-inputDark border-borderDark' : 'bg-background border-borderLight'} rounded-lg mt-3 border overflow-hidden`}>
                          <TouchableOpacity
                            className={`flex-row items-center px-4 py-3 ${isDark ? 'active:bg-borderDark' : 'active:bg-backgroundMuted'}`}
                            onPress={() => handleEditAccount(account)}
                          >
                            <Edit2 color={isDark ? "#D1D5DB" : "#4B5563"} size={16} />
                            <Text className={`text-sm ml-2 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                              Edit
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className={`flex-row items-center px-4 py-3 ${isDark ? 'active:bg-borderDark' : 'active:bg-backgroundMuted'}`}
                            onPress={() => handleDeleteAccount(account.id)}
                          >
                            <Trash2 color="#EF4444" size={16} />
                            <Text className="text-accentRed text-sm ml-2">Delete</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </MotiView>
                );
              })}
            </View>
          </View>
        </ScrollView>

                {/* Add Account Page Overlay */}
        <Modal
          visible={showAddModal}
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <AddAccountPage 
            currencySymbol={currencySymbol}
            onBack={() => setShowAddModal(false)}
            onSave={handleAddAccount}
          />
        </Modal>

        {/* Edit Account Modal */}
          <Modal
            visible={showEditModal}
            animationType="slide"
            onRequestClose={() => setShowEditModal(false)}
          >
            {selectedAccount && (
              <EditAccountPage
                // Map your backend 'account_name' to the 'name' prop expected by the new page
                account={{
                  id: selectedAccount.id,
                  name: selectedAccount.account_name,
                  type: selectedAccount.type,
                  balance: selectedAccount.balance,
                }}
                onBack={() => setShowEditModal(false)}
                onSave={async (updatedData) => {
                  await handleSaveEdit(updatedData);
                }}
                currencySymbol={currencySymbol}
              />
            )}
          </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}