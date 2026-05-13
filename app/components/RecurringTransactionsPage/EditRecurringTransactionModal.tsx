import { ArrowLeft, Calendar } from 'lucide-react-native';
import { parseAmount } from '../../utils/parseAmount';
import React, { useEffect, useRef, useState } from 'react';
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
} from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountSelector } from '../AddTransactionPage/AccountSelector';
import { CategoryEditorModal } from '../AddTransactionPage/CategoryEditorModal';
import { CategoryGrid } from '../AddTransactionPage/CategoryGrid';
import { TransactionHero } from '../AddTransactionPage/TransactionHero';
import { useTheme } from '../../context/ThemeContext';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { useRecurringTransactionsStore } from '../../store/useRecurringTransactionsStore';
import { Category, RecurringInterval, RecurringTransaction } from '../../types/types';
import { getEffectiveNextRunDate } from '../../utils/dateUtils';

interface EditRecurringTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: RecurringTransaction | null;
}

export const EditRecurringTransactionModal: React.FC<EditRecurringTransactionModalProps> = ({
  visible,
  onClose,
  transaction,
}) => {
  const { isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const categories = useCategoriesStore((state) => state.categories);
  const accountOptions = useAccountsStore((state) => state.accounts);
  const expenseAccountOptions = accountOptions.filter((acc) => acc.type !== 'investment');

  const { updateItem, removeItem } = useRecurringTransactionsStore();

  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [description, setDescription] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [categoryEditorVisible, setCategoryEditorVisible] = useState(false);
  const [categoryEditorData, setCategoryEditorData] = useState<{ id?: string; name?: string; icon?: string; color?: string }>({});
  const [recurringInterval, setRecurringInterval] = useState<RecurringInterval>('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState<Date | null>(null);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const amountInputRef = useRef<TextInput>(null);

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

  useEffect(() => {
    if (!visible || !transaction) return;
    setAmount(Math.abs(transaction.amount).toString());
    setDescription(transaction.description || '');
    setSelectedAccount(transaction.account_name || '');
    setTransactionType(transaction.amount < 0 ? 'expense' : 'income');
    setRecurringInterval(transaction.interval_type);
    setRecurringEndDate(transaction.end_date ? new Date(transaction.end_date + 'T00:00:00') : null);
    setShowAccountDropdown(false);
    setShowEndDatePicker(false);
    setIsEditMode(false);

    if (categories.length > 0) {
      const match = categories.find((c) => c.category_name === transaction.category_name);
      setSelectedCategory(match ?? (transaction.amount < 0 ? categories[0] : null));
    }
  }, [visible, transaction, categories]);

  const handleSave = async () => {
    if (!transaction || !amount) return;
    const numericAmount = parseAmount(amount);
    if (isNaN(numericAmount)) return;

    try {
      setIsSaving(true);
      const finalAmount = transactionType === 'expense' ? -numericAmount : numericAmount;
      const categoryName = transactionType === 'expense' ? selectedCategory?.category_name : 'Income';

      // Compute a next_run_date that is guaranteed to be in the future
      const today = new Date().toISOString().split('T')[0];
      const nextRunDate = getEffectiveNextRunDate(today, recurringInterval);

      await updateItem(transaction.id, {
        amount: finalAmount,
        description,
        account_name: selectedAccount,
        category_name: categoryName || transaction.category_name,
        interval_type: recurringInterval,
        next_run_date: nextRunDate,
        end_date: recurringEndDate ? recurringEndDate.toISOString().split('T')[0] : null,
      });

      onClose();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to update recurring transaction.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!transaction) return;
    Alert.alert('Delete', 'Stop this recurring transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem(transaction.id);
            onClose();
          } catch {
            Alert.alert('Error', 'Could not delete recurring transaction.');
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
      onRequestClose={onClose}
    >
      <View
        className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`}
        style={{ paddingTop: insets.top }}
      >
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        {/* Header */}
        <View className="flex-row items-center justify-between px-4 mb-2 mt-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className={`text-2xl font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                Edit Recurring
              </Text>
              <Text className="text-secondaryDark">Update recurring transaction</Text>
            </View>
          </View>
          <View className="w-10" />
        </View>

        {/* Info banner */}
        <View className="mx-4 mb-3 px-3 py-2 rounded-xl bg-indigo-900/40 border border-indigo-700">
          <Text className="text-xs text-indigo-300">Changes apply to future transactions only</Text>
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
                placeholder="e.g. Rent, Netflix..."
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

            {/* Interval + End Date */}
            <View className="mb-6">
              <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate300' : 'text-secondaryLight'}`}>Repeat interval</Text>

              {/* Interval toggle */}
              <View
                className={`rounded-xl flex-row mb-3 border ${isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate100 border-borderLight'}`}
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
              <Text className={`text-xs mb-2 ${isDarkMode ? 'text-slate300' : 'text-secondaryLight'}`}>
                End date (optional)
              </Text>
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(true)}
                className={`w-full px-4 py-3 rounded-xl flex-row items-center justify-between border ${
                  isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-background border-borderLight'
                }`}
              >
                <Text className={isDarkMode ? 'text-textDark' : 'text-textLight'}>
                  {recurringEndDate
                    ? recurringEndDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'No end date'}
                </Text>
                <View className="flex-row items-center gap-3">
                  {recurringEndDate && (
                    <TouchableOpacity onPress={() => setRecurringEndDate(null)}>
                      <Ionicons name="close-circle" size={16} color="#ef4444" />
                    </TouchableOpacity>
                  )}
                  <Calendar size={16} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
                </View>
              </TouchableOpacity>

              {showEndDatePicker && Platform.OS === 'ios' && (
                <Modal visible={showEndDatePicker} transparent animationType="slide">
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => setShowEndDatePicker(false)}
                    className="flex-1 bg-black/50 justify-end"
                  >
                    <View className={`${isDarkMode ? 'bg-backgroundDark' : 'bg-background'} rounded-t-3xl`}>
                      <View className={`flex-row justify-between items-center px-4 py-3 border-b ${isDarkMode ? 'border-borderDark' : 'border-borderLight'}`}>
                        <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                          <Text className="text-accentSkyBlue">Cancel</Text>
                        </TouchableOpacity>
                        <Text className={`font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                          Select End Date
                        </Text>
                        <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                          <Text className="text-accentSkyBlue font-semibold">Done</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={recurringEndDate ?? new Date()}
                        mode="date"
                        display="spinner"
                        minimumDate={new Date()}
                        onChange={(event, date) => {
                          if (date) setRecurringEndDate(date);
                          if (event.type === 'dismissed') setShowEndDatePicker(false);
                        }}
                        themeVariant={isDarkMode ? 'dark' : 'light'}
                        style={{ width: Dimensions.get('window').width }}
                      />
                    </View>
                  </TouchableOpacity>
                </Modal>
              )}
              {showEndDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={recurringEndDate ?? new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setRecurringEndDate(date);
                  }}
                />
              )}
            </View>

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
                  {isSaving ? 'Saving...' : 'Save Changes'}
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
      </View>
    </Modal>
  );
};
