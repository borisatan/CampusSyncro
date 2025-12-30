import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  Modal
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Check, ShoppingCart, Coffee, Car, Home, Zap, Gift, Heart, MoreHorizontal } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteCategory, fetchAccountOptions, fetchCategories, updateAccountBalance } from '../services/backendService';
import { AccountOption, Category } from "../types/types";
import { supabase } from "../utils/supabase";
import { Ionicons } from '@expo/vector-icons';

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const { userId, isLoading } = useAuth();
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [selectedAccount, setSelectedAccount] = useState('Main Checking');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await fetchCategories();
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategory(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        setIsLoadingCategories(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setIsLoadingAccounts(true);
        const data = await fetchAccountOptions();
        setAccountOptions(data);
        if (data.length > 0) {
          setSelectedAccount(data[0].account_name);
        }
      } catch (err) {
        console.error('Failed to fetch accounts:', err);
      } finally {
        setIsLoadingAccounts(false);
      }
    };
    loadAccounts();
  }, []);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const [categoriesData, accountsData] = await Promise.all([
        fetchCategories(),
        fetchAccountOptions()
      ]);
      setCategories(categoriesData);
      setAccountOptions(accountsData);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!amount) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('Transactions')
        .insert([{
          amount: transactionType === 'expense' ? -numericAmount : numericAmount,
          description: description,
          account_name: selectedAccount,
          category_name: selectedCategory?.category_name,
          user_id: userId
        }]);

      if (transactionError) throw transactionError;

      const { data: accountData, error: accountFetchError } = await supabase
        .from('Accounts')
        .select('balance')
        .eq('account_name', selectedAccount)
        .single();

      if (accountFetchError) throw accountFetchError;
      if (!accountData) throw new Error('Account not found');

      const newBalance = transactionType === 'expense' 
        ? accountData.balance - numericAmount 
        : accountData.balance + numericAmount;

      await updateAccountBalance(selectedAccount, newBalance);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDescription('');
      }, 2000);

    } catch (err) {
      console.error('Error adding transaction or updating balance:', err);
      Alert.alert('Error', 'Failed to add transaction. Please try again.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className={isDarkMode ? "flex-1 bg-slate-950" : "flex-1 bg-gray-50"}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <ScrollView 
          className="flex-1 p-6"
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
          }
        >
          {/* Header */}
          <View className="mb-6">
            <Text className={isDarkMode ? "text-2xl text-white" : "text-2xl text-gray-900"}>
              Add Transaction
            </Text>
            <Text className={isDarkMode ? "text-slate-400" : "text-gray-600"}>
              Record your income or expense
            </Text>
          </View>

          {/* Transaction Type Toggle */}
          <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row mb-6`}>
            <TouchableOpacity
              onPress={() => setTransactionType('expense')}
              className={`flex-1 py-3 rounded-xl ${
                transactionType === 'expense'
                  ? isDarkMode ? 'bg-slate-900' : 'bg-white'
                  : ''
              }`}
            >
              <Text className={`text-center ${
                transactionType === 'expense' 
                  ? isDarkMode ? 'text-white' : 'text-gray-900'
                  : isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTransactionType('income')}
              className={`flex-1 py-3 rounded-xl ${
                transactionType === 'income'
                  ? isDarkMode ? 'bg-slate-900' : 'bg-white'
                  : ''
              }`}
            >
              <Text className={`text-center ${
                transactionType === 'income' 
                  ? isDarkMode ? 'text-white' : 'text-gray-900'
                  : isDarkMode ? 'text-slate-400' : 'text-gray-600'
              }`}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Amount
            </Text>
            <View className="relative">
              <Text className={`absolute left-4 top-4 text-2xl z-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                $
              </Text>
              <TextInput
                ref={amountInputRef}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
                className={`w-full pl-10 pr-4 py-4 rounded-xl text-2xl ${
                  isDarkMode 
                    ? 'bg-slate-800 border-slate-700 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border`}
              />
            </View>
          </View>

          {/* Category */}
          {transactionType === 'expense' && (
            <View className="mb-6">
              <Text className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Category
              </Text>
              {isLoadingCategories ? (
                <View className="flex items-center justify-center py-8">
                  <Text className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    Loading categories...
                  </Text>
                </View>
              ) : categories.length === 0 ? (
                <View className="flex items-center justify-center py-8">
                  <Text className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                    No categories found
                  </Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap -mx-1.5">
                    {categories.map((category) => (
                      <View key={category.id} className="w-1/3 px-1.5 mb-3">
                        <TouchableOpacity
                          onPress={() => setSelectedCategory(category)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                            selectedCategory?.id === category.id
                              ? isDarkMode 
                                ? 'border-accentPurple bg-surfaceDark'
                                : 'border-accentBlue bg-backgroundMuted'
                              : isDarkMode 
                                ? 'bg-surfaceDark border-borderDark'
                                : 'bg-background border-borderLight'
                          }`}
                        >
                          <View
                            className="w-12 h-12 rounded-xl items-center justify-center "
                            style={{ backgroundColor: category.color }}>
                            <Ionicons name={category.icon as any} size={24} color="#fff"/>
                          </View>
                          <Text 
                            className={`text-sm text-center ${
                              isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
                            }`} 
                            numberOfLines={2}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {category.category_name}
                          </Text>
                        </TouchableOpacity>
                      </View>
              ))}
                </View>
              )}
            </View>
          )}

          {/* Description */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Grocery shopping"
              placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
              className={`w-full px-4 py-3 rounded-xl ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } border`}
            />
          </View>

          {/* Account */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Account
            </Text>
            {isLoadingAccounts ? (
              <View className={`w-full px-4 py-3 rounded-xl ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
              } border`}>
                <Text className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Loading accounts...
                </Text>
              </View>
            ) : (
              <View className={`w-full px-4 py-3 rounded-xl ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
              } border`}>
                <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                  {selectedAccount}
                </Text>
              </View>
            )}
          </View>

          {/* Date */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Date
            </Text>
            <View className={`w-full px-4 py-3 rounded-xl ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
            } border`}>
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                {new Date().toLocaleDateString()}
              </Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            className={`w-full py-4 rounded-xl items-center mb-6 ${
              transactionType === 'expense'
                ? 'bg-rose-500'
                : 'bg-emerald-500'
            }`}
          >
            <Text className="text-white font-semibold">
              Add {transactionType === 'expense' ? 'Expense' : 'Income'}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        

        {/* Success Modal */}
        <Modal
          visible={showSuccess}
          transparent
          animationType="fade"
        >
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className={`${
              isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
            } border rounded-2xl p-6 flex flex-col items-center gap-3`}>
              <View className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check color="#34d399" size={32} />
              </View>
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Transaction Added!
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default TransactionAdder;