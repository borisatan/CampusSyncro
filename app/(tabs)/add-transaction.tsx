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
  Modal,
  Platform,
  Switch
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, Calendar } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fetchAccounts, fetchCategories, updateAccountBalance, createTransaction } from '../services/backendService';
import { Account, AccountOption, Category } from "../types/types";
import { supabase } from "../utils/supabase";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const { userId, isLoading } = useAuth();
  const router = useRouter();
  
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [selectedAccount, setSelectedAccount] = useState('Main Checking');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountOptions, setAccountOptions] = useState<Account[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoadingCategories(true);
      setIsLoadingAccounts(true);
      const [catData, accData] = await Promise.all([fetchCategories(), fetchAccounts()]);
      
      setCategories(catData);
      setAccountOptions(accData);

      if (catData.length > 0) setSelectedCategory(catData[0]);
      if (accData.length > 0) setSelectedAccount(accData[0].account_name);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoadingCategories(false);
      setIsLoadingAccounts(false);
    }
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };


  const handleSubmit = async () => {
    if (!amount || !userId) return;

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;

    try {
      await createTransaction({
        amount: transactionType === 'expense' ? -numericAmount : numericAmount,
        description: description,
        account_name: selectedAccount,
        category_name: transactionType === 'expense' ? selectedCategory?.category_name : 'Income',
        user_id: userId,
        created_at: selectedDate.toISOString() 
      });

      const currentAccount = accountOptions.find(acc => acc.account_name === selectedAccount);
      if (currentAccount) {
        const newBalance = transactionType === 'expense' 
          ? currentAccount.balance - numericAmount 
          : currentAccount.balance + numericAmount;
        
        await updateAccountBalance(selectedAccount, newBalance);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setAmount('');
        setDescription('');
        setSelectedDate(new Date());
        refreshData(); 
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      Alert.alert('Error', 'Failed to add transaction. Check your connection.');
    }
  };

  return (
      <SafeAreaView className={isDarkMode ? "flex-1 bg-slate-950" : "flex-1 bg-gray-50"}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 80 }}
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
                  ? isDarkMode ? 'bg-accentRed' : 'bg-white'
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
                  ? isDarkMode ? 'bg-accentTeal' : 'bg-white'
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
                €
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
              <View className="flex-row justify-between items-center mb-3">
                <Text className={`text-sm mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Category
                </Text>
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity 
                  onPress={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-1 rounded-xl border ${
                    isEditMode 
                      ? 'bg-accentBlue border-surfaceDark' 
                      : isDarkMode ? 'bg-backgroundDark border-slate-800' : 'bg-white border-gray-200'
                  }`}
                >
                  <Text className={`text-sm  ${
                    isEditMode 
                      ? 'text-white' 
                      : isDarkMode ? 'text-textDark' : 'text-textLight'
                  }`}>
                    {isEditMode ? 'Done Editing' : 'Edit Categories'}
                  </Text>
                </TouchableOpacity>
                </View>
              </View>
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
              {/* Existing Categories */}
              {categories.map((category) => (
                <View key={category.id} className="w-1/3 px-1.5 mb-3 bg-backgroundDark">
                  <TouchableOpacity
                    onPress={() => {
                      if (isEditMode) {
                        router.navigate({
                          pathname: '/components/AddTransactionPage/edit-category',
                          params: { 
                            id: category.id,
                            name: category.category_name,
                            icon: category.icon,
                            color: category.color
                          }
                        });
                      } else {
                        setSelectedCategory(category);
                      }
                    }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                      isEditMode 
                        ? isDarkMode ? 'bg-slate-700/50 border-slate-500' : 'bg-gray-100 border-gray-400'
                        : selectedCategory?.id === category.id
                          ? isDarkMode ? 'border-indigo-400 bg-slate-800' : 'border-blue-500 bg-blue-50'
                          : isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'
                    }`}
                  >
                    <View
                      className="w-12 h-12 rounded-xl items-center justify-center "
                      style={{ backgroundColor: category.color }}>
                      <Ionicons name={category.icon as any} size={24} color="#fff"/>
                      {isEditMode && (
                        <View className="absolute -top-1 -right-1 bg-white rounded-full border border-white">
                          <Ionicons name="pencil" size={10} color="#000" />
                        </View>
                      )}
                    </View>
                    <Text className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {category.category_name}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}

              {/* NEW: Add Category Button (Edit Mode Only) */}
              {isEditMode && (
                <View className="w-1/3 px-1.5 mb-3">
                  <TouchableOpacity
                    onPress={() => router.navigate('/components/AddTransactionPage/edit-category')}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                      isDarkMode ? 'bg-slate-700/50 border-slate-500' : 'bg-gray-100 border-gray-400'
                    }`}
                  >
                    <View className="w-12 h-12 rounded-xl items-center justify-center bg-white border border-gray-300">
                      <Ionicons name="add-outline" size={24} color="#6366f1" />
                    </View>
                    <Text className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Add New
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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

          {/* Account Section */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              Account
            </Text>
            
            <TouchableOpacity
              onPress={() => setShowAccountDropdown(!showAccountDropdown)}
              activeOpacity={0.7}
              className={`w-full px-4 py-3 rounded-xl flex-row justify-between items-center border ${
                isDarkMode 
                  ? 'bg-surfaceDark border-borderDark' 
                  : 'bg-background border-borderLight'
              }`}
            >
              <Text className={isDarkMode ? 'text-textDark' : 'text-textLight'}>
                {isLoadingAccounts ? 'Loading accounts...' : selectedAccount}
              </Text>
              <Ionicons 
                name={showAccountDropdown ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={isDarkMode ? "#9CA3AF" : "#4B5563"} 
              />
            </TouchableOpacity>

            {showAccountDropdown && (
              <View 
                className={`mt-2 rounded-xl overflow-hidden border ${
                  isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
                }`}
              >
                <ScrollView 
                  className="max-h-60" 
                  nestedScrollEnabled={true} 
                >
                  {accountOptions.map((account, index) => {
                    const isSelected = selectedAccount === account.account_name;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => {
                          setSelectedAccount(account.account_name);
                          setShowAccountDropdown(false);
                        }}
                        className={`px-4 py-4 flex-row items-center justify-between ${
                          index !== accountOptions.length - 1 
                            ? isDarkMode ? 'border-b border-borderDark' : 'border-b border-borderLight' 
                            : ''
                        } ${
                          isSelected
                            ? isDarkMode ? 'bg-backgroundDark' : 'bg-backgroundMuted'
                            : ''
                        }`}
                      >
                        <View>
                          <Text className={`font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                            {account.account_name}
                          </Text>
                          <Text className={`text-xs ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                            €{account.balance.toFixed(2)}
                          </Text>
                        </View>
                        
                        {isSelected && (
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={isDarkMode ? "#B2A4FF" : "#2563EB"} 
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Date Picker */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Date
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`w-full px-4 py-3 rounded-xl flex-row items-center justify-between ${
                isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
              } border`}
            >
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                {selectedDate.toLocaleDateString()}
              </Text>
              <Calendar 
                size={20} 
                color={isDarkMode ? '#94a3b8' : '#6b7280'} 
              />
            </TouchableOpacity>

            {showDatePicker && (
              <>
                {Platform.OS === 'ios' ? (
                  <Modal
                    visible={showDatePicker}
                    transparent
                    animationType="slide"
                  >
                    <TouchableOpacity 
                      activeOpacity={1}
                      onPress={() => setShowDatePicker(false)}
                      className="flex-1 bg-black/50 justify-end"
                    >
                      <View 
                        className={`${
                          isDarkMode ? 'bg-slate-900' : 'bg-white'
                        } rounded-t-3xl`}
                        onStartShouldSetResponder={() => true}
                      >
                        <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text className="text-blue-500">Cancel</Text>
                          </TouchableOpacity>
                          <Text className={`font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            Select Date
                          </Text>
                          <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text className="text-blue-500 font-semibold">Done</Text>
                          </TouchableOpacity>
                        </View>
                        <DateTimePicker
                          value={selectedDate}
                          mode="date"
                          display="spinner"
                          onChange={handleDateChange}
                          maximumDate={new Date()}
                          textColor={isDarkMode ? '#ffffff' : '#000000'}
                        />
                      </View>
                    </TouchableOpacity>
                  </Modal>
                ) : (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    themeVariant='dark'
                    display="default"
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </>
            )}
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
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <Check color="#34d399" size={32} />
              </div>
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Transaction Added!
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
  );
};

export default TransactionAdder;