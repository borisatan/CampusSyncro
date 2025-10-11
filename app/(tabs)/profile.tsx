import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteAccount, fetchAccounts, updateAccountBalance, updateAccountName } from '../services/backendService';
import { Account } from '../types/types';

import { Ionicons } from '@expo/vector-icons';
import AccountCard from '../components/ProfilePage/AccountCard';
import AddMoneyModal from '../components/ProfilePage/AddMoneyModal';
import EditAccountModal from '../components/ProfilePage/EditAccountModal';
import { useTheme } from '../context/ThemeContext';

const Profile: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [addAmount, setAddAmount] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const data: Account[] = await fetchAccounts();
        setAccounts(data);
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      }
    };
    loadAccounts();
  }, []);

  const handleCardPress = (account: Account) => {
    if (isEditMode) {
      setSelectedAccount(account);
      setEditName(account.account_name);
      setEditBalance(account.balance.toString());
      setModalVisible(true);
    }
  };

  const handleAddPress = (account: Account) => {
    setSelectedAccount(account);
    setAddAmount('');
    setAddModalVisible(true);
  };

  const handleSave = () => {
    if (!selectedAccount) return;
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === selectedAccount.id
          ? { ...acc, account_name: editName, balance: parseFloat(editBalance) || 0 }
          : acc
      )
    );
    if (selectedAccount.account_name !== editName) updateAccountName(selectedAccount.account_name, editName);
    updateAccountBalance(selectedAccount.account_name, selectedAccount.balance);
    setModalVisible(false);
    setSelectedAccount(null);
  };

  const handleAddMoney = () => {
    if (!selectedAccount) return;
    const amount = parseFloat(addAmount) || 0;
    setAccounts(prev =>
      prev.map(acc =>
        acc.id === selectedAccount.id
          ? { ...acc, balance: acc.balance + amount }
          : acc
      )
    );
    updateAccountBalance(selectedAccount.account_name, selectedAccount.balance + amount);
    setAddModalVisible(false);
    setSelectedAccount(null);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setAddModalVisible(false);
    setSelectedAccount(null);
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
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
            } catch (err) {
              console.error('Failed to delete account:', err);
            }
          },
        },
      ]
    );
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(balance);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
      <View className="relative py-3">
        <Text className="text-3xl font-bold text-textLight dark:text-textDark text-center">Accounts</Text>
        <TouchableOpacity
          onPress={toggleEditMode}
          
          className={`absolute right-4 top-7 -translate-y-1/2 px-6 py-1 rounded-lg bg-accentTeal items-center`}
        >
          <Text className={`text-base font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {accounts.map(account => (
          <View key={account.id} className="relative mb-3">
            <AccountCard
              account={account}
              onPress={() => handleCardPress(account)}
              onAddPress={() => handleAddPress(account)}
              formatBalance={formatBalance}
            />
            {isEditMode && (
              <TouchableOpacity
                onPress={() => handleDeleteAccount(account.id)}
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-accentRed justify-center items-center"
              >
                <Ionicons name="remove" size={16} color="white" />

              </TouchableOpacity>
            )}
          </View>
        ))}

        {isEditMode && (
          <TouchableOpacity

            className="bg-backgroundMuted dark:bg-white p-5 mb-3 rounded-xl shadow-sm flex-row justify-between items-center"
            onPress={() => console.log('Add new account')}
          >
            <Text className={`text-lg font-semibold ${isDark ? 'text-textLight' : 'text-textDark'} mb-1`}>Add Account</Text>
            
          </TouchableOpacity>
        )}
      </ScrollView>

      <EditAccountModal
        visible={modalVisible}
        name={editName}
        balance={editBalance}
        onChangeName={setEditName}
        onChangeBalance={setEditBalance}
        onCancel={handleCancel}
        onSave={handleSave}
      />

      <AddMoneyModal
        visible={addModalVisible}
        accountName={selectedAccount?.account_name}
        amount={addAmount}
        onChangeAmount={setAddAmount}
        onCancel={handleCancel}
        onAdd={handleAddMoney}
      />
    </SafeAreaView>
  );
};

export default Profile;
