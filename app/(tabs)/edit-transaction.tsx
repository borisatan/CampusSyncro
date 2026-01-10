import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, ChevronLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useState } from "react";
import {
    Alert,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SuccessModal } from "../components/Shared/SuccessModal";
import { useAuth } from "../context/AuthContext";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import {
    deleteTransaction,
    updateAccountBalance,
    updateTransaction
} from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { Category, Transaction } from "../types/types";

const EditTransactionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Parse the transaction from params
  const transaction: Transaction | null = params.transaction 
    ? JSON.parse(params.transaction as string) 
    : null;

  const { isDarkMode } = useTheme();
  const { userId } = useAuth();
  const { refreshAll } = useDataRefresh();
  const { currencySymbol } = useCurrencyStore();

  
  // Use global stores
  const categories = useCategoriesStore((state) => state.categories);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const updateAccountBalanceStore = useAccountsStore((state) => state.updateAccountBalance);
  
  // State initialized with transaction data
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>(
    transaction?.amount && transaction.amount < 0 ? 'expense' : 'income'
  );
  const [description, setDescription] = useState(transaction?.description || "");
  const [selectedAccount, setSelectedAccount] = useState(transaction?.account_name || "");
  const [amount, setAmount] = useState(transaction ? Math.abs(transaction.amount).toString() : "");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState(transaction ? new Date(transaction.created_at) : new Date());
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync transaction data when it changes or categories load
  useEffect(() => {
    if (transaction) {
      setAmount(Math.abs(transaction.amount).toString());
      setDescription(transaction.description || "");
      setSelectedAccount(transaction.account_name || "");
      setSelectedDate(new Date(transaction.created_at));
      setTransactionType(transaction.amount < 0 ? 'expense' : 'income');
      
      // Find the matching category
      if (categories.length > 0) {
        const match = categories.find(c => c.category_name === transaction.category_name);
        if (match) setSelectedCategory(match);
      }
    }
  }, [params.transaction, categories]);

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refreshAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!transaction || !amount || !userId) return;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;
  
    try {
      setIsSaving(true);
      const finalAmount = transactionType === 'expense' ? -numericAmount : numericAmount;
      const categoryName = transactionType === 'expense' ? selectedCategory?.category_name : 'Income';
  
      // Optimistic UI: Update balance immediately
      if (selectedAccount === transaction.account_name) {
        const diff = finalAmount - transaction.amount;
        const acc = accountOptions.find(a => a.account_name === selectedAccount);
        if (acc) {
          updateAccountBalanceStore(selectedAccount, acc.balance + diff);
        }
      } else {
        const oldAcc = accountOptions.find(a => a.account_name === transaction.account_name);
        if (oldAcc) {
          updateAccountBalanceStore(transaction.account_name, oldAcc.balance - transaction.amount);
        }
        const newAcc = accountOptions.find(a => a.account_name === selectedAccount);
        if (newAcc) {
          updateAccountBalanceStore(selectedAccount, newAcc.balance + finalAmount);
        }
      }
      
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 1900);
  
      // Make API calls in background
      await updateTransaction(transaction.id, finalAmount, description, selectedAccount, categoryName, selectedDate.toISOString());
  
      if (selectedAccount === transaction.account_name) {
        const diff = finalAmount - transaction.amount;
        const acc = accountOptions.find(a => a.account_name === selectedAccount);
        if (acc) await updateAccountBalance(selectedAccount, acc.balance + diff);
      } else {
        const oldAcc = accountOptions.find(a => a.account_name === transaction.account_name);
        if (oldAcc) await updateAccountBalance(transaction.account_name, oldAcc.balance - transaction.amount);
        
        const newAcc = accountOptions.find(a => a.account_name === selectedAccount);
        if (newAcc) await updateAccountBalance(selectedAccount, newAcc.balance + finalAmount);
      }

      await refreshAll();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update");
      await refreshAll(); // Reload to revert optimistic update
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!transaction) return;
    Alert.alert("Delete", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          try {
            // Optimistic UI: Update balance immediately
            const acc = accountOptions.find(a => a.account_name === transaction.account_name);
            if (acc) {
              updateAccountBalanceStore(transaction.account_name, acc.balance - transaction.amount);
            }
            
            router.back();
            
            // Make API calls in background
            await deleteTransaction(transaction.id, userId);
            
            if (acc) {
              await updateAccountBalance(transaction.account_name, acc.balance - transaction.amount);
            }
            
            await refreshAll();
          } catch (err) {
            Alert.alert("Error", "Could not delete");
            await refreshAll(); // Reload to revert optimistic update
          }
        } 
      }
    ]);
  };

  if (!transaction) return null;

  return (
    <SafeAreaProvider>
      <SafeAreaView className={isDarkMode ? "flex-1 bg-slate-950" : "flex-1 bg-gray-50"}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* Header - From Edit Design */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ChevronLeft color={isDarkMode ? "#fff" : "#000"} size={28} />
          </TouchableOpacity>
          <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            Edit Transaction
          </Text>
          <TouchableOpacity onPress={handleDelete} className="p-2 -mr-2">
            <Trash2 color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 80 }}
          className="flex-1 px-6"
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />}
        >
          {/* Transaction Type Toggle - Copied Design */}
          <View className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-200'} rounded-2xl p-1 flex-row mb-6 mt-4`}>
            <TouchableOpacity
              onPress={() => setTransactionType('expense')}
              className={`flex-1 py-3 rounded-xl ${transactionType === 'expense' ? (isDarkMode ? 'bg-rose-500' : 'bg-white') : ''}`}
            >
              <Text className={`text-center font-medium ${transactionType === 'expense' ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-slate-400' : 'text-gray-600')}`}>
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTransactionType('income')}
              className={`flex-1 py-3 rounded-xl ${transactionType === 'income' ? (isDarkMode ? 'bg-emerald-500' : 'bg-white') : ''}`}
            >
              <Text className={`text-center font-medium ${transactionType === 'income' ? (isDarkMode ? 'text-white' : 'text-gray-900') : (isDarkMode ? 'text-slate-400' : 'text-gray-600')}`}>
                Income
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount - Copied Design */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Amount</Text>
            <View className="relative">
              <Text className={`absolute left-4 top-4 text-2xl z-10 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>{currencySymbol}</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
                className={`w-full pl-10 pr-4 py-4 rounded-xl text-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </View>
          </View>

          {/* Category Grid - Copied Design */}
          {transactionType === 'expense' && (
            <View className="mb-6">
              <Text className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Category</Text>
              <View className="flex-row flex-wrap -mx-1.5">
                {categories.filter(cat => cat.category_name !== 'Income').map((category) => (
                  <View key={category.id} className="w-1/3 px-1.5 mb-3">
                    <TouchableOpacity
                      onPress={() => setSelectedCategory(category)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${
                        selectedCategory?.id === category.id
                          ? isDarkMode ? 'border-indigo-400 bg-slate-800' : 'border-blue-500 bg-blue-50'
                          : isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      <View className="w-12 h-12 rounded-xl items-center justify-center" style={{ backgroundColor: category.color }}>
                        <Ionicons name={category.icon as any} size={24} color="#fff"/>
                      </View>
                      <Text className={`text-xs text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`} numberOfLines={1}>
                        {category.category_name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Description - Copied Design */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What was this for?"
              placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
              className={`w-full px-4 py-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </View>

          {/* Account Dropdown - Copied Design */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Account</Text>
            <TouchableOpacity
              onPress={() => setShowAccountDropdown(!showAccountDropdown)}
              className={`w-full px-4 py-3 rounded-xl flex-row justify-between items-center border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}
            >
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedAccount}</Text>
              <Ionicons name={showAccountDropdown ? "chevron-up" : "chevron-down"} size={20} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
            </TouchableOpacity>

            {showAccountDropdown && (
              <View className={`mt-2 rounded-xl overflow-hidden border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                {accountOptions.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() => {
                      setSelectedAccount(account.account_name);
                      setShowAccountDropdown(false);
                    }}
                    className={`px-4 py-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-100'}`}
                  >
                    <Text className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{account.account_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Date Picker - Copied Design */}
          <View className="mb-8">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Date</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              className={`w-full px-4 py-3 rounded-xl flex-row items-center justify-between border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'}`}
            >
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDate.toLocaleDateString()}</Text>
              <Calendar size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}
          </View>

          {/* Action Button - Copied Design */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-xl items-center bg-accentTeal border border-borderDark`}
          >
            <Text className="text-white font-bold text-lg">
              {isSaving ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <SuccessModal visible={showSuccess} text="Transaction Updated!" />

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default EditTransactionScreen;