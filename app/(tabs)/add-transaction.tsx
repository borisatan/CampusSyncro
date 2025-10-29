import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CategoryGrid from '../components/AddTransactionPage/CategoryGrid';
import CategoryModalWrapper from '../components/AddTransactionPage/CategoryModalWrapper';
import Header from '../components/AddTransactionPage/Header';
import TransactionModal from '../components/AddTransactionPage/TransactionModal';
import LoadingSpinner from '../components/Shared/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { deleteCategory, fetchAccountOptions, fetchCategories, updateAccountBalance } from '../services/backendService';
import { AccountOption, Category } from "../types/types";
import { supabase } from "../utils/supabase";

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const [selectedAccount, setSelectedAccount] = useState('Postbank');
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const amountInputRef = useRef<TextInput>(null);
  
  const { userId, isLoading } = useAuth();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const data = await fetchCategories();
        setCategories(data);
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
  

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.category_name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(category.id, userId);
  
              // Update local state
              setCategories((prev) =>
                prev.filter((c) => c.id !== category.id)
              );
            } catch (err) {
              console.error('Failed to delete category:', err);
              Alert.alert('Error', 'Failed to delete category. Please try again.');
            }
          },
        },
      ]
    );
  };
  

  const handleConfirm = async () => {
    if (!amount) return;
  
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return;
  
    try {
      const { data: transactionData, error: transactionError } = await supabase
        .from('Transactions')
        .insert([{
          amount: numericAmount,
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
  
      const newBalance = accountData.balance - numericAmount;
  
      await updateAccountBalance(selectedAccount, newBalance);
  
      setInputModalVisible(false);
      setAmount('');
      setDescription('');
  
    } catch (err) {
      console.error('Error adding transaction or updating balance:', err);
      alert('Failed to add transaction. Please try again.');
    }
  };
  
  

  
  const handleEditCategory = (category: Category | null) => {
    if (isEditMode) {
      if (category === null) {
        // Add mode
        setEditingCategory(null);
        setShowCategoryModal(true);
      } else {
        // Edit existing category
        setEditingCategory(category);
        setShowCategoryModal(true);
      }
    } else if (category) {
      setSelectedCategory(category);
      setInputModalVisible(true);
    }
  };
  

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };



  return (
    <SafeAreaProvider>
      <SafeAreaView className={isDarkMode ? "flex-1 bg-backgroundDark" : "flex-1 bg-background"}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        <Header 
          isEditMode={isEditMode} 
          onToggleEditMode={toggleEditMode} 
          onBack={() => console.log('Back pressed')} 
        />

        {/* <AccountSelector
          accountOptions={accountOptions}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
        /> */}

        {/* Categories grid with loading state */}
        <ScrollView className="flex-1 px-4 pt-4"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshData} />
        }>
          {isLoadingCategories ? (
            <LoadingSpinner />
          ) : categories.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Text className={isDarkMode ? "text-white text-center" : "text-black text-center"}>
                No categories found. Add some categories to get started!
              </Text>
            </View>
          ) : (
            <CategoryGrid
              categories={categories}
              isEditMode={isEditMode}
              onEditCategory={handleEditCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}
        </ScrollView>

        <TransactionModal
          visible={inputModalVisible}
          onClose={() => setInputModalVisible(false)}
          category={selectedCategory}
          amount={amount}
          setAmount={setAmount}
          description={description}
          setDescription={setDescription}
          onConfirm={handleConfirm}
          accountOptions={accountOptions}
          selectedAccount={selectedAccount}
          onSelectAccount={setSelectedAccount}
        />

        <CategoryModalWrapper
          visible={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
          categories={categories}
          onSubmit={setCategories}
          editingCategory={editingCategory}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default TransactionAdder;