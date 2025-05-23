import { NavigationProp, RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
}

interface NewAccount {
  name: string;
  type: AccountType;
  balance: string;
}

type AccountType = 'Cash' | 'Checking' | 'Savings' | 'Credit Card' | 'Investment' | 'Other';

interface AddAccountsScreenProps {
  navigation: NavigationProp<RootStackParamList, 'AddAccounts'>;
  route: RouteProp<RootStackParamList, 'AddAccounts'>;
}

type RootStackParamList = {
  CategorySelection: undefined;
  SetBudget: {
    selectedCategories: string[];
    customCategories: string[];
  };
  AddAccounts: {
    selectedCategories: string[];
    customCategories: string[];
    monthlyBudget: number;
    usedHelpMeDecide: boolean;
    categoryBudgets?: { [key: string]: number };
  };
};

const AddAccountsScreen: React.FC<AddAccountsScreenProps> = ({ navigation, route }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newAccount, setNewAccount] = useState<NewAccount>({
    name: '',
    type: 'Checking',
    balance: '',
  });

  const { 
    selectedCategories = [], 
    customCategories = [], 
    monthlyBudget = 0, 
    usedHelpMeDecide = false,
    categoryBudgets = {}
  } = route?.params || {};

  const accountTypes: AccountType[] = [
    'Cash',
    'Checking',
    'Savings',
    'Credit Card',
    'Investment',
    'Other',
  ];

  const formatCurrency = (text: string): string => {
    // Remove all non-numeric characters except decimal point and minus sign
    const numericValue: string = text.replace(/[^\d.-]/g, '');
    
    // Handle negative sign only at the beginning
    let cleanValue: string = numericValue.replace(/-/g, '');
    if (numericValue.startsWith('-')) {
      cleanValue = '-' + cleanValue;
    }
    
    // Prevent multiple decimal points
    const parts: string[] = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      cleanValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    return cleanValue;
  };

  const handleAddAccount = (): void => {
    if (!newAccount.name.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }

    if (!newAccount.balance.trim()) {
      Alert.alert('Error', 'Please enter an account balance');
      return;
    }

    const balance: number = parseFloat(newAccount.balance);
    if (isNaN(balance)) {
      Alert.alert('Error', 'Please enter a valid balance');
      return;
    }

    const accountToAdd: Account = {
      id: Date.now().toString(),
      name: newAccount.name.trim(),
      type: newAccount.type,
      balance: balance,
    };

    setAccounts(prev => [...prev, accountToAdd]);
    setNewAccount({ name: '', type: 'Checking', balance: '' });
    setShowAddModal(false);
  };

  const handleDeleteAccount = (accountId: string): void => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to remove this account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => setAccounts(prev => prev.filter(acc => acc.id !== accountId))
        }
      ]
    );
  };

  const handleNext = (): void => {
    // Navigate to the next screen or complete setup
    const budgetSummary = Object.entries(categoryBudgets)
      .map(([category, amount]) => `${category}: $${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      .join('\n');

    Alert.alert(
      'Setup Complete!',
      `Budget setup completed with:\n\n` +
      `• ${selectedCategories?.length || 0} categories\n` +
      `• $${monthlyBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} monthly budget\n` +
      `• ${accounts.length} accounts\n\n` +
      `Category Allocations:\n${budgetSummary}`,
      [{ text: 'OK' }]
    );
  };

  const handleBack = (): void => {
    navigation.goBack();
  };

  const getTotalBalance = (): number => {
    return accounts.reduce((total: number, account: Account) => total + account.balance, 0);
  };

  const formatDisplayBalance = (balance: number): string => {
    return balance.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const updateNewAccountField = <K extends keyof NewAccount>(
    field: K,
    value: NewAccount[K]
  ): void => {
    setNewAccount(prev => ({ ...prev, [field]: value }));
  };

  const handleBalanceChange = (text: string): void => {
    const formattedText = formatCurrency(text);
    updateNewAccountField('balance', formattedText);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#282A36]">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-sm font-medium text-[#5F6368] dark:text-[#BBBBBB] mb-2">
          Step 3 of 3
        </Text>
        <Text className="text-2xl font-bold text-[#212121] dark:text-[#FFFFFF] mb-2">
          Add Your Accounts
        </Text>
        <Text className="text-base text-[#5F6368] dark:text-[#BBBBBB]">
          Add the accounts you use to manage your money
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {accounts.length > 0 && (
          <View className="mb-6">
            <View className="bg-[#E9C46A]/20 p-4 rounded-xl mb-4">
              <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-1">
                Total Balance
              </Text>
              <Text className="text-2xl font-bold text-[#212121] dark:text-[#FFFFFF]">
                ${formatDisplayBalance(getTotalBalance())}
              </Text>
            </View>
          </View>
        )}

        <View className="mb-6">
          {accounts.map((account: Account) => (
            <View
              key={account.id}
              className="bg-[#FFFFFF] dark:bg-[#1E1E1E] p-4 rounded-xl mb-3 border border-[#E0E0E0] dark:border-[#2C2C2C]"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-[#212121] dark:text-[#FFFFFF] mb-1">
                    {account.name}
                  </Text>
                  <Text className="text-sm text-[#5F6368] dark:text-[#BBBBBB] mb-2">
                    {account.type}
                  </Text>
                  <Text className={`text-xl font-bold ${
                    account.balance >= 0 
                      ? 'text-[#43A047] dark:text-[#66BB6A]' 
                      : 'text-[#E53935] dark:text-[#EF5350]'
                  }`}>
                    ${formatDisplayBalance(account.balance)}
                  </Text>
                </View>
                <TouchableOpacity
                  className="p-2"
                  onPress={() => handleDeleteAccount(account.id)}
                >
                  <Text className="text-[#E53935] dark:text-[#EF5350] text-lg">×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          className="flex-row items-center justify-center py-4 px-6 border-2 border-dashed border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl mb-6"
          onPress={() => setShowAddModal(true)}
        >
          <Text className="text-[#2A9D8F] font-semibold text-base">
            + Add Account
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <View className="px-6 pb-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2C2C2C]">
        <View className="flex-row gap-4">
          <TouchableOpacity
            className="flex-1 bg-[#E0E0E0] dark:bg-[#2C2C2C] py-4 rounded-xl"
            onPress={handleBack}
          >
            <Text className="text-[#212121] dark:text-[#FFFFFF] font-semibold text-base text-center">
              Back
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`flex-1 py-4 rounded-xl ${
              accounts.length > 0
                ? 'bg-[#2A9D8F]'
                : 'bg-[#E0E0E0] dark:bg-[#2C2C2C]'
            }`}
            onPress={handleNext}
            disabled={accounts.length === 0}
          >
            <Text
              className={`text-center font-semibold text-base ${
                accounts.length > 0
                  ? 'text-white'
                  : 'text-[#9E9E9E] dark:text-[#777777]'
              }`}
            >
              Complete Setup
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Add Account Modal */}
      
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <TouchableOpacity 
          className="flex-1 justify-end"
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowAddModal(false);
          }}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="w-full"
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <TouchableOpacity 
                activeOpacity={1} 
                onPress={(e) => e.stopPropagation()}
                className="bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-t-3xl p-6"
              >
                <View className="flex-row justify-between items-center mb-6">
                  <Text className="text-xl font-bold text-[#212121] dark:text-[#FFFFFF]">
                    Add Account
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAddModal(false)}
                    className="p-2"
                  >
                    <Text className="text-[#5F6368] dark:text-[#BBBBBB] text-xl">×</Text>
                  </TouchableOpacity>
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                    Account Name
                  </Text>
                  <TextInput
                    className="bg-[#FAFAFA] dark:bg-[#282A36] border border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl px-4 py-3 text-[#212121] dark:text-[#FFFFFF]"
                    placeholder="e.g., Bank of America"
                    placeholderTextColor="#9E9E9E"
                    value={newAccount.name}
                    onChangeText={(text: string) => updateNewAccountField('name', text)}
                    returnKeyType="done"
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                    Account Type
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                    <View className="flex-row gap-2">
                      {accountTypes.map((type: AccountType) => (
                        <TouchableOpacity
                          key={type}
                          className={`px-4 py-2 rounded-lg ${
                            newAccount.type === type
                              ? 'bg-[#2A9D8F]'
                              : 'bg-[#E0E0E0] dark:bg-[#2C2C2C]'
                          }`}
                          onPress={() => updateNewAccountField('type', type)}
                        >
                          <Text
                            className={`font-medium ${
                              newAccount.type === type
                                ? 'text-white'
                                : 'text-[#212121] dark:text-[#FFFFFF]'
                            }`}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
                    Current Balance
                  </Text>
                  <View className="relative">
                    <Text className="absolute left-4 top-3.5 text-[#212121] dark:text-[#FFFFFF] font-medium z-10">
                      $
                    </Text>
                    <TextInput
                      className="bg-[#FAFAFA] dark:bg-[#282A36] border border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl pl-8 pr-4 py-3 text-[#212121] dark:text-[#FFFFFF]"
                      placeholder="0.00"
                      placeholderTextColor="#9E9E9E"
                      value={newAccount.balance}
                      onChangeText={handleBalanceChange}
                      keyboardType="decimal-pad"
                      returnKeyType="done"
                    />
                  </View>
                  {/* <Text className="text-xs text-[#5F6368] dark:text-[#BBBBBB] mt-2">
                    Debts will be automatically added as negative values
                  </Text> */}
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-[#E0E0E0] dark:bg-[#2C2C2C] py-3 rounded-xl"
                    onPress={() => setShowAddModal(false)}
                  >
                    <Text className="text-[#212121] dark:text-[#FFFFFF] font-semibold text-center">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 bg-[#2A9D8F] py-3 rounded-xl"
                    onPress={handleAddAccount}
                  >
                    <Text className="text-white font-semibold text-center">
                      Add Account
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default AddAccountsScreen;