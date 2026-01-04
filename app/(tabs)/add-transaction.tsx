import { useRouter } from 'expo-router';
import { Check } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountSelector } from '../components/AddTransactionPage/AccountSelector';
import { CategoryGrid } from '../components/AddTransactionPage/CategoryGrid';
import { TransactionFormFields } from '../components/AddTransactionPage/TransactionFormFields';
import { TransactionHero } from '../components/AddTransactionPage/TransactionHero';
import { useAuth } from '../context/AuthContext';
import { useDataRefresh } from '../context/DataRefreshContext';
import { useTheme } from '../context/ThemeContext';
import { createTransaction, fetchAccounts, fetchCategories, updateAccountBalance } from '../services/backendService';
import { Account, Category } from "../types/types";

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const { userId, isLoading } = useAuth();
  const router = useRouter();
  const { refreshAll } = useDataRefresh();
  
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
    // 1. Basic validation
    if (!amount || !userId) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
  
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
  
    // 2. Category logic check
    // If it's an expense, we MUST have a category selected.
    if (transactionType === 'expense' && !selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
  
    try {
      // IMPORTANT: Ensure 'Income' exists in your DB categories table if your backend requires it.
      const categoryName = transactionType === 'expense' 
        ? selectedCategory?.category_name 
        : 'Income';
  
      await createTransaction({
        amount: transactionType === 'expense' ? -numericAmount : numericAmount,
        description: description,
        account_name: selectedAccount,
        category_name: categoryName,
        user_id: userId,
        created_at: selectedDate.toISOString() 
      });
  
      // 3. Update Balance locally
      const currentAccount = accountOptions.find(acc => acc.account_name === selectedAccount);
      if (currentAccount) {
        const newBalance = transactionType === 'expense' 
          ? currentAccount.balance - numericAmount 
          : currentAccount.balance + numericAmount;
        
        await updateAccountBalance(selectedAccount, newBalance);
      }
  
      // 4. Refresh all related screens (dashboard, accounts, transaction-list)
      await refreshAll();

      // 5. Success handling
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
      Alert.alert('Error', 'Failed to add transaction. Check your database constraints.');
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
          <TransactionHero
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            amount={amount}
            setAmount={setAmount}
            isDarkMode={isDarkMode}
            amountInputRef={amountInputRef}
          />

          {transactionType === 'expense' && (
          <CategoryGrid 
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            isDarkMode={isDarkMode}
            isLoadingCategories={isLoadingCategories}
            isEditMode={isEditMode}
            setIsEditMode={setIsEditMode}
          />
        )}

      <AccountSelector 
        isDarkMode={isDarkMode}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        isLoadingAccounts={isLoadingAccounts}
        selectedAccount={selectedAccount}
        setSelectedAccount={setSelectedAccount}
        accountOptions={accountOptions}
      />

      <TransactionFormFields 
        isDarkMode={isDarkMode}
        description={description}
        setDescription={setDescription}
        selectedDate={selectedDate}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        handleDateChange={handleDateChange}
        handleSubmit={handleSubmit}
        transactionType={transactionType}
      />

        {/* Success Modal */}
        <Modal visible={showSuccess} transparent animationType="fade">
          <View className="flex-1 items-center justify-center bg-black/50">
            <View className={`${isDarkMode ? 'bg-backgroundDark' : 'bg-white border-gray-200'} border rounded-2xl p-6 flex flex-col items-center gap-3`}>
              
              <View className="w-16 h-16 bg-accentTeal rounded-full flex items-center justify-center">
                <Check color="#34d399" size={32} />
              </View>
              
              <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>
                Transaction Added!
              </Text>
            </View>
          </View>
        </Modal>
        </ScrollView>
      </SafeAreaView>
  );
};

export default TransactionAdder;