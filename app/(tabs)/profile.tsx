import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAccounts, updateAccountBalance, updateAccountName } from '../services/backendService';
import { Account } from '../types/types';

import AccountCard from '../components/ProfilePage/AccountCard';
import AddMoneyModal from '../components/ProfilePage/AddMoneyModal';
import EditAccountModal from '../components/ProfilePage/EditAccountModal';

const Profile: React.FC = () => {
  const isDark = useColorScheme() === 'dark';
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [addAmount, setAddAmount] = useState('');

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
    setSelectedAccount(account);
    setEditName(account.account_name);
    setEditBalance(account.balance.toString());
    setModalVisible(true);
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

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(balance);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
      <View className="mb-4 mt-4 justify-center items-center">
        <Text className="text-3xl font-bold text-textLight dark:text-textDark">Accounts</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {accounts.map(account => (
          <AccountCard
            key={account.id}
            account={account}
            onPress={handleCardPress}
            onAddPress={handleAddPress}
            formatBalance={formatBalance}
          />
        ))}
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
