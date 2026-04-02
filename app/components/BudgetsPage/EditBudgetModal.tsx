import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import { parseAmount } from '../../utils/parseAmount';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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

import { useDataRefresh } from '../../context/DataRefreshContext';
import { useTheme } from '../../context/ThemeContext';
import {
  deleteCategory,
  getUserId,
  saveCategory,
  updateCategoryBudgetAmount,
  updateCategoryDashboardVisibility,
} from '../../services/backendService';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';
import { Category, CategoryBudgetStatus } from '../../types/types';
import { AnimatedToggle } from '../Shared/AnimatedToggle';
import { SuccessModal } from '../Shared/SuccessModal';

interface EditBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  category: Category;
  budgetStatus: CategoryBudgetStatus | null;
  currencySymbol: string;
  monthlyIncome: number;
  onSaved: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  visible,
  onClose,
  category,
  budgetStatus,
  currencySymbol,
  monthlyIncome,
  onSaved,
}) => {
  const { isDarkMode } = useTheme();
  const { refreshAll } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);

  const [categoryName, setCategoryName] = useState(category.category_name);
  const [focusedInput, setFocusedInput] = useState(false);
  const [budgetMode, setBudgetMode] = useState<'fixed' | 'percentage'>('fixed');
  const [amountText, setAmountText] = useState('');
  const [percentText, setPercentText] = useState('');
  const [showOnDashboard, setShowOnDashboard] = useState(category.show_on_dashboard ?? true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reset state every time modal opens with fresh category data
  useEffect(() => {
    if (!visible) return;
    setCategoryName(category.category_name);
    setShowOnDashboard(category.show_on_dashboard ?? true);
    setFocusedInput(false);
    setShowSuccess(false);

    const hasPct = category.budget_percentage != null && category.budget_percentage > 0;
    setBudgetMode(hasPct ? 'percentage' : 'fixed');
    setAmountText(budgetStatus?.budget_amount ? budgetStatus.budget_amount.toString() : '');
    setPercentText(hasPct ? category.budget_percentage!.toString() : '');

    // Entrance animation
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible, category, budgetStatus]);

  const hasBudget = amountText !== '' && parseAmount(amountText) > 0;

  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleModeChange = (newMode: 'fixed' | 'percentage') => {
    if (newMode === budgetMode) return;
    animateSelection();
    if (newMode === 'percentage') {
      const currentAmount = parseAmount(amountText);
      if (currentAmount > 0 && monthlyIncome > 0) {
        setPercentText(((currentAmount / monthlyIncome) * 100).toFixed(1));
      }
    } else {
      const currentPct = parseAmount(percentText);
      if (!isNaN(currentPct) && currentPct > 0 && monthlyIncome > 0) {
        setAmountText(Math.round((currentPct / 100) * monthlyIncome).toString());
      }
    }
    setBudgetMode(newMode);
  };

  const handleRemoveBudget = () => {
    setAmountText('');
    setPercentText('');
    setBudgetMode('fixed');
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Name Required', 'Please give your category a name to continue');
      return;
    }

    try {
      setIsProcessing(true);
      const userId = await getUserId();
      if (!userId) throw new Error('User not authenticated');

      const categoryId = category.id.toString();

      // Save name/icon/color (saveCategory handles update)
      await saveCategory(
        userId,
        { category_name: categoryName.trim(), icon: category.icon, color: category.color },
        categoryId
      );

      // Compute budget values
      let budgetAmount: number | null = null;
      let budgetPercentage: number | null = null;

      if (budgetMode === 'fixed') {
        const parsed = parseAmount(amountText);
        if (!isNaN(parsed) && parsed > 0) budgetAmount = parsed;
      } else {
        const pct = parseAmount(percentText);
        if (!isNaN(pct) && pct > 0 && monthlyIncome > 0) {
          budgetPercentage = pct;
          budgetAmount = Math.round((pct / 100) * monthlyIncome);
        }
      }

      await Promise.all([
        updateCategoryBudgetAmount(categoryId, budgetAmount, budgetPercentage),
        updateCategoryDashboardVisibility(categoryId, showOnDashboard),
      ]);

      await loadCategories();
      await refreshAll();

      setShowSuccess(true);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save category');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Category?',
      'This category will be removed from all your transactions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              const userId = await getUserId();
              if (!userId) throw new Error('User not authenticated');

              await deleteCategory(category.id.toString(), userId);

              await loadCategories();
              await loadAccounts();
              await refreshAll();

              onSaved();
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete category');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        {/* Header with Back and Delete — identical to edit-category */}
        <View className="flex-row items-center justify-between px-2 mt-4 mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className={`text-2xl font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                Edit Category
              </Text>
              <Text className="text-secondaryDark">
                Update category details
              </Text>
            </View>
          </View>
          <View className="w-10" />
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
            {/* Live Preview Card - Always at top */}
            <Animated.View
              style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
              className="mx-2 mt-4"
            >
              <View
                className={`rounded-3xl p-8 items-center justify-center border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight'}`}
              >
                <View
                  className="w-28 h-28 rounded-2xl items-center justify-center mb-5"
                  style={{ backgroundColor: category.color }}
                >
                  <Ionicons name={category.icon as any} size={56} color="#FFFFFF" />
                </View>
                <Text
                  className={`text-2xl font-bold text-center ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
                  numberOfLines={1}
                >
                  {categoryName || 'Category Name'}
                </Text>
                <Text className={`text-sm mt-2 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  Editing existing category
                </Text>
              </View>
            </Animated.View>

            {/* Category Name Input */}
            <View className="mx-2 mt-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-sm font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                  Category Name
                </Text>
                <Text className={`text-xs ${categoryName.length > 0 ? 'text-accentTeal' : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  {categoryName.length}/30
                </Text>
              </View>
              <View
                className={`rounded-2xl border ${
                  focusedInput
                    ? 'border-accentBlue'
                    : isDarkMode ? 'border-borderDark bg-inputDark' : 'border-borderLight bg-white'
                }`}
              >
                <TextInput
                  value={categoryName}
                  onChangeText={(text) => setCategoryName(text.slice(0, 30))}
                  placeholder="e.g., Groceries, Rent, Entertainment"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  className={`px-5 py-4 text-lg font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
                  style={{ lineHeight: 18 }}
                  maxLength={30}
                />
              </View>
            </View>

            {/* Budget Section — replaces icon picker and color picker */}
            <View className="mt-5 mx-2">
              <Text className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                Budget
              </Text>

              {/* Mode toggle */}
              <View className={`rounded-xl flex-row mb-4 border overflow-hidden ${isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate100 border-borderLight'}`}>
                <TouchableOpacity
                  onPress={() => handleModeChange('fixed')}
                  className={`flex-1 py-2.5 items-center justify-center rounded-xl ${budgetMode === 'fixed' ? 'bg-accentBlue' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-[13px] font-medium ${budgetMode === 'fixed' ? 'text-white' : 'text-slateMuted'}`}>
                    Fixed Amount
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleModeChange('percentage')}
                  className={`flex-1 py-2.5 items-center justify-center rounded-xl ${budgetMode === 'percentage' ? 'bg-accentBlue' : ''}`}
                  activeOpacity={0.7}
                >
                  <Text className={`text-[13px] font-medium ${budgetMode === 'percentage' ? 'text-white' : 'text-slateMuted'}`}>
                    % of Income
                  </Text>
                </TouchableOpacity>
              </View>

              {budgetMode === 'fixed' ? (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Budget Amount
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className={`flex-1 flex-row items-center px-3 h-12 rounded-xl border ${isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-white border-borderLight'}`}>
                      <Text className="text-slateMuted text-base mr-1">{currencySymbol}</Text>
                      <TextInput
                        className={`flex-1 py-0 text-base ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
                        value={amountText}
                        onChangeText={setAmountText}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        selectionColor={category.color}
                      />
                    </View>
                    {hasBudget && (
                      <TouchableOpacity
                        onPress={handleRemoveBudget}
                        activeOpacity={0.7}
                        className="h-12 px-3 items-center justify-center rounded-xl bg-accentRed"
                      >
                        <Text className="text-white text-sm font-semibold">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {amountText !== '' && !isNaN(parseAmount(amountText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {((parseAmount(amountText) / monthlyIncome) * 100).toFixed(1)}% of income
                    </Text>
                  )}
                </View>
              ) : (
                <View>
                  <Text className="text-secondaryDark text-[11px] mb-1.5 uppercase tracking-wide">
                    Percentage of Income {monthlyIncome > 0 ? `(${currencySymbol}${monthlyIncome.toLocaleString()}/mo)` : ''}
                  </Text>
                  <View className="flex-row items-center gap-2">
                    <View className={`flex-1 flex-row items-center px-3 h-12 rounded-xl border ${isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-white border-borderLight'}`}>
                      <TextInput
                        className={`flex-1 py-0 text-base ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
                        value={percentText}
                        onChangeText={setPercentText}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        selectionColor={category.color}
                      />
                      <Text className="text-slateMuted text-base ml-1">%</Text>
                    </View>
                    {hasBudget && (
                      <TouchableOpacity
                        onPress={handleRemoveBudget}
                        activeOpacity={0.7}
                        className="h-12 px-3 items-center justify-center rounded-xl bg-accentRed"
                      >
                        <Text className="text-white text-sm font-semibold">Remove</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {percentText !== '' && !isNaN(parseAmount(percentText)) && monthlyIncome > 0 && (
                    <Text className="text-secondaryDark text-xs mt-1.5">
                      = {currencySymbol}{Math.round((parseAmount(percentText) / 100) * monthlyIncome).toLocaleString()}
                    </Text>
                  )}
                </View>
              )}
            </View>

            {/* Show on Dashboard toggle */}
            <View className={`mx-2 mt-4 flex-row items-center justify-between px-4 py-3.5 rounded-2xl border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight'}`}>
              <Text className={`text-[13px] ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                Show on Dashboard
              </Text>
              <View onStartShouldSetResponder={() => true}>
                <AnimatedToggle
                  value={showOnDashboard}
                  onValueChange={() => setShowOnDashboard((v) => !v)}
                  activeColor="#1DB8A3"
                  inactiveColor="#334155"
                />
              </View>
            </View>

            {/* Action Buttons — identical layout to edit-category */}
            <View className="px-2 mt-6 flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isProcessing}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-3 items-center bg-accentRed border border-accentRed"
              >
                <Text className="text-white font-bold text-lg">
                  Delete
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                disabled={isProcessing || !categoryName.trim()}
                activeOpacity={0.8}
                className={`flex-1 rounded-xl py-3 items-center border ${
                  isProcessing || !categoryName.trim()
                    ? 'bg-gray400 border-gray400'
                    : 'bg-accentTeal border-accentTeal'
                }`}
              >
                {isProcessing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-lg">Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccess}
          text="Category Updated!"
          onDismiss={() => {
            setShowSuccess(false);
            onSaved();
            onClose();
          }}
        />
      </SafeAreaView>
    </Modal>
  );
};
