import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CreditCard, PiggyBank, TrendingUp, MoreVertical, Plus, Edit2, Trash2, Building2 } from 'lucide-react-native';
import { createAccount, deleteAccount, fetchAccounts, updateAccountBalance, updateAccountName, updateAccountType } from '../services/backendService';
import { useAuth } from '../context/AuthContext';
import EditAccountPage from '../components/AccountsPage/EditAccountPage';

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

export default function Accounts() {
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { userId } = useAuth();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add account form
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountType, setNewAccountType] = useState('checking');

  // Edit account form
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const loadAccounts = async () => {
    try {
      const data: Account[] = await fetchAccounts();
      setAccounts(data);
    } catch (err) {
      console.error('Failed to fetch accounts:', err);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await loadAccounts();
    } catch (err) {
      console.error('Failed to refresh accounts:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    try {
      const balance = parseFloat(newAccountBalance) || 0;
      const newAccount = await createAccount(newAccountName, balance, userId);
      setAccounts(prev => [...prev, newAccount]);
      setShowAddModal(false);
      setNewAccountName('');
      setNewAccountBalance('');
      setNewAccountType('checking');
    } catch (err) {
      console.error('Failed to add account:', err);
      Alert.alert('Error', 'Failed to create account');
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
  
    try {
      if (originalName !== newName) {
        await updateAccountName(originalName, newName);
      }
  
      await updateAccountBalance(newName, newBalance);
  
      await updateAccountType(newName, newType);
  
      // 4. Update local state
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === selectedAccount.id
            ? { ...acc, account_name: newName, balance: newBalance, type: newType }
            : acc
        )
      );
  
      setShowEditModal(false);
      setSelectedAccount(null);
    } catch (err) {
      console.error('Failed to update account:', err);
      Alert.alert('Error', 'Failed to update account details');
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
            try {
              await deleteAccount(accountId);
              setAccounts(prev => prev.filter(acc => acc.id !== accountId));
              setEditingAccount(null);
            } catch (err) {
              console.error('Failed to delete account:', err);
              Alert.alert('Error', 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
          }
        >
          <View className="p-6 space-y-6" style={{ paddingBottom: insets.bottom + 20 }}>
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
              <Text className="text-textDark text-3xl font-semibold mb-4">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Text>
              <View className="flex-row gap-4">
                <View>
                  <Text className="text-textDark/70 text-xs">Accounts</Text>
                  <Text className="text-textDark text-xl font-medium mt-1">{accounts.length}</Text>
                </View>
              </View>
            </View>

            {/* Accounts List */}
            <View>
              <Text className={`text-base font-medium mb-3 ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                All Accounts
              </Text>
              {accounts.map((account) => {
                const config = typeConfig[account.type.toLowerCase().trim()] || typeConfig.checking;
                const IconComponent = iconMap[config.icon] || CreditCard;
                const colorClass = colorMap[config.color] || 'bg-accentBlue';
                
                
                return (
                  <View key={account.id} className="mb-4">
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
                            <Text className={`text-lg font-medium ${account.balance < 0 ? 'text-accentRed' : (isDark ? 'text-textDark' : 'text-textLight')}`}>
                              ${Math.abs(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </Text>
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
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Add Account Modal */}
        <Modal
          visible={showAddModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddModal(false)}
        >
          <TouchableOpacity
            className="flex-1 bg-black/70 justify-end"
            activeOpacity={1}
            onPress={() => setShowAddModal(false)}
          >
            <TouchableOpacity
              className={`${isDark ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'} rounded-t-3xl p-6 border-t`}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View className={`w-12 h-1 ${isDark ? 'bg-borderDark' : 'bg-borderLight'} rounded-full self-center mb-6`} />
              <Text className={`text-xl font-semibold mb-4 ${isDark ? 'text-textDark' : 'text-textLight'}`}>
                Add New Account
              </Text>
              
              <View className="mb-4">
                <Text className={`text-sm mb-2 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  Account Name
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 ${isDark ? 'bg-inputDark border-borderDark text-textDark' : 'bg-backgroundMuted border-borderLight text-textLight'} border rounded-xl`}
                  placeholder="e.g., Emergency Fund"
                  placeholderTextColor={isDark ? "#AAAAAA" : "#888888"}
                  value={newAccountName}
                  onChangeText={setNewAccountName}
                />
              </View>

              <View className="mb-4">
                <Text className={`text-sm mb-2 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  Account Type
                </Text>
                <View className={`w-full px-4 py-3 ${isDark ? 'bg-inputDark border-borderDark' : 'bg-backgroundMuted border-borderLight'} border rounded-xl`}>
                  <Text className={isDark ? 'text-textDark' : 'text-textLight'}>
                    {newAccountType.charAt(0).toUpperCase() + newAccountType.slice(1)}
                  </Text>
                </View>
              </View>

              <View className="mb-4">
                <Text className={`text-sm mb-2 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  Balance
                </Text>
                <TextInput
                  className={`w-full px-4 py-3 ${isDark ? 'bg-inputDark border-borderDark text-textDark' : 'bg-backgroundMuted border-borderLight text-textLight'} border rounded-xl`}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? "#AAAAAA" : "#888888"}
                  keyboardType="decimal-pad"
                  value={newAccountBalance}
                  onChangeText={setNewAccountBalance}
                />
              </View>

              <TouchableOpacity 
                className="w-full bg-accentBlue py-4 rounded-xl items-center active:opacity-80"
                onPress={handleAddAccount}
              >
                <Text className="text-textDark text-base font-semibold">Add Account</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </TouchableOpacity>
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
                  // This 'updatedData' comes from your new EditAccountPage
                  await handleSaveEdit(updatedData);
                }}
              />
            )}
          </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}