import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "./context/ThemeContext";
import { useRecurringTransactionsStore } from "./store/useRecurringTransactionsStore";
import { RecurringTransaction } from "./types/types";
import { useCurrencyStore } from "./store/useCurrencyStore";
import { getCurrencySymbol } from "./types/types";

function RecurringCard({
  item,
  onDelete,
  isDarkMode,
  currencySymbol,
}: {
  item: RecurringTransaction;
  onDelete: () => void;
  isDarkMode: boolean;
  currencySymbol: string;
}) {
  const cardBg = isDarkMode ? "bg-surfaceDark border-borderDark" : "bg-white border-borderLight";
  const textPrimary = isDarkMode ? "text-white" : "text-black";
  const textSecondary = isDarkMode ? "text-secondaryDark" : "text-secondaryLight";
  const isExpense = item.amount < 0;
  const absAmount = Math.abs(item.amount).toFixed(2);

  const nextDate = new Date(item.next_run_date + "T00:00:00");
  const formattedNext = nextDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const label = item.description || item.category_name;
  const intervalLabel = item.interval_type === "monthly" ? "Monthly" : "Bi-weekly";

  const handleDelete = () => {
    Alert.alert(
      "Delete Recurring Transaction",
      `Stop auto-creating "${label}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <View className={`flex-row items-center p-4 rounded-2xl border mb-3 ${cardBg}`}>
      <View className="flex-1">
        <Text className={`font-semibold text-base ${textPrimary}`} numberOfLines={1}>
          {label}
        </Text>
        <View className="flex-row items-center mt-1 gap-2">
          <View
            className={`px-2 py-0.5 rounded-full ${isDarkMode ? "bg-indigo-900" : "bg-indigo-100"}`}
          >
            <Text className={`text-xs font-medium ${isDarkMode ? "text-indigo-300" : "text-indigo-700"}`}>
              {intervalLabel}
            </Text>
          </View>
          <Text className={`text-xs ${textSecondary}`}>Next: {formattedNext}</Text>
        </View>
        {item.end_date && (
          <Text className={`text-xs mt-0.5 ${textSecondary}`}>
            Ends {new Date(item.end_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Text>
        )}
      </View>

      <View className="items-end ml-3 gap-2">
        <Text
          className={`font-bold text-base ${isExpense ? "text-red-500" : "text-teal-500"}`}
        >
          {isExpense ? "-" : "+"}{currencySymbol}{absAmount}
        </Text>
        <TouchableOpacity onPress={handleDelete} className="p-1">
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecurringTransactionsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { items, isLoading, loadRecurringTransactions, removeItem } =
    useRecurringTransactionsStore();
  const { currencyCode } = useCurrencyStore();
  const currencySymbol = getCurrencySymbol(currencyCode ?? "USD");

  const textPrimary = isDarkMode ? "text-white" : "text-black";
  const textSecondary = isDarkMode ? "text-secondaryDark" : "text-secondaryLight";
  const screenBg = isDarkMode ? "bg-backgroundDark" : "bg-background";

  useEffect(() => {
    loadRecurringTransactions();
  }, []);

  const activeItems = items.filter((i) => i.is_active);

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 mb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color={isDarkMode ? "#fff" : "#000"} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-2xl font-semibold ${textPrimary}`}>
            Recurring Transactions
          </Text>
          <Text className={`text-xs ${textSecondary}`}>
            Auto-created on schedule
          </Text>
        </View>
      </View>

      <FlatList
        data={activeItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
        refreshing={isLoading}
        onRefresh={loadRecurringTransactions}
        renderItem={({ item }) => (
          <RecurringCard
            item={item}
            isDarkMode={isDarkMode}
            currencySymbol={currencySymbol}
            onDelete={() => removeItem(item.id).catch(() =>
              Alert.alert("Error", "Failed to delete. Please try again.")
            )}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center mt-20 px-8">
              <Ionicons
                name="repeat-outline"
                size={56}
                color={isDarkMode ? "#334155" : "#cbd5e1"}
              />
              <Text className={`text-lg font-semibold mt-4 ${textPrimary}`}>
                No recurring transactions
              </Text>
              <Text className={`text-sm text-center mt-2 ${textSecondary}`}>
                Toggle "Recurring" when adding a transaction to set one up.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
