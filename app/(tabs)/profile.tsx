import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Bell,
  ChevronRight,
  Fingerprint,
  LogOut,
  MessageSquare,
  RotateCcw,
  User,
  Wallet,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileCardSkeleton } from "../components/ProfilePage/ProfileSkeleton";
import { AnimatedToggle } from "../components/Shared/AnimatedToggle";
import { CurrencySelector } from "../components/Shared/CurrencySelector";
import { RipplePressable } from "../components/Shared/RipplePressable";

// Custom Hooks & Utils
import { useLock } from "../context/LockContext";
import { useTheme } from "../context/ThemeContext";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { NotificationFrequency } from "../types/types";
import { supabase } from "../utils/supabase";
import { DEVELOPER_USER_IDS } from "../utils/constants";

const frequencyOptions = [
  { value: 0, label: "Off", description: "0 times per day" },
  { value: 1, label: "Once", description: "1 time per day" },
  { value: 2, label: "Twice", description: "2 times per day" },
  { value: 3, label: "Frequent", description: "3 times per day" },
  { value: 5, label: "Maximum", description: "5 times per day" },
];

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const { isAppLockEnabled, deviceAuthAvailable, setAppLockEnabled } =
    useLock();

  // State
  const [email, setEmail] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [showFrequencyPicker, setShowFrequencyPicker] = useState(false);

  const { updateCurrency, currencyCode } = useCurrencyStore();
  const { resetOnboarding, setTestMode } = useOnboardingStore();
  const {
    frequency,
    hasPermission,
    updateFrequency,
    requestPermissions,
    loadNotificationSettings,
  } = useNotificationStore();

  // Fetch User Data and Currency preference on Mount
  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setEmail(session.user.email ?? null);
        setIsDeveloper(DEVELOPER_USER_IDS.has(session.user.id));
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);

  // Sync selectedCurrency with store when currencyCode changes
  useEffect(() => {
    if (currencyCode) {
      setSelectedCurrency(currencyCode);
    }
  }, [currencyCode]);

  // Load notification settings on mount
  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Sign out failed", error.message);
        return;
      }
      router.replace("/(auth)/sign-in");
    } catch (e: any) {
      Alert.alert("Sign out failed", e?.message ?? "Unknown error");
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleCurrencyChange = async (code: string) => {
    try {
      // 1. Update local UI state
      setSelectedCurrency(code);

      // 2. Update Zustand store (which also persists to backend)
      await updateCurrency(code);
    } catch (error) {
      Alert.alert("Error", "Failed to save currency preference");
      console.error(error);
      // Revert UI state on error
      setSelectedCurrency(currencyCode || "USD");
    }
  };

  const handleFrequencyChange = async (value: number) => {
    try {
      // If enabling notifications and no permission, request it
      if (value > 0 && !hasPermission) {
        const granted = await requestPermissions();
        if (!granted) {
          Alert.alert(
            "Permission Required",
            "Please enable notifications in your device settings to receive transaction reminders.",
          );
          setShowFrequencyPicker(false);
          return;
        }
      }

      setShowFrequencyPicker(false);
      await updateFrequency(value as NotificationFrequency);
    } catch (error) {
      Alert.alert("Error", "Failed to update notification settings");
      console.error(error);
    }
  };

  const handleExportCSV = () => {
  };

  const handleTestOnboarding = () => {
    resetOnboarding();
    setTestMode(true);
    router.push("/(onboarding)/welcome");
  };

  const handleFeedback = () => {
    Linking.openURL("https://trymonelo.app/support");
  };

  // Styling Variables
  const textPrimary = isDarkMode ? "text-white" : "text-black";
  const textSecondary = isDarkMode
    ? "text-secondaryDark"
    : "text-secondaryLight";
  const cardBg = isDarkMode
    ? "bg-surfaceDark border-borderDark"
    : "bg-white border-borderLight";
  const screenBg = isDarkMode ? "bg-backgroundDark" : "bg-background";

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="pt-4 pb-3 px-2">
          <Text
            style={{
              fontSize: 28,
              fontWeight: "800",
              color: isDarkMode ? "#F1F5F9" : "#0F172A",
              letterSpacing: -0.5,
            }}
          >
            Profile
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? "#7C8CA0" : "#94A3B8",
              marginTop: 2,
            }}
          >
            Manage your account settings
          </Text>
        </View>

        {/* Profile Card */}
        {isLoading ? (
          <ProfileCardSkeleton />
        ) : (
          <RipplePressable
            onPress={() => router.push("/user-settings" as any)}
            className="bg-indigo-700 rounded-2xl p-6 flex-row items-center mb-8"
            rippleColor="rgba(255, 255, 255, 0.3)"
          >
            <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mr-4">
              <User color="white" size={32} />
            </View>
            <View className="flex-1">
              <Text className="text-xl font-bold text-white">Current User</Text>
              <Text className="text-indigo-200 text-sm">
                {email ?? "Loading..."}
              </Text>
            </View>
            <ChevronRight color="white" size={24} />
          </RipplePressable>
        )}

        {/* Settings Section */}
        <View className="mb-8">
          <Text
            className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
          >
            Settings
          </Text>

          {/* Currency Selector */}
          <CurrencySelector
            selectedCurrency={selectedCurrency}
            onSelect={handleCurrencyChange}
            isDarkMode={isDarkMode}
          />

          {/* Accounts Button */}
          <RipplePressable
            onPress={() => router.push("/accounts" as any)}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-violet-600 rounded-xl items-center justify-center mr-3">
              <Wallet color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Accounts</Text>
              <Text className={`text-sm ${textSecondary}`}>
                Manage your accounts
              </Text>
            </View>
          </RipplePressable>

          {/* Daily Reminders Selector */}
          <Pressable
            onPress={() => setShowFrequencyPicker(!showFrequencyPicker)}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center mr-3">
              <Bell color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>
                Daily Reminders
              </Text>
              <Text className={`text-sm ${textSecondary}`}>
                {isLoading
                  ? "Loading..."
                  : frequencyOptions.find((o) => o.value === frequency)
                      ?.label || "Off"}
              </Text>
            </View>
            <Ionicons
              name={showFrequencyPicker ? "chevron-up" : "chevron-down"}
              size={20}
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
            />
          </Pressable>

          {showFrequencyPicker && (
            <View
              className={`mb-3 rounded-xl overflow-hidden border ${cardBg}`}
            >
              {frequencyOptions.map((option, index) => (
                <AnimatedFrequencyRow
                  key={option.value}
                  option={option}
                  isDarkMode={isDarkMode}
                  isSelected={frequency === option.value}
                  onSelect={() => handleFrequencyChange(option.value)}
                  isLast={index === frequencyOptions.length - 1}
                />
              ))}
            </View>
          )}

          {/* App Lock Toggle */}
          <View
            className={`flex-row items-center border rounded-2xl p-4 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-rose-600 rounded-xl items-center justify-center mr-3">
              <Fingerprint color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>App Lock</Text>
              <Text className={`text-sm ${textSecondary}`}>
                {deviceAuthAvailable
                  ? "Use your phone's PIN or biometrics"
                  : "Lock app when backgrounded"}
              </Text>
            </View>
            <AnimatedToggle
              value={isAppLockEnabled}
              onValueChange={setAppLockEnabled}
              activeColor="#4f46e5"
              inactiveColor="#3f3f46"
            />
          </View>
        </View>

        {/* Feedback Section */}
        <View className="mb-8">
          <Text
            className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
          >
            Feedback
          </Text>
          <RipplePressable
            onPress={handleFeedback}
            className={`flex-row items-center border rounded-2xl p-4 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-teal-600 rounded-xl items-center justify-center mr-3">
              <MessageSquare color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>
                Give Feedback
              </Text>
              <Text className={`text-sm ${textSecondary}`}>
                Give feature requests and feedback
              </Text>
            </View>
            <ChevronRight
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
              size={20}
            />
          </RipplePressable>
        </View>

        {/* Developer Section — only visible to developers */}
        {isDeveloper && (
          <View className="mb-8">
            <Text
              className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
            >
              Developer
            </Text>
            <RipplePressable
              onPress={handleTestOnboarding}
              className={`flex-row items-center border rounded-2xl p-4 ${cardBg}`}
            >
              <View className="w-10 h-10 bg-amber-600 rounded-xl items-center justify-center mr-3">
                <RotateCcw color="white" size={20} />
              </View>
              <View className="flex-1">
                <Text className={`font-medium ${textPrimary}`}>
                  Test Onboarding
                </Text>
                <Text className={`text-sm ${textSecondary}`}>
                  Reset and restart onboarding flow
                </Text>
              </View>
              <ChevronRight
                color={isDarkMode ? "#9CA3AF" : "#4B5563"}
                size={20}
              />
            </RipplePressable>
          </View>
        )}

        {/* Account Section */}
        <View className="mb-10">
          <Text
            className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
          >
            Account
          </Text>
          <RipplePressable
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="bg-accentRed rounded-xl py-4 items-center  flex-row justify-center"
            rippleColor="rgba(255, 255, 255, 0.3)"
          >
            <LogOut color="white" size={20} style={{ marginRight: 8 }} />
            <Text className="text-white font-semibold">
              {isSigningOut ? "Signing out…" : "Sign Out"}
            </Text>
          </RipplePressable>
        </View>

        {/* Footer Info */}
        <View className="items-center pb-10">
          <Text className={`text-sm ${textSecondary}`}>Monelo</Text>
          <Text
            className={`text-xs mt-1 ${isDarkMode ? "text-slate-600" : "text-slate-400"}`}
          >
            Version 1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const AnimatedFrequencyRow = ({
  option,
  isDarkMode,
  isSelected,
  onSelect,
  isLast,
}: {
  option: { value: number; label: string; description: string };
  isDarkMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  isLast: boolean;
}) => {
  return (
    <Pressable
      onPress={onSelect}
      className={`px-4 py-4 flex-row items-center justify-between ${
        !isLast
          ? isDarkMode
            ? "border-b border-borderDark"
            : "border-b border-borderLight"
          : ""
      } ${isSelected ? (isDarkMode ? "bg-backgroundDark" : "bg-backgroundMuted") : ""}`}
    >
      <View>
        <Text
          className={`font-medium ${isDarkMode ? "text-textDark" : "text-textLight"}`}
        >
          {option.label}
        </Text>
        <Text
          className={`text-xs ${isDarkMode ? "text-secondaryDark" : "text-secondaryLight"}`}
        >
          {option.description}
        </Text>
      </View>
      {isSelected && (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={isDarkMode ? "#B2A4FF" : "#2563EB"}
        />
      )}
    </Pressable>
  );
};
