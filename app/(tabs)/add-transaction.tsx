import { useRouter } from "expo-router";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountSelector } from "../components/AddTransactionPage/AccountSelector";
import { AddTransactionSkeleton } from "../components/AddTransactionPage/AddTransactionSkeleton";
import { CategoryGrid } from "../components/AddTransactionPage/CategoryGrid";
import {
  DateSelector,
  SubmitButton
} from "../components/AddTransactionPage/TransactionFormFields";
import { TransactionHero } from "../components/AddTransactionPage/TransactionHero";
import { SuccessModal } from "../components/Shared/SuccessModal";
import { useAuth } from "../context/AuthContext";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import {
  createTransaction,
  updateAccountBalance,
} from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { Category } from "../types/types";

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const { userId, isLoading } = useAuth();
  const router = useRouter();
  const { refreshAll } = useDataRefresh();

  // Use global stores
  const categories = useCategoriesStore((state) => state.categories);
  const isCategoriesLoading = useCategoriesStore((state) => state.isLoading);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const expenseAccountOptions = accountOptions.filter(
    (acc) => acc.type !== "investment",
  );
  const updateAccountBalanceStore = useAccountsStore(
    (state) => state.updateAccountBalance,
  );

  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    "expense",
  );
  const [selectedAccount, setSelectedAccount] = useState("Main Checking");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // Set initial selections when data is loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
    if (accountOptions.length > 0 && selectedAccount === "Main Checking") {
      setSelectedAccount(accountOptions[0].account_name);
    }
  }, [categories, accountOptions]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleSubmit = async () => {
    // 1. Basic validation
    if (!amount || !userId) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // 2. Category logic check
    if (transactionType === "expense" && !selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    try {
      const categoryName =
        transactionType === "expense"
          ? selectedCategory?.category_name
          : "Income";

      // Optimistic UI: Update balance immediately
      const currentAccount = accountOptions.find(
        (acc) => acc.account_name === selectedAccount,
      );
      if (currentAccount) {
        const newBalance =
          transactionType === "expense"
            ? currentAccount.balance - numericAmount
            : currentAccount.balance + numericAmount;

        updateAccountBalanceStore(selectedAccount, newBalance);
      }

      // Show success immediately
      setShowSuccess(true);

      // Make API calls in background
      await createTransaction({
        amount: transactionType === "expense" ? -numericAmount : numericAmount,
        description: description,
        account_name: selectedAccount,
        category_name: categoryName,
        user_id: userId,
        created_at: selectedDate.toISOString(),
      });

      if (currentAccount) {
        const newBalance =
          transactionType === "expense"
            ? currentAccount.balance - numericAmount
            : currentAccount.balance + numericAmount;

        await updateAccountBalance(selectedAccount, newBalance);
      }

      // Refresh all related screens (dashboard, accounts, transaction-list)
      await refreshAll();
    } catch (err) {
      console.error("Submission error:", err);
      Alert.alert(
        "Error",
        "Failed to add transaction. Check your database constraints.",
      );
      // Reload accounts to revert optimistic update
      await refreshAll();
    }
  };

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-backgroundDark" : "bg-background"}`}
      edges={["top"]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
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
          />

          {/* Description */}
          <View className="mb-6">
            <Text
              className={`text-sm mb-2 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}
            >
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Grocery shopping"
              placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
              className={`w-full px-4 py-3 rounded-xl border ${
                isDarkMode
                  ? "bg-slate700 border-slate600 text-textDark"
                  : "bg-background border-borderLight text-textLight"
              }`}
            />
          </View>

          {isCategoriesLoading || categories.length === 0 ? (
            <AddTransactionSkeleton isDarkMode={isDarkMode} />
          ) : (
            <>
              {transactionType === "expense" && (
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

              <MotiView
                key={`account-${transactionType}`}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: "timing", duration: 250, delay: 0 }}
              >
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
              </MotiView>
            </>
          )}

          <MotiView
            key={`date-${transactionType}`}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250, delay: 80 }}
          >
            <DateSelector
              isDarkMode={isDarkMode}
              selectedDate={selectedDate}
              showDatePicker={showDatePicker}
              setShowDatePicker={setShowDatePicker}
              handleDateChange={handleDateChange}
            />
          </MotiView>

          <MotiView
            key={`submit-${transactionType}`}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250, delay: 160 }}
          >
            <SubmitButton
              isDarkMode={isDarkMode}
              handleSubmit={handleSubmit}
              transactionType={transactionType}
            />
          </MotiView>

          {/* Success animation */}
          <SuccessModal
            visible={showSuccess}
            text="Transaction Added!"
            onDismiss={() => {
              setShowSuccess(false);
              setAmount("");
              setDescription("");
              setSelectedDate(new Date());
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default TransactionAdder;
