import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountSelector } from '../components/AddTransactionPage/AccountSelector';
import { CategoryGrid } from '../components/AddTransactionPage/CategoryGrid';
import { TransactionFormFields } from '../components/AddTransactionPage/TransactionFormFields';
import { TransactionHero } from '../components/AddTransactionPage/TransactionHero';
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
  const { refreshAll, optimisticDeleteTransaction, optimisticUpdateTransaction } = useDataRefresh();


  // Use global stores
  const categories = useCategoriesStore((state) => state.categories);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const expenseAccountOptions = accountOptions.filter(acc => acc.type !== 'investment');
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

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

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

  // Auto-select first category when switching from income to expense
  useEffect(() => {
    if (transactionType === 'expense' && !selectedCategory && categories.length > 0) {
      setSelectedCategory(categories[0]);
    }
  }, [transactionType, categories]);

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

      // Optimistic UI: Update transaction list immediately
      optimisticUpdateTransaction({
        ...transaction,
        amount: finalAmount,
        description,
        account_name: selectedAccount,
        category_name: categoryName || transaction.category_name,
        created_at: selectedDate.toISOString(),
      });

      setShowSuccess(true);

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
            // Optimistic UI: Update balance and transaction list immediately
            const acc = accountOptions.find(a => a.account_name === transaction.account_name);
            if (acc) {
              updateAccountBalanceStore(transaction.account_name, acc.balance - transaction.amount);
            }
            optimisticDeleteTransaction(transaction.id);

            router.replace('/transaction-list');

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
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

        {/* Header with Back and Delete */}
        <View className="flex-row items-center justify-between px-4 mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={() => router.replace('/transaction-list')}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className={`text-2xl font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                Edit Transaction
              </Text>
              <Text className="text-secondaryDark">Update transaction details</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Trash2 color="#ef4444" size={24} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
            className="flex-1"
            keyboardShouldPersistTaps="handled"
          >
            <TransactionHero
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            amount={amount}
            setAmount={setAmount}
            isDarkMode={isDarkMode}
            amountInputRef={amountInputRef}
            showHeader={false}
          />

          {/* Description */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate300' : 'text-secondaryLight'}`}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Grocery shopping"
              placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDarkMode ? 'bg-slate700 border-slate600 text-textDark' : 'bg-background border-borderLight text-textLight'
              }`}
            />
          </View>

          {transactionType === 'expense' && (
            <CategoryGrid
              categories={categories}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              isDarkMode={isDarkMode}
              isLoadingCategories={false}
              isEditMode={isEditMode}
              setIsEditMode={setIsEditMode}
            />
          )}

          <AccountSelector
            isDarkMode={isDarkMode}
            showAccountDropdown={showAccountDropdown}
            setShowAccountDropdown={setShowAccountDropdown}
            isLoadingAccounts={false}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            accountOptions={accountOptions}
            expenseAccountOptions={expenseAccountOptions}
            transactionType={transactionType}
          />

          <TransactionFormFields
            isDarkMode={isDarkMode}
            description={description}
            setDescription={setDescription}
            selectedDate={selectedDate}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            handleDateChange={handleDateChange}
            handleSubmit={handleSave}
            transactionType={transactionType}
            buttonText={isSaving ? "Saving..." : `Update ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
            isSubmitting={isSaving}
          />

            <SuccessModal
              visible={showSuccess}
              text="Transaction Updated!"
              onDismiss={() => {
                setShowSuccess(false);
                router.replace('/transaction-list');
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
};

export default EditTransactionScreen;
