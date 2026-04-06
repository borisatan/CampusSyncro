import { useRouter } from "expo-router";
import {
  AlertCircle,
  ArrowLeft,
  ExternalLink,
  FileText,
  HelpCircle,
  Trash2,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./context/ThemeContext";
import { supabase } from "./utils/supabase";

export default function UserSettingsScreen() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // URLs - Update these with your actual URLs
  const PRIVACY_POLICY_URL = "https://trymonelo.app/privacy-policy";
  const TERMS_URL = "https://trymonelo.app/terms-and-conditions";
  const SUPPORT_URL = "https://trymonelo.app/support";

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteAccount,
        },
      ],
    );
  };

  const confirmDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Error", "No user found");
        return;
      }

      // Call RPC function to delete user data and account
      const { error } = await supabase.rpc("delete_user_account");

      if (error) {
        Alert.alert("Error", "Failed to delete account: " + error.message);
        return;
      }

      // Sign out after successful deletion
      await supabase.auth.signOut();
      router.replace("/(auth)/sign-in");
    } catch {
      Alert.alert(
        "Error",
        "Failed to delete account",
      );
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const openURL = async (url: string, name: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", `Cannot open ${name}`);
      }
    } catch {
      Alert.alert("Error", `Failed to open ${name}`);
    }
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
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
      >
        {/* Header with Back Button */}
        <View className="pt-4 pb-3 px-2 flex-row items-center">
          <Pressable
            onPress={() => router.back()}
            className="mr-3 w-10 h-10 items-center justify-center"
          >
            <ArrowLeft color={isDarkMode ? "#F1F5F9" : "#0F172A"} size={24} />
          </Pressable>
          <View className="flex-1">
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: isDarkMode ? "#F1F5F9" : "#0F172A",
                letterSpacing: -0.5,
              }}
            >
              User Settings
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: isDarkMode ? "#7C8CA0" : "#94A3B8",
                marginTop: 2,
              }}
            >
              Manage your account and preferences
            </Text>
          </View>
        </View>

        {/* Resources Section */}
        <View className="mb-8 mt-4">
          <Text
            className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
          >
            Resources
          </Text>

          {/* Privacy Policy */}
          <Pressable
            onPress={() => openURL(PRIVACY_POLICY_URL, "Privacy Policy")}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-blue-600 rounded-xl items-center justify-center mr-3">
              <FileText color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>
                Privacy Policy
              </Text>
              <Text className={`text-sm ${textSecondary}`}>
                View our privacy policy
              </Text>
            </View>
            <ExternalLink
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
              size={20}
            />
          </Pressable>

          {/* Terms and Conditions */}
          <Pressable
            onPress={() => openURL(TERMS_URL, "Terms and Conditions")}
            className={`flex-row items-center border rounded-2xl p-4 mb-3 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-purple-600 rounded-xl items-center justify-center mr-3">
              <FileText color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>
                Terms and Conditions
              </Text>
              <Text className={`text-sm ${textSecondary}`}>
                View our terms of service
              </Text>
            </View>
            <ExternalLink
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
              size={20}
            />
          </Pressable>

          {/* Support */}
          <Pressable
            onPress={() => openURL(SUPPORT_URL, "Support")}
            className={`flex-row items-center border rounded-2xl p-4 active:bg-slate-800/10 ${cardBg}`}
          >
            <View className="w-10 h-10 bg-green-600 rounded-xl items-center justify-center mr-3">
              <HelpCircle color="white" size={20} />
            </View>
            <View className="flex-1">
              <Text className={`font-medium ${textPrimary}`}>Support</Text>
              <Text className={`text-sm ${textSecondary}`}>
                Get help and contact us
              </Text>
            </View>
            <ExternalLink
              color={isDarkMode ? "#9CA3AF" : "#4B5563"}
              size={20}
            />
          </Pressable>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text
            className={`text-xs font-semibold uppercase mb-3 px-1 ${textSecondary}`}
          >
            Danger Zone
          </Text>

          {/* Warning Card */}
          <View
            className={`flex-row items-start border rounded-2xl p-4 mb-3 ${isDarkMode ? "bg-red-950/20 border-red-900/40" : "bg-red-50 border-red-200"}`}
          >
            <AlertCircle
              color={isDarkMode ? "#FCA5A5" : "#DC2626"}
              size={20}
              style={{ marginRight: 12, marginTop: 2 }}
            />
            <View className="flex-1">
              <Text
                className={`font-semibold mb-1 ${isDarkMode ? "text-red-300" : "text-red-700"}`}
              >
                Account Deletion
              </Text>
              <Text
                className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"}`}
              >
                Deleting your account will permanently remove all your data,
                including transactions, accounts, budgets, and categories. This
                action cannot be undone.
              </Text>
            </View>
          </View>

          {/* Delete Account Button */}
          <Pressable
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
            className={`flex-row items-center justify-center border-2 rounded-2xl p-4 ${isDarkMode ? "bg-red-950/30 border-red-900/50" : "bg-red-50 border-red-300"} ${isDeletingAccount ? "opacity-50" : ""}`}
          >
            <Trash2
              color={isDarkMode ? "#FCA5A5" : "#DC2626"}
              size={20}
              style={{ marginRight: 8 }}
            />
            <Text
              className={`font-semibold ${isDarkMode ? "text-red-300" : "text-red-700"}`}
            >
              {isDeletingAccount
                ? "Deleting Account..."
                : "Request Account Deletion"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
