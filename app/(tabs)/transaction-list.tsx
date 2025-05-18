import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import DateRangeSelector from "../components/date-selector";
import { useTheme } from "../context/ThemeContext";

//  Types
type Transaction = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  name: string;
  amount: number;
  currency: string;
  time: string; // e.g. '14:30'
  category: string;
  account: string;
  logo: string;
};

type TransactionSection = {
  title: string;
  data: Transaction[];
};

type RootStackParamList = {
  Transactions: { category?: string };
};

type TransactionsScreenRouteProp = RouteProp<
  RootStackParamList,
  "Transactions"
>;

//  Mock data
const sampleTransactions: Transaction[] = [
  {
    id: "1",
    date: "2024-10-03",
    name: "Amazon",
    amount: -121.7,
    currency: "лв",
    time: "20:35",
    category: "Shopping",
    account: "Visa",
    logo: "🛒",
  },
  {
    id: "2",
    date: "2024-10-03",
    name: "Amazon EU",
    amount: -61.99,
    currency: "€",
    time: "20:36",
    category: "Shopping",
    account: "Revolut",
    logo: "🛒",
  },
  {
    id: "3",
    date: "2024-05-14",
    name: "Alex K",
    amount: 125,
    currency: "€",
    time: "10:03",
    category: "Salary",
    account: "Bank",
    logo: "AK",
  },
];

// Groups transactions by their date property to form sections for SectionList.
const groupTransactionsByDate = (
  transactions: Transaction[]
): TransactionSection[] => {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  });

  return Object.entries(groups).map(([date, data]) => ({ title: date, data }));
};

//  Main Screen
const TransactionsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const route = useRoute<TransactionsScreenRouteProp>();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(
    route.params?.category || null
  );
  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // Apply all active filters to the sample transactions data.
  const filteredTransactions = sampleTransactions.filter((tx) => {
    const matchesCategory = filterCategory
      ? tx.category === filterCategory
      : true;
    const matchesAccount =
      filterAccounts.length > 0 ? filterAccounts.includes(tx.account) : true;
    const matchesSearch =
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = dateRange
      ? new Date(tx.date) >= new Date(dateRange.start) &&
        new Date(tx.date) <= new Date(dateRange.end)
      : true;

    return matchesCategory && matchesAccount && matchesSearch && matchesDate;
  });

  const handleResetFilters = () => {
    setDateRange(null);
    setFilterAccounts([]);
    setIsFilterVisible(false);
  };

  const sections: TransactionSection[] =
    groupTransactionsByDate(filteredTransactions);

  return (
    <SafeAreaView
      className={isDarkMode ? "flex-1 bg-[#1F2937]" : "flex-1 bg-white"}
    >
      {/* SectionList showing transactions grouped by date, with header formatting.  */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <>
            <View className="mb-4 mt-4 justify-center items-center">
              <Text className="text-2xl font-bold text-black dark:text-white">
                Transactions
              </Text>
            </View>

            <View className="flex-row items-center mb-4">
              <View className="flex-row items-center bg-[#F3F4F6] dark:bg-[#4B5563] rounded-full px-4 py-2 flex-1 mr-2">
                <Ionicons
                  name="search"
                  size={16}
                  color={isDarkMode ? "#F3F4F6" : "#4B5563"}
                />
                <TextInput
                  placeholder="Search"
                  placeholderTextColor={isDarkMode ? "#F3F4F6" : "#4B5563"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  className="ml-2 text-black dark:text-white flex-1"
                />
              </View>

              <TouchableOpacity
                className="p-2 rounded-full bg-[#E5E7EB] dark:bg-[#374151]"
                onPress={() => setIsFilterVisible(true)}
              >
                <Ionicons
                  name="filter"
                  size={20}
                  color={isDarkMode ? "#FFFFFF" : "#1F2937"}
                />
              </TouchableOpacity>
            </View>
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text className="text-xs text-[#9CA3AF] mb-2 mt-4">
            {new Date(title).toDateString()}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="bg-[#F3F4F6] dark:bg-[#374151] p-4 rounded-2xl mb-2 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-pink-500 justify-center items-center mr-3">
                <Text className="text-white font-bold">{item.logo}</Text>
              </View>
              <View>
                <Text className="text-sm font-medium text-black dark:text-white">
                  {item.name}
                </Text>
                <Text className="text-xs text-gray-500 dark:text-[#F3F4F6]">
                  {item.time}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text
                className={`text-sm font-medium mb-1 ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                {item.amount > 0 ? "+" : " "}
                {item.amount} {item.currency}
              </Text>
              <Text
                className={`text-sm font-small  ${
                  isDarkMode ? "text-white" : "text-black"
                }`}
              >
                {item.account}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      />

      {/* Filter Modal */}
      <Modal
        visible={isFilterVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterVisible(false)}>
          <View className="flex-1" />
        </TouchableWithoutFeedback>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end"
        >
          <View className="bg-white dark:bg-[#1E1E1E] p-5 rounded-t-3xl w-full">
            <Text className="text-lg font-semibold text-center mb-4 text-black dark:text-white">
              Filter Transactions
            </Text>

            {/* Date Range Selector */}
            <View className="mb-6">
              <Text className={`text-base font-semibold mb-3 ${
                isDarkMode ? "text-white" : "text-black"
              }`}>
                Date Range
              </Text>
              <DateRangeSelector
                currentRange={dateRange}
                onDateRangeSelect={(start, end) => {
                  setDateRange({ start, end });
                }}
              />
            </View>

            {/* Account Selector Section */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-3">
                <Text
                  className={`text-base font-semibold ${
                    isDarkMode ? "text-white" : "text-black"
                  }`}
                >
                  Select account(s)
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    if (filterAccounts.length === 3) {
                      setFilterAccounts([]);
                    } else {
                      setFilterAccounts(["Visa", "Revolut", "Bank"]);
                    }
                  }}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {filterAccounts.length === 3
                      ? "Deselect All"
                      : "Select All"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Account Grid */}
              <View className="flex flex-wrap flex-row -mx-2">
                {["Visa", "Revolut", "Bank"].map((account) => {
                  const isSelected = filterAccounts.includes(account);

                  return (
                    <TouchableOpacity
                      key={account}
                      onPress={() => {
                        if (isSelected) {
                          setFilterAccounts((prev) =>
                            prev.filter((a) => a !== account)
                          );
                        } else {
                          setFilterAccounts((prev) => [...prev, account]);
                        }
                      }}
                      className="w-1/2 px-2 mb-4"
                    >
                      <View
                        className={`flex-row items-center p-3 border rounded-xl dark:border-gray-600 border-gray-300 ${
                          isSelected ? "bg-blue-600" : ""
                        }`}
                      >
                        <View
                          className={`w-5 h-5 mr-3 rounded border flex items-center justify-center ${
                            isSelected
                              ? "bg-white border-white"
                              : "border-gray-400 dark:border-gray-600"
                          }`}
                        >
                          {isSelected && (
                            <Ionicons
                              name="checkmark"
                              size={16}
                              color={isSelected ? "#2563EB" : "#FFF"}
                            />
                          )}
                        </View>
                        <Text
                          className={`${
                            isDarkMode ? "text-white" : "text-black"
                          }`}
                        >
                          {account}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Apply and Reset Buttons */}
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 py-3 mr-2 rounded-xl border border-gray-400 dark:border-gray-600"
                onPress={handleResetFilters}
              >
                <Text className="text-center text-black dark:text-white">
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 ml-2 rounded-xl bg-blue-600"
                onPress={() => setIsFilterVisible(false)}
              >
                <Text className="text-center text-white font-semibold">
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default TransactionsScreen;
