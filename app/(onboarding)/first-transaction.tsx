import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OnboardingHeader from '../components/OnboardingPage/OnboardingHeader';
import { QuickLogButton } from '../components/OnboardingPage/QuickLogButton';
import { BudgetTracker } from '../components/OnboardingPage/BudgetTracker';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { Ionicons } from '@expo/vector-icons';

const QUICK_TRANSACTIONS = [
  { icon: '☕', label: 'Coffee', amount: 5, category: 'Eating Out' },
  { icon: '🍔', label: 'Lunch', amount: 15, category: 'Eating Out' },
  { icon: '⛽', label: 'Gas', amount: 50, category: 'Transport' },
];

interface LoggedTransaction {
  id: string;
  icon: string;
  label: string;
  amount: number;
  category: string;
  timestamp: Date;
}

export default function FirstTransactionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    pendingMonthlyTarget,
    pendingTransactions,
    setPendingTransactions,
    setOnboardingStep,
    pendingCategoryNames,
    completeOnboarding,
  } = useOnboardingStore();
  const { currencySymbol } = useCurrencyStore();

  const [loggedTransactions, setLoggedTransactions] = useState<
    LoggedTransaction[]
  >([]);
  const [remainingBudget, setRemainingBudget] = useState(pendingMonthlyTarget);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Other');

  useEffect(() => {
    setOnboardingStep(5);
  }, []);

  const handleSkip = () => {
    completeOnboarding();
    router.replace('/(tabs)/dashboard');
  };

  const handleQuickLog = (tx: typeof QUICK_TRANSACTIONS[0]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newTransaction: LoggedTransaction = {
      id: `temp-${Date.now()}`,
      icon: tx.icon,
      label: tx.label,
      amount: tx.amount,
      category: tx.category,
      timestamp: new Date(),
    };

    // Update UI
    setLoggedTransactions((prev) => [newTransaction, ...prev]);
    setRemainingBudget((prev) => prev - tx.amount);

    // Save to store for later persistence
    setPendingTransactions([
      ...pendingTransactions,
      {
        icon: tx.icon,
        label: tx.label,
        amount: tx.amount,
        category: tx.category,
      },
    ]);
  };

  const handleCustomLog = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newTransaction: LoggedTransaction = {
      id: `temp-${Date.now()}`,
      icon: '💰',
      label: customDescription || 'Custom',
      amount: amount,
      category: selectedCategory,
      timestamp: new Date(),
    };

    // Update UI
    setLoggedTransactions((prev) => [newTransaction, ...prev]);
    setRemainingBudget((prev) => prev - amount);

    // Save to store
    setPendingTransactions([
      ...pendingTransactions,
      {
        icon: '💰',
        label: customDescription || 'Custom',
        amount: amount,
        category: selectedCategory,
      },
    ]);

    // Reset and close
    setCustomAmount('');
    setCustomDescription('');
    setSelectedCategory('Other');
    setShowCustomModal(false);
  };

  const handleContinue = () => {
    router.push('/(onboarding)/transformation-moment');
  };

  return (
    <View className="flex-1 bg-backgroundDark">
      <OnboardingHeader
        title="Log your last purchase"
        currentStep={4}
        totalSteps={6}
        onBack={() => router.push('/(onboarding)/account-name')}
        onSkip={handleSkip}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20 }}
      >
        <Text className="text-sm text-secondaryDark text-center mb-6">
          Takes 5 seconds.
        </Text>

        {/* Budget Tracker */}
        <BudgetTracker
          target={pendingMonthlyTarget}
          remaining={remainingBudget}
          currencySymbol={currencySymbol}
        />

        {/* Quick Log Buttons */}
        <Text className="text-base text-textDark font-medium mb-3">
          Quick Log:
        </Text>
        <View className="flex-row gap-3 mb-4">
          {QUICK_TRANSACTIONS.map((tx) => (
            <QuickLogButton
              key={tx.label}
              icon={tx.icon}
              label={tx.label}
              amount={tx.amount}
              onPress={() => handleQuickLog(tx)}
            />
          ))}
        </View>

        {/* Custom Entry Button */}
        <TouchableOpacity
          onPress={() => setShowCustomModal(true)}
          className="bg-accentBlue rounded-xl py-4 items-center mb-6 active:opacity-80"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">Custom Entry</Text>
        </TouchableOpacity>

        {/* Recent Transactions */}
        {loggedTransactions.length > 0 && (
          <View className="mb-6">
            <Text className="text-base text-textDark font-medium mb-3">
              Recent:
            </Text>
            {loggedTransactions.map((tx) => (
              <View
                key={tx.id}
                className="bg-surfaceDark rounded-xl p-4 border border-borderDark mb-2 flex-row items-center justify-between"
              >
                <View className="flex-row items-center flex-1">
                  <Text className="text-3xl mr-3">{tx.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-textDark text-base font-medium">
                      {tx.label}
                    </Text>
                    <Text className="text-secondaryDark text-xs">Just now</Text>
                  </View>
                </View>
                <Text className="text-red-500 text-lg font-semibold">
                  -{currencySymbol}
                  {tx.amount.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Continue Button */}
      <View className="px-6" style={{ paddingBottom: insets.bottom + 20 }}>
        <TouchableOpacity
          onPress={handleContinue}
          className="bg-accentTeal rounded-xl py-4 px-6 items-center active:opacity-80"
          activeOpacity={0.8}
        >
          <Text className="text-white text-lg font-semibold">
            Continue to Dashboard
          </Text>
        </TouchableOpacity>
      </View>

      {/* Custom Entry Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View
            className="bg-surfaceDark rounded-t-3xl p-6"
            style={{ paddingBottom: insets.bottom + 20 }}
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-textDark text-xl font-semibold">
                Custom Transaction
              </Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* Amount Input */}
            <Text className="text-secondaryDark text-sm mb-2">Amount</Text>
            <View className="flex-row items-center bg-backgroundDark rounded-xl border border-borderDark p-4 mb-4">
              <Text className="text-textDark text-2xl mr-2">
                {currencySymbol}
              </Text>
              <TextInput
                value={customAmount}
                onChangeText={setCustomAmount}
                placeholder="0.00"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                className="text-textDark text-2xl flex-1"
                autoFocus
              />
            </View>

            {/* Category Picker */}
            <Text className="text-secondaryDark text-sm mb-2">Category</Text>
            <View className="bg-backgroundDark rounded-xl border border-borderDark p-4 mb-4">
              <Text className="text-textDark text-base">{selectedCategory}</Text>
            </View>

            {/* Description */}
            <Text className="text-secondaryDark text-sm mb-2">
              Description (optional)
            </Text>
            <TextInput
              value={customDescription}
              onChangeText={setCustomDescription}
              placeholder="What did you buy?"
              placeholderTextColor="#6B7280"
              className="bg-backgroundDark rounded-xl border border-borderDark p-4 text-textDark text-base mb-6"
            />

            {/* Log Button */}
            <TouchableOpacity
              onPress={handleCustomLog}
              className="bg-accentBlue rounded-xl py-4 items-center active:opacity-80"
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-semibold">
                Log Transaction
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
