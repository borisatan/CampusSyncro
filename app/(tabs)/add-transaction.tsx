import { useLocalSearchParams, useRouter } from "expo-router";
import { parseAmount } from "../utils/parseAmount";
import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Calendar } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { AccountSelector } from "../components/AddTransactionPage/AccountSelector";
import { AddTransactionSkeleton } from "../components/AddTransactionPage/AddTransactionSkeleton";
import { CategoryGrid } from "../components/AddTransactionPage/CategoryGrid";
import { DescriptionSuggestions } from "../components/AddTransactionPage/DescriptionSuggestions";
import { SubmitButton } from "../components/AddTransactionPage/TransactionFormFields";
import { TransactionHero } from "../components/AddTransactionPage/TransactionHero";
import { AnimatedToggle } from "../components/Shared/AnimatedToggle";
import { GuestWritePrompt } from "../components/Shared/GuestWritePrompt";
import { SuccessModal } from "../components/Shared/SuccessModal";
import { useAuth } from "../context/AuthContext";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import { useAnalytics } from "../hooks/useAnalytics";
import { useGuestWritePrompt } from "../hooks/useGuestWritePrompt";
import { useRecurringNudge } from "../hooks/useRecurringNudge";
import {
  createRecurringTransaction,
  createTransaction,
  fetchRecentDescriptions,
  updateAccountBalance,
} from "../services/backendService";
import { useAccountsStore } from "../store/useAccountsStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useRecurringTransactionsStore } from "../store/useRecurringTransactionsStore";
import { Category, RecurringInterval } from "../types/types";
import { computeNextRunDate } from "../utils/dateUtils";

