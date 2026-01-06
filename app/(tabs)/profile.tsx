import { useRouter } from 'expo-router';
import {
  Check,
  ChevronRight,
  Download,
  Globe,
  LogOut,
  User
} from "lucide-react-native";
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
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
    <SafeAreaView className={`flex-1 ${screenBg} p-2`}>
      <ScrollView>
        
        {/* Header */}
        <View className="mb-8">
          <Text className={`text-3xl font-bold ${textPrimary}`}>Profile</Text>
          <Text className={`mt-1 ${textSecondary}`}>Manage your account settings</Text>
        </View>

        {/* Profile Card */}
        <View className="bg-indigo-600 rounded-2xl p-6 flex-row items-center mb-8">
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
          <Text className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}>
            Settings
          </Text>

          {/* Currency Selector */}
          <View className={`rounded-2xl border overflow-hidden ${cardBg}`}>
            <Pressable
              onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
              className="flex-row items-center justify-between p-4 active:bg-slate-800/10"
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-indigo-500/20 rounded-lg items-center justify-center mr-3">
                  <Globe color="#818cf8" size={20} />
                </View>
                <View>
                  <Text className={`font-medium ${textPrimary}`}>Currency</Text>
                  <Text className={`text-sm ${textSecondary}`}>
                    {selectedCurrency}
                  </Text>
                </View>
              </View>
              <View style={{ transform: [{ rotate: showCurrencyPicker ? '90deg' : '0deg' }] }}>
                <ChevronRight color={isDarkMode ? "#94a3b8" : "#64748b"} size={20} />
              </View>
            </Pressable>

            {showCurrencyPicker && (
              <View className={`border-t ${isDarkMode ? 'border-borderDark' : 'border-borderLight'}`}>
                {currencies.map((currency) => (
                  <Pressable
                    key={currency.code}
                    onPress={() => handleCurrencyChange(currency.code)}
                    className="flex-row items-center justify-between px-4 py-3 active:bg-slate-800/10"
                  >
                    <View className="flex-row items-center">
                      <Text className={`text-xl mr-3 ${textPrimary}`}>{currency.symbol}</Text>
                      <View>
                        <Text className={`text-sm font-medium ${textPrimary}`}>{currency.name}</Text>
                        <Text className={`text-xs ${textSecondary}`}>{currency.code}</Text>
                      </View>
                    </View>
                    {selectedCurrency === currency.code && (
                      <Check color="#818cf8" size={20} />
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Export CSV Button */}
          <Pressable
            onPress={handleExportCSV}
            className={`mt-3 flex-row items-center border rounded-2xl p-4 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-emerald-500/20 rounded-lg items-center justify-center mr-3">
              <Download color="#34d399" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Export Transactions</Text>
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
            className="bg-accentRed rounded-xl py-4 items-center flex-row justify-center"
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