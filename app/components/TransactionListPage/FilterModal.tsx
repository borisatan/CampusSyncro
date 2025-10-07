import { fetchAccountNames } from "@/app/services/backendService";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import DateRangeSelector from "../Shared/date-selector";
import AccountSelector from "./AccountSelector";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  filterAccounts: string[];
  setFilterAccounts: (accounts: string[]) => void;
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  isDarkMode: boolean;
  handleReset: () => void;
};


const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  dateRange,
  setDateRange,
  filterAccounts,
  setFilterAccounts,
  filterCategory,
  setFilterCategory,
  isDarkMode,
  handleReset
}) => {
  const [accountsList, setAccountsList] = useState<string[]>([]);
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  
  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const names = await fetchAccountNames();
        setAccountsList(names.map((a: any) => a.account_name));
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };
  
    loadAccounts();
  }, []);
  
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1" />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end">
        <View className="bg-background dark:bg-surfaceDark p-5 rounded-t-3xl w-full">
          <Text className={`text-lg font-semibold text-center mb-4 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
            Filter Transactions
          </Text>

          {/* Date Range Selector */}
          <View className="mb-6">
            <Text className={`text-base font-semibold mb-3 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
              Date Range
            </Text>
            <TouchableOpacity
              onPress={() => {}}
              className={`px-5 py-3 rounded-full border ${
                isDarkMode ? "border-borderDark" : "border-borderLight"
              }`}
            >
              <DateRangeSelector
                currentRange={dateRange}
                onDateRangeSelect={(startDate, endDate) => setDateRange({ start: startDate, end: endDate })}
              />
            </TouchableOpacity>
          </View>


          {/* Account Selector */}
          <AccountSelector
            accountsList={accountsList}
            filterAccounts={filterAccounts}
            setFilterAccounts={setFilterAccounts}
            isDarkMode={isDarkMode}
          />
          {/* Category Selector */}
<View className="mb-6">
  <Text
    className={`text-base font-semibold mb-3 ${
      isDarkMode ? "text-textDark" : "text-textLight"
    }`}
  >
    Category
  </Text>

  <TouchableOpacity
    onPress={() => setShowCategories(prev => !prev)}
    className={`px-5 py-3 rounded-full border ${
      isDarkMode ? "border-borderDark" : "border-borderLight"
    }`}
  >
    <Text
      className={`${
        isDarkMode ? "text-textDark" : "text-textLight"
      }`}
    >
      {filterCategory || "Select Category"}
    </Text>
  </TouchableOpacity>

  {showCategories && (
    <View className="mt-3 border rounded-xl border-borderLight dark:border-borderDark">
      {categoriesList.map((cat) => (
        <TouchableOpacity
          key={cat}
          onPress={() => {
            setFilterCategory(cat === filterCategory ? null : cat);
            setShowCategories(false);
          }}
          className={`p-3 ${cat === filterCategory ? "bg-accentTeal/20" : ""}`}
        >
          <Text
            className={`${
              isDarkMode ? "text-textDark" : "text-textLight"
            }`}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )}
</View>


          {/* Apply & Reset */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 py-3 mr-3 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={handleReset}
            >
              <Text className={`text-center ${isDarkMode ? "text-textDark" : "text-textLight"}`}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity className="flex-1 py-3 ml-2 rounded-xl bg-accentTeal" onPress={onClose}>
              <Text className="text-center text-textDark font-semibold">Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default FilterModal;