const TransactionAdder = () => {
  const { isDarkMode } = useTheme();
  const { userId, isGuest, isLoading } = useAuth();
  const { visible: guestPromptVisible, setVisible: setGuestPromptVisible, guardWrite } = useGuestWritePrompt();
  const router = useRouter();
  const { refreshDashboard, refreshAccounts, refreshTransactionList } = useDataRefresh();
  const { trackEvent } = useAnalytics();

  // Use global stores
  const categories = useCategoriesStore((state) => state.categories);
  const isCategoriesLoading = useCategoriesStore((state) => state.isLoading);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const hasNoAccounts = accountOptions.length === 0;
  const expenseAccountOptions = accountOptions.filter(
    (acc) => acc.type !== "investment",
  );
  const updateAccountBalanceStore = useAccountsStore(
    (state) => state.updateAccountBalance,
  );

  const { type } = useLocalSearchParams<{ type?: "expense" | "income" }>();
  const [transactionType, setTransactionType] = useState<"expense" | "income">(
    type === "income" ? "income" : "expense",
  );

  useEffect(() => {
    setTransactionType(type === "income" ? "income" : "expense");
  }, [type]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [descriptionPool, setDescriptionPool] = useState<Record<string, string[]>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

  // 0 = monthly, 1 = biweekly
  const intervalProgress = useSharedValue(0);
  useEffect(() => {
    intervalProgress.value = withTiming(recurringInterval === 'biweekly' ? 1 : 0, { duration: 150 });
  }, [recurringInterval]);
  const intervalSliderStyle = useAnimatedStyle(() => ({
    left: `${intervalProgress.value * 50}%`,
  }));
  const monthlyTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(intervalProgress.value, [0, 1], ['#ffffff', '#64748B']),
  }));
  const biweeklyTextStyle = useAnimatedStyle(() => ({
    color: interpolateColor(intervalProgress.value, [0, 1], ['#64748B', '#ffffff']),
  }));
  const addOptimisticRecurring = useRecurringTransactionsStore((state) => state.addOptimistic);

  const { checkAndNudge } = useRecurringNudge();
  const prevIsRecurring = useRef(false);
  useEffect(() => {
    if (isRecurring && !prevIsRecurring.current) checkAndNudge();
    prevIsRecurring.current = isRecurring;
  }, [isRecurring]);

  // Set initial selections when data is loaded
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
    if (accountOptions.length > 0 && !selectedAccount) {
      setSelectedAccount(accountOptions[0].account_name);
    }
  }, [categories, accountOptions]);

  useEffect(() => {
    if (!userId) return;
    fetchRecentDescriptions(userId)
      .then(setDescriptionPool)
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    const query = description.trim();
    if (!query) { setSuggestions([]); return; }
    const categoryName = transactionType === "expense" ? selectedCategory?.category_name ?? '' : '';
    const pool = descriptionPool[categoryName] ?? [];
    const filtered = pool.filter(d => d.toLowerCase().startsWith(query.toLowerCase()));
    setSuggestions(filtered.length === 1 && filtered[0].toLowerCase() === query.toLowerCase() ? [] : filtered);
  }, [description, selectedCategory, transactionType, descriptionPool]);

  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    // 1. Basic validation
    if (!amount || !userId) {
      Alert.alert("Error", "Please enter an amount");
      return;
    }

    const numericAmount = parseAmount(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    // 2. Category logic check
    if (transactionType === "expense" && !selectedCategory) {
      Alert.alert("Error", "Please select a category");
      return;
    }

    setIsSubmitting(true);
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
      trackEvent('transaction_added', {
        transaction_type: transactionType,
        category: categoryName,
        amount: numericAmount,
        account: selectedAccount,
      });

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

        await updateAccountBalance(selectedAccount, newBalance, userId);
      }

      // If recurring, create the template (next_run_date = second occurrence)
      if (isRecurring) {
        const firstRunDate = selectedDate.toISOString().split('T')[0];
        const nextRun = computeNextRunDate(firstRunDate, recurringInterval);
        const created = await createRecurringTransaction({
          user_id: userId!,
          amount: transactionType === 'expense' ? -numericAmount : numericAmount,
          category_name: categoryName!,
          account_name: selectedAccount,
          description,
          interval_type: recurringInterval,
          next_run_date: nextRun,
          end_date: recurringEndDate ? recurringEndDate.toISOString().split('T')[0] : null,
          is_active: true,
        });
        addOptimisticRecurring(created);
      }

      // Refresh related screens (dashboard, accounts, transaction-list) - categories don't change
      await Promise.all([refreshDashboard(), refreshAccounts(), refreshTransactionList()]);
    } catch (err) {
      setIsSubmitting(false);
      console.error("Submission error:", err);
      trackEvent('transaction_add_failed', {
        transaction_type: transactionType,
        error_message: err instanceof Error ? err.message : 'Unknown error',
      });
      Alert.alert(
        "Error",
        "Failed to add transaction. Check your database constraints.",
      );
      // Reload accounts to revert optimistic update
      await Promise.all([refreshDashboard(), refreshAccounts(), refreshTransactionList()]);
    }
  };

  const effectiveHandleSubmit = hasNoAccounts
    ? () => router.push("/(tabs)/accounts?openAddModal=true" as any)
    : () => guardWrite(handleSubmit);

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
          contentContainerStyle={{ paddingBottom: 140, paddingHorizontal: 8 }}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
            <View style={{ position: "relative", zIndex: 10 }}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Grocery shopping"
                placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode
                    ? "bg-inputDark border-borderDark text-textDark"
                    : "bg-background border-borderLight text-textLight"
                }`}
              />
              <DescriptionSuggestions
                suggestions={suggestions}
                isDarkMode={isDarkMode}
                onSelect={(value) => {
                  setDescription(value);
                  setSuggestions([]);
                }}
              />
            </View>
          </View>

          {isCategoriesLoading ? (
            <AddTransactionSkeleton isDarkMode={isDarkMode} />
          ) : categories.length === 0 ? (
            <TouchableOpacity
              onPress={() => router.navigate("/components/AddTransactionPage/edit-category")}
              className="mb-6 rounded-xl border border-dashed border-borderDark bg-surfaceDark items-center justify-center py-10"
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={36} color="#3B7EFF" />
              <Text className="text-accentBlue font-semibold text-base mt-2">Create a Category</Text>
            </TouchableOpacity>
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

              {!hasNoAccounts && (
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
              )}
            </>
          )}

          {/* Date + Recurring row */}
          <MotiView
            key={`date-recurring-${transactionType}`}
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 250, delay: 80 }}
            className="mb-6"
          >
            <View className="flex-row gap-2">
              {/* Date selector — 3/4 width */}
              <View style={{ flex: 3 }}>
                <Text className={`text-sm mb-2 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}>
                  Date
                </Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  className={`px-4 py-3 rounded-xl flex-row items-center justify-between border ${
                    isDarkMode ? "bg-inputDark border-borderDark" : "bg-background border-borderLight"
                  }`}
                >
                  <Text className={isDarkMode ? "text-textDark" : "text-textLight"}>
                    {selectedDate.toLocaleDateString()}
                  </Text>
                  <Calendar size={18} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                </TouchableOpacity>
              </View>

              {/* Recurring toggle — 1/4 width */}
              <View style={{ flex: 1 }}>
                <Text className={`text-sm mb-2 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}>
                  Repeat
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setIsRecurring(!isRecurring)}
                  className={`py-2 rounded-xl items-center justify-center border ${
                    isDarkMode ? "bg-inputDark border-borderDark" : "bg-background border-borderLight"
                  }`}
                >
                  <AnimatedToggle
                    value={isRecurring}
                    onValueChange={setIsRecurring}
                    activeColor="#3B7EFF"
                    inactiveColor="#334155"
                    size="sm"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Date picker */}
            {showDatePicker && Platform.OS === "ios" && (
              <Modal visible={showDatePicker} transparent animationType="slide">
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                  className="flex-1 bg-black/50 justify-end"
                >
                  <View className={`${isDarkMode ? "bg-backgroundDark" : "bg-background"} rounded-t-3xl`}>
                    <View className={`flex-row justify-between items-center px-4 py-3 border-b ${isDarkMode ? "border-borderDark" : "border-borderLight"}`}>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text className="text-accentSkyBlue">Cancel</Text>
                      </TouchableOpacity>
                      <Text className={`font-semibold ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
                        Select Date
                      </Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text className="text-accentSkyBlue font-semibold">Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      display="spinner"
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                      themeVariant={isDarkMode ? "dark" : "light"}
                      style={{ width: Dimensions.get("window").width }}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            )}
            {showDatePicker && Platform.OS === "android" && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {/* Recurring options */}
            {isRecurring && (
              <Animated.View entering={FadeIn.duration(200).delay(50)} className="mt-3">
                {/* Interval toggle */}
                <View
                  className={`rounded-xl flex-row mb-3 border ${isDarkMode ? "bg-inputDark border-borderDark" : "bg-slate100 border-borderLight"}`}
                  style={{ overflow: 'hidden' }}
                >
                  <Animated.View
                    className="bg-accentBlue absolute top-0 bottom-0 rounded-xl"
                    style={[{ width: '50%' }, intervalSliderStyle]}
                  />
                  <TouchableOpacity
                    onPress={() => setRecurringInterval('monthly')}
                    className="flex-1 py-2.5 z-10"
                    activeOpacity={0.7}
                  >
                    <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, monthlyTextStyle]}>
                      Monthly
                    </Animated.Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setRecurringInterval('biweekly')}
                    className="flex-1 py-2.5 z-10"
                    activeOpacity={0.7}
                  >
                    <Animated.Text style={[{ textAlign: 'center', fontWeight: '500', fontSize: 13 }, biweeklyTextStyle]}>
                      Bi-weekly
                    </Animated.Text>
                  </TouchableOpacity>
                </View>

                {/* Optional end date */}
                <Text className={`text-xs mb-2 ${isDarkMode ? "text-slate300" : "text-secondaryLight"}`}>
                  End date (optional)
                </Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  className={`w-full px-4 py-3 rounded-xl flex-row items-center justify-between border ${
                    isDarkMode ? "bg-inputDark border-borderDark" : "bg-background border-borderLight"
                  }`}
                >
                  <Text className={isDarkMode ? "text-textDark" : "text-textLight"}>
                    {recurringEndDate
                      ? recurringEndDate.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
                      : "No end date"}
                  </Text>
                  <View className="flex-row items-center gap-3">
                    {recurringEndDate && (
                      <TouchableOpacity onPress={() => setRecurringEndDate(null)}>
                        <Ionicons name="close-circle" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                    <Ionicons name="calendar-outline" size={16} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
                  </View>
                </TouchableOpacity>

                {showEndDatePicker && (
                  <DateTimePicker
                    value={recurringEndDate ?? new Date()}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    minimumDate={new Date()}
                    onChange={(event, date) => {
                      if (Platform.OS === "android") setShowEndDatePicker(false);
                      if (date) setRecurringEndDate(date);
                      if (event.type === "dismissed") setShowEndDatePicker(false);
                    }}
                  />
                )}
              </Animated.View>
            )}
          </MotiView>

          <View>
            <MotiView
              key={`submit-${transactionType}`}
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: "timing", duration: 250, delay: 160 }}
            >
              <SubmitButton
                isDarkMode={isDarkMode}
                handleSubmit={effectiveHandleSubmit}
                transactionType={transactionType}
                isSubmitting={isSubmitting}
                disabled={false}
                buttonText={hasNoAccounts ? "Add an account" : undefined}
              />
            </MotiView>
          </View>

          {/* Success animation */}
          <SuccessModal
            visible={showSuccess}
            text="Transaction Added!"
            onDismiss={() => {
              setShowSuccess(false);
              setIsSubmitting(false);
              setAmount("");
              setDescription("");
              setSuggestions([]);
              setSelectedDate(new Date());
              setIsRecurring(false);
              setRecurringInterval('monthly');
              setRecurringEndDate(null);
            }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      <GuestWritePrompt
        visible={guestPromptVisible}
        onDismiss={() => setGuestPromptVisible(false)}
      />
    </SafeAreaView>
  );
};

export default TransactionAdder;
