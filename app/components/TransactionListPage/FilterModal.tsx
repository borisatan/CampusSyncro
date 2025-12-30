import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { fetchCategories } from "../../services/backendService";
import { Category } from "../../types/types";
import DateRangeSelector from "../Shared/date-selector";
import AccountSelector from "./AccountSelector";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  filterAccounts: string[];
  setFilterAccounts: (accounts: string[]) => void;
  accountsList: string[];
  filterCategory: string | null;
  setFilterCategory: (category: string | null) => void;
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (type: 'all' | 'income' | 'expense') => void;
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
  accountsList,
  filterCategory,
  setFilterCategory,
  filterType,
  setFilterType,
  isDarkMode,
  handleReset
}) => {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategoriesList(cats);
    };

    loadCategories();
  }, []); 

  const selectedCategory = filterCategory ? categoriesList.find((cat) => cat.category_name === filterCategory) : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1" />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
        <View className="bg-background dark:bg-surfaceDark p-5 rounded-t-3xl w-full">
          <Text className={`text-lg font-semibold text-center mb-4 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
            Filter Transactions
          </Text>

          {/* Transaction Type Section */}
          <View className="mb-6">
            <Text className={`text-base font-semibold mb-3 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
              Transaction Type
            </Text>
            <View className="space-y-2">
              <TouchableOpacity
                onPress={() => setFilterType('all')}
                className={`w-full px-4 py-3 rounded-lg ${
                  filterType === 'all' 
                    ? 'bg-accentBlue' 
                    : isDarkMode ? 'bg-inputDark' : 'bg-backgroundMuted'
                }`}
              >
                <Text className={`${
                  filterType === 'all' 
                    ? 'text-textDark font-semibold' 
                    : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
                }`}>
                  All Transactions
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('income')}
                className={`w-full px-4 py-3 rounded-lg ${
                  filterType === 'income' 
                    ? 'bg-accentBlue' 
                    : isDarkMode ? 'bg-inputDark' : 'bg-backgroundMuted'
                }`}
              >
                <Text className={`${
                  filterType === 'income' 
                    ? 'text-textDark font-semibold' 
                    : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
                }`}>
                  Income Only
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterType('expense')}
                className={`w-full px-4 py-3 rounded-lg ${
                  filterType === 'expense' 
                    ? 'bg-accentBlue' 
                    : isDarkMode ? 'bg-inputDark' : 'bg-backgroundMuted'
                }`}
              >
                <Text className={`${
                  filterType === 'expense' 
                    ? 'text-textDark font-semibold' 
                    : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
                }`}>
                  Expenses Only
                </Text>
              </TouchableOpacity>
            </View>
          </View>

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
              className={`px-5 py-3 rounded-full border flex-row items-center ${
                isDarkMode ? "border-borderDark" : "border-borderLight"
              }`}
            >
              <Ionicons
                name={(selectedCategory?.icon as keyof typeof Ionicons.glyphMap) || "apps-outline"}
                size={20}
                color={selectedCategory?.color || (isDarkMode ? "#fff" : "#000")}
              />
              <Text
                className={`${
                  isDarkMode ? "ml-2 text-textDark" : "ml-2 text-textLight"
                }`}
              >
                {filterCategory || "Select Category"}
              </Text>
            </TouchableOpacity>

            {showCategories && (
              <View className="mt-3 border rounded-xl border-borderLight dark:border-borderDark max-h-60">
                <ScrollView>
                  <TouchableOpacity
                    onPress={() => {
                      setFilterCategory(null);
                      setShowCategories(false);
                    }}
                    className={`p-3 flex-row items-center ${
                      filterCategory === null ? "bg-accentTeal/20" : ""
                    }`}
                  >
                    <Ionicons
                      name={"apps-outline"} 
                      size={20}
                      color={isDarkMode ? "#fff" : "#000"}
                    />
                    <Text className={`ml-2 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
                      All Categories
                    </Text>
                  </TouchableOpacity>
                  
                  {categoriesList.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => {
                        setFilterCategory(
                          cat.category_name === filterCategory ? null : cat.category_name
                        );
                        setShowCategories(false);
                      }}
                      className={`p-3 flex-row items-center ${
                        cat.category_name === filterCategory ? "bg-accentTeal/20" : ""
                      }`}
                    >
                      {cat.icon && (
                        <Ionicons
                          name={cat.icon as any} 
                          size={20}
                          color={cat.color}
                        />
                      )}
                      <Text className={`ml-2 ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
                        {cat.category_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* Apply & Reset */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 py-3 mr-3 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={handleReset}
            >
              <Text className={`text-center ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
                Reset
              </Text>
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