import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  Download,
  Globe,
  LogOut,
  User,
  Wallet
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks & Utils
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
  
  // State
  const [email, setEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const { updateCurrency, currencyCode } = useCurrencyStore();

  // Fetch User Data and Currency preference on Mount
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? null);
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

  // Styling Variables
  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const cardBg = isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 8 }}>

        {/* Header */}
        <View className="mb-6">
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
          <Pressable
            onPress={handleExportCSV}
            className={`flex-row items-center border rounded-2xl p-4 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
              <Download color="#34d399" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Export Transactions </Text>
              <Text className={`text-sm ${textSecondary}`}>Download as CSV file</Text>
            </View>
          </Pressable>
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