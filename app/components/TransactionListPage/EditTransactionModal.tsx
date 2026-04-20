import { ArrowLeft } from 'lucide-react-native';
import { parseAmount } from '../../utils/parseAmount';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';
import { CategoryEditorModal } from '../AddTransactionPage/CategoryEditorModal';
import { CategoryGrid } from '../AddTransactionPage/CategoryGrid';
import { TransactionFormFields } from '../AddTransactionPage/TransactionFormFields';
import { TransactionHero } from '../AddTransactionPage/TransactionHero';
import { useAuth } from '../../context/AuthContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { useTheme } from '../../context/ThemeContext';
import {
  deleteTransaction,
  updateAccountBalance,
  updateTransaction,
} from '../../services/backendService';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { Category, Transaction } from '../../types/types';

interface EditTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  onClose,
  transaction,
}) => {
  const { isDarkMode } = useTheme();
  const { userId } = useAuth();
  const { refreshAll, optimisticDeleteTransaction, optimisticUpdateTransaction } = useDataRefresh();

  const categories = useCategoriesStore((state) => state.categories);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const expenseAccountOptions = accountOptions.filter((acc) => acc.type !== 'investment');
  const updateAccountBalanceStore = useAccountsStore((state) => state.updateAccountBalance);

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [categoryEditorData, setCategoryEditorData] = useState<{ id?: string; name?: string; icon?: string; color?: string }>({});
  const amountInputRef = useRef<TextInput>(null);

  // Reset state every time modal opens with fresh transaction data
  useEffect(() => {
    if (!visible || !transaction) return;
    setAmount(Math.abs(transaction.amount).toString());
    setDescription(transaction.description || '');
    setSelectedAccount(transaction.account_name || '');
    setSelectedDate(new Date(transaction.created_at));
    setTransactionType(transaction.amount < 0 ? 'expense' : 'income');
    setShowAccountDropdown(false);
    setShowDatePicker(false);
    setIsEditMode(false);

    if (categories.length > 0) {
      const match = categories.find((c) => c.category_name === transaction.category_name);
      setSelectedCategory(match ?? (transaction.amount < 0 ? categories[0] : null));
    }
  }, [visible, transaction, categories]);

  const handleDateChange = (_event: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleSave = async () => {
    if (!transaction || !amount || !userId) return;
    const numericAmount = parseAmount(amount);
    if (isNaN(numericAmount)) return;

    try {
      setIsSaving(true);
      const finalAmount = transactionType === 'expense' ? -numericAmount : numericAmount;
      const categoryName = transactionType === 'expense' ? selectedCategory?.category_name : 'Income';

      // Optimistic UI: update balance immediately
      if (selectedAccount === transaction.account_name) {
        const diff = finalAmount - transaction.amount;
        const acc = accountOptions.find((a) => a.account_name === selectedAccount);
        if (acc) updateAccountBalanceStore(selectedAccount, acc.balance + diff);
      } else {
        const oldAcc = accountOptions.find((a) => a.account_name === transaction.account_name);
        if (oldAcc) updateAccountBalanceStore(transaction.account_name, oldAcc.balance - transaction.amount);
        const newAcc = accountOptions.find((a) => a.account_name === selectedAccount);
        if (newAcc) updateAccountBalanceStore(selectedAccount, newAcc.balance + finalAmount);
      }

      optimisticUpdateTransaction({
        ...transaction,
        amount: finalAmount,
        description,
        account_name: selectedAccount,
        category_name: categoryName || transaction.category_name,
        created_at: selectedDate.toISOString(),
      });

      onClose();

      await updateTransaction(transaction.id, finalAmount, description, selectedAccount, categoryName, selectedDate.toISOString());

      if (selectedAccount === transaction.account_name) {
        const diff = finalAmount - transaction.amount;
        const acc = accountOptions.find((a) => a.account_name === selectedAccount);
        if (acc) await updateAccountBalance(selectedAccount, acc.balance + diff, userId);
      } else {
        const oldAcc = accountOptions.find((a) => a.account_name === transaction.account_name);
        if (oldAcc) await updateAccountBalance(transaction.account_name, oldAcc.balance - transaction.amount, userId);
        const newAcc = accountOptions.find((a) => a.account_name === selectedAccount);
        if (newAcc) await updateAccountBalance(selectedAccount, newAcc.balance + finalAmount, userId);
      }

      await refreshAll();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update');
      await refreshAll();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const acc = accountOptions.find((a) => a.account_name === transaction.account_name);
            if (acc) updateAccountBalanceStore(transaction.account_name, acc.balance - transaction.amount);
            optimisticDeleteTransaction(transaction.id);
            onClose();

            await deleteTransaction(transaction.id, userId);
            if (acc) await updateAccountBalance(transaction.account_name, acc.balance - transaction.amount, userId);
            await refreshAll();
          } catch (err) {
            Alert.alert('Error', 'Could not delete');
            await refreshAll();
          }
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView edges={['top']} className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mb-4 mt-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
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
          <View className="w-10" />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
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
              showHeader={false}
            />

            <View className="mb-6">
              <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate300' : 'text-secondaryLight'}`}>Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="e.g. Grocery shopping"
                placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                className={`w-full px-4 py-3 rounded-xl border ${
                  isDarkMode ? 'bg-inputDark border-borderDark text-textDark' : 'bg-background border-borderLight text-textLight'
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
                onEditCategory={(category) => {
                  setCategoryEditorData(category ? { id: category.id, name: category.category_name, icon: category.icon, color: category.color } : {});
                  setCategoryEditorVisible(true);
                }}
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
              isSubmitting={isSaving}
              hideSubmitButton={true}
            />

            {/* Action Buttons */}
            <View className="flex-row mb-6" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isSaving}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-3 items-center bg-accentRed border border-borderDark"
              >
                <Text className="text-white font-bold text-lg">Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
                className={`flex-1 rounded-xl py-3 items-center border ${
                  isSaving ? 'bg-gray400 border-gray400' : 'bg-accentTeal border-borderDark'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isSaving ? 'Saving...' : `Update ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <CategoryEditorModal
          visible={categoryEditorVisible}
          onClose={() => setCategoryEditorVisible(false)}
          categoryId={categoryEditorData.id}
          initialName={categoryEditorData.name}
          initialIcon={categoryEditorData.icon}
          initialColor={categoryEditorData.color}
        />

      </SafeAreaView>
    </Modal>
  );
};
