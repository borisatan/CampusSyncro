import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Download,
  Fingerprint,
  Globe,
  KeyRound,
  LogOut,
  User,
  Wallet
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AnimatedToggle } from '../components/Shared/AnimatedToggle';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks & Utils
import { useLock } from '../context/LockContext';
import { useTheme } from '../context/ThemeContext';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { supabase } from '../utils/supabase';

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { isAppLockEnabled, biometricAvailable, setAppLockEnabled, hasPinSet, setPin, removePin } = useLock();

  // State
  const [email, setEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
  const [pinError, setPinError] = useState('');

  const { updateCurrency, currencyCode } = useCurrencyStore();

  // Fetch User Data and Currency preference on Mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email ?? null);
      }
    };
    fetchUserData();
  }, []);

  // Sync selectedCurrency with store when currencyCode changes
  useEffect(() => {
    if (currencyCode) {
      setSelectedCurrency(currencyCode);
    }
  }, [currencyCode]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Sign out failed', error.message);
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCurrencyChange = async (code: string) => {
    try {
      // 1. Update local UI state
      setSelectedCurrency(code);
      setShowCurrencyPicker(false);
      
      // 2. Update Zustand store (which also persists to backend)
      await updateCurrency(code);
    } catch (error) {
      Alert.alert('Error', 'Failed to save currency preference');
      console.error(error);
      // Revert UI state on error
      setSelectedCurrency(currencyCode || 'USD');
    }
  };

  const handleExportCSV = () => {
    console.log("CSV Export triggered");
  };

  const handleOpenPinSetup = () => {
    setNewPin('');
    setConfirmPin('');
    setPinStep('enter');
    setPinError('');
    setShowPinModal(true);
  };

  const handlePinChange = (value: string, field: 'new' | 'confirm') => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
    if (field === 'new') {
      setNewPin(cleaned);
    } else {
      setConfirmPin(cleaned);
    }
    setPinError('');
  };

  const handlePinNext = () => {
    if (newPin.length < 4) {
      setPinError('PIN must be at least 4 digits');
      return;
    }
    setPinStep('confirm');
  };

  const handlePinConfirm = async () => {
    if (confirmPin !== newPin) {
      setPinError('PINs do not match');
      setConfirmPin('');
      return;
    }
    await setPin(newPin);
    setShowPinModal(false);
    Alert.alert('Success', 'Your PIN has been set successfully.');
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN',
      'Are you sure you want to remove your PIN?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            Alert.alert('Success', 'Your PIN has been removed.');
          }
        }
      ]
    );
  };

  // Styling Variables
  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const cardBg = isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}>

        {/* Header */}
        <View className="mb-6 px-2">
          <Text className={`text-2xl font-semibold ${textPrimary}`}>Profile</Text>
          <Text className={`text-md mt-1 ${textSecondary}`}>Manage your account settings</Text>
        </View>

        {/* Profile Card */}
        <View className="bg-indigo-700 rounded-2xl p-6 flex-row items-center mb-8">
          <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
            <User color="white" size={32} />
          </View>
          <View>
            <Text className="text-xl font-bold text-white">Current User</Text>
            <Text className="text-indigo-200 text-sm">{email ?? 'Loading...'}</Text>
          </View>
        </View>

        {/* Settings Section */}
        <View className="mb-8">
          {/* <Text className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}>
            Settings
          </Text> */}

          {/* Currency Selector */}
          <TouchableOpacity
            onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
            activeOpacity={0.7}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-indigo-500/20 rounded-lg items-center justify-center mr-3">
              <Globe color="#818cf8" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Currency</Text>
              <Text className={`text-sm ${textSecondary}`}>
                {currencies.find(c => c.code === selectedCurrency)?.name || selectedCurrency}
              </Text>
            </View>
            <Ionicons
              name={showCurrencyPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
            />
          </TouchableOpacity>

          {showCurrencyPicker && (
            <View className={`mb-3 rounded-xl overflow-hidden border ${cardBg}`}>
              {currencies.map((currency, index) => (
                <AnimatedCurrencyRow
                  key={currency.code}
                  currency={currency}
                  index={index}
                  isDarkMode={isDarkMode}
                  isSelected={selectedCurrency === currency.code}
                  onSelect={() => handleCurrencyChange(currency.code)}
                  isLast={index === currencies.length - 1}
                />
              ))}
            </View>
          )}

          {/* Accounts Button */}
          <Pressable
            onPress={() => router.push('/accounts' as any)}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-violet-500/20 rounded-lg items-center justify-center mr-3">
              <Wallet color="#8B5CF6" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Accounts</Text>
              <Text className={`text-sm ${textSecondary}`}>Manage your accounts</Text>
            </View>
            <ChevronRight color={isDarkMode ? "#9CA3AF" : "#4B5563"} size={20} />
          </Pressable>

          {/* Export CSV Button */}
          {/* <Pressable
            onPress={handleExportCSV}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
              <Download color="#34d399" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Export Transactions </Text>
              <Text className={`text-sm ${textSecondary}`}>Download as CSV file</Text>
            </View>
          </Pressable> */}

          {/* App Lock Toggle */}
          <View className={`flex-row items-center border rounded-2xl p-4 mb-3 ${cardBg}`}>
            <View className="w-10 h-10 bg-rose-500/20 rounded-lg items-center justify-center mr-3">
              <Fingerprint color="#f43f5e" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>App Lock</Text>
              <Text className={`text-sm ${textSecondary}`}>
                {biometricAvailable ? 'Require authentication to open app' : 'Lock app when backgrounded'}
              </Text>
            </View>
            <AnimatedToggle
              value={isAppLockEnabled}
              onValueChange={setAppLockEnabled}
              activeColor="#4f46e5"
              inactiveColor="#3f3f46"
            />
          </View>

          {/* PIN Setup */}
          <TouchableOpacity
            onPress={hasPinSet ? handleRemovePin : handleOpenPinSetup}
            activeOpacity={0.7}
            className={`flex-row items-center border rounded-2xl p-4 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-amber-500/20 rounded-lg items-center justify-center mr-3">
              <KeyRound color="#f59e0b" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>PIN Code</Text>
              <Text className={`text-sm ${textSecondary}`}>
                {hasPinSet ? 'PIN is set - tap to remove' : 'Set up a PIN for unlock'}
              </Text>
            </View>
            {hasPinSet ? (
              <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            ) : (
              <ChevronRight color={isDarkMode ? "#9CA3AF" : "#4B5563"} size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Account Section */}
        <View className="mb-10">
          <Text className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}>
            Account
          </Text>
          <Pressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="bg-accentRed rounded-xl py-4 items-center  flex-row justify-center"
          >
            <LogOut color="white" size={20} style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">
              {isSigningOut ? 'Signing out…' : 'Sign Out'}
            </Text>
          </Pressable>
        </View>

        {/* Footer Info */}
        <View className="items-center pb-10">
          <Text className={`text-sm ${textSecondary}`}>Finance Tracker</Text>
          <Text className={`text-xs mt-1 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Version 1.0.0</Text>
        </View>

      </ScrollView>

      {/* PIN Setup Modal */}
      <Modal
        visible={showPinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPinModal(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-black/50 justify-end"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className={`rounded-t-3xl p-6 ${isDarkMode ? 'bg-surfaceDark' : 'bg-white'}`}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-bold ${textPrimary}`}>
                {pinStep === 'enter' ? 'Set Your PIN' : 'Confirm Your PIN'}
              </Text>
              <TouchableOpacity onPress={() => setShowPinModal(false)}>
                <Ionicons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
              </TouchableOpacity>
            </View>

            {/* PIN Input */}
            <Text className={`mb-2 ${textSecondary}`}>
              {pinStep === 'enter' ? 'Enter a 4-6 digit PIN' : 'Re-enter your PIN to confirm'}
            </Text>
            <TextInput
              value={pinStep === 'enter' ? newPin : confirmPin}
              onChangeText={(v) => handlePinChange(v, pinStep === 'enter' ? 'new' : 'confirm')}
              placeholder="Enter PIN"
              placeholderTextColor={isDarkMode ? '#64748b' : '#9ca3af'}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              autoFocus
              className={`text-center text-2xl tracking-widest px-4 py-4 rounded-xl border mb-2 ${
                isDarkMode ? 'bg-slate-800 text-white' : 'bg-gray-100 text-black'
              } ${pinError ? 'border-red-500' : isDarkMode ? 'border-slate-700' : 'border-gray-300'}`}
            />

            {pinError ? (
              <Text className="text-red-500 text-sm text-center mb-4">{pinError}</Text>
            ) : (
              <Text className={`text-sm text-center mb-4 ${textSecondary}`}>
                {pinStep === 'enter' ? `${newPin.length}/6 digits` : `${confirmPin.length}/6 digits`}
              </Text>
            )}

            {/* Action Button */}
            <Pressable
              onPress={pinStep === 'enter' ? handlePinNext : handlePinConfirm}
              disabled={(pinStep === 'enter' ? newPin.length < 4 : confirmPin.length < 4)}
              className={`py-4 rounded-xl items-center ${
                (pinStep === 'enter' ? newPin.length < 4 : confirmPin.length < 4)
                  ? 'bg-slate-600'
                  : 'bg-accentBlue'
              }`}
            >
              <Text className="text-white font-semibold text-lg">
                {pinStep === 'enter' ? 'Next' : 'Confirm PIN'}
              </Text>
            </Pressable>

            {pinStep === 'confirm' && (
              <TouchableOpacity
                onPress={() => {
                  setPinStep('enter');
                  setConfirmPin('');
                  setPinError('');
                }}
                className="mt-3 py-2"
              >
                <Text className={`text-center ${textSecondary}`}>Go back</Text>
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const AnimatedCurrencyRow = ({
  currency,
  index,
  isDarkMode,
  isSelected,
  onSelect,
  isLast,
}: {
  currency: { code: string; symbol: string; name: string };
  index: number;
  isDarkMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={onSelect}
        className={`px-4 py-4 flex-row items-center justify-between ${
          !isLast
            ? isDarkMode ? 'border-b border-borderDark' : 'border-b border-borderLight'
            : ''
        } ${isSelected ? (isDarkMode ? 'bg-backgroundDark' : 'bg-backgroundMuted') : ''}`}
      >
        <View className="flex-row items-center">
          <Text className={`text-xl mr-3 ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {currency.symbol}
          </Text>
          <View>
            <Text className={`font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
              {currency.name}
            </Text>
            <Text className={`text-xs ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              {currency.code}
            </Text>
          </View>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={isDarkMode ? "#B2A4FF" : "#2563EB"} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};