import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchAccounts } from '../services/backendService';
import { Account } from '../types/types';

const Profile: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editBalance, setEditBalance] = useState<string>('');

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

  const handleSave = () => {
    if (!selectedAccount) return;

    setAccounts(prev =>
      prev.map(acc =>
        acc.id === selectedAccount.id
          ? { ...acc, account_name: editName, balance: parseFloat(editBalance) || 0 }
          : acc
      )
    );
    setModalVisible(false);
    setSelectedAccount(null);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setSelectedAccount(null);
  };

  const formatBalance = (balance: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(balance);
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
      <View className="mb-4 mt-4 justify-center items-center">
        <Text className="text-3xl font-bold text-textLight dark:text-textDark">
          Accounts
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {accounts.map((account) => (
          <TouchableOpacity
            key={account.id}
            className={`${isDark ? 'bg-surfaceDark' : 'bg-background'} rounded-xl p-5 mb-3 shadow-sm items-center`}
            onPress={() => handleCardPress(account)}
            activeOpacity={0.7}
          >
            <View className="mb-2">
              <Text className={`text-lg font-semibold ${isDark ? 'text-textDark' : 'text-textLight'} mb-2`}>
                {account.account_name}
              </Text>
              <Text className={`text-2xl font-bold ${account.balance < 0 ? 'text-accentRed' : 'text-accentTeal'}`}>
                {formatBalance(account.balance)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* --- Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1  justify-center items-center p-4">
              <View className={`${isDark ? 'bg-surfaceDark' : 'bg-background'} rounded-2xl p-6 w-[85%] max-w-[400px]`}>
                <Text className={`text-xl font-bold ${isDark ? 'text-textDark' : 'text-textLight'} mb-6`}>
                  Edit Account
                </Text>

                <View className="mb-5">
                  <Text className={`text-sm font-semibold ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'} mb-2`}>
                    Account Name
                  </Text>
                  <TextInput
                    className={`border ${isDark ? 'border-borderDark bg-inputDark text-textDark' : 'border-borderLight bg-backgroundMuted text-textLight'} rounded-lg p-3 text-base`}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Enter account name"
                    placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
                  />
                </View>

                <View className="mb-5">
                  <Text className={`text-sm font-semibold ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'} mb-2`}>
                    Balance
                  </Text>
                  <TextInput
                    className={`border ${isDark ? 'border-borderDark bg-inputDark text-textDark' : 'border-borderLight bg-backgroundMuted text-textLight'} rounded-lg p-3 text-base`}
                    value={editBalance}
                    onChangeText={setEditBalance}
                    placeholder="Enter balance"
                    keyboardType="numeric"
                    placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
                  />
                </View>

                <View className="flex-row justify-between mt-2">
                  <TouchableOpacity
                    className={`flex-1 ${isDark ? 'bg-inputDark' : 'bg-backgroundMuted'} p-3.5 rounded-lg items-center mr-2`}
                    onPress={handleCancel}
                  >
                    <Text className={`text-base font-semibold ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-1 bg-accentTeal p-3.5 rounded-lg items-center ml-2"
                    onPress={handleSave}
                  >
                    <Text className="text-base font-semibold text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default Profile;
