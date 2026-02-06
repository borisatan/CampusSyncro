import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { fetchCategories } from "../../services/backendService";
import { Category } from "../../types/types";

type FilterModalProps = {
  visible: boolean;
  onClose: () => void;
  dateRange: { start: string; end: string } | null;
  setDateRange: (range: { start: string; end: string } | null) => void;
  filterAccounts: string[];
  setFilterAccounts: (accounts: string[]) => void;
  accountsList: string[];
  // Changed to array to match the logic from your reference
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  filterType: "all" | "income" | "expense";
  setFilterType: (type: "all" | "income" | "expense") => void;
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
  selectedCategories,
  setSelectedCategories,
  filterType,
  setFilterType,
  isDarkMode,
  handleReset,
}) => {
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);


  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategoriesList(cats);
    };
    loadCategories();
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Select date";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const startDate = dateRange?.start ? new Date(dateRange.start) : new Date();
  const endDate = dateRange?.end ? new Date(dateRange.end) : new Date();

  const handleStartDateChange = (event: any, date?: Date) => {
    setShowStartPicker(Platform.OS === "ios");
    if (date) {
      const newStart = date.toISOString().split("T")[0];
      setDateRange({ start: newStart, end: dateRange?.end || "" });
    }
  };

  const handleEndDateChange = (event: any, date?: Date) => {
    setShowEndPicker(Platform.OS === "ios");
    if (date) {
      const newEnd = date.toISOString().split("T")[0];
      setDateRange({ start: dateRange?.start || "", end: newEnd });
    }
  };

  const toggleCategory = (categoryName: string) => {
    if (selectedCategories.includes(categoryName)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== categoryName));
    } else {
      setSelectedCategories([...selectedCategories, categoryName]);
    }
  };
  const toggleAccount = (account: string) => {
    if (filterAccounts.includes(account)) {
      setFilterAccounts(filterAccounts.filter((a) => a !== account));
    } else {
      setFilterAccounts([...filterAccounts, account]);
    }
  };

  const activeFiltersCount = 
    (filterType !== "all" ? 1 : 0) + 
    selectedCategories.length + 
    filterAccounts.length + 
    (dateRange ? 1 : 0);

    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View className="flex-1 bg-black/50" />
        </TouchableWithoutFeedback>
    
        <KeyboardAvoidingView behavior="padding" className="justify-end">
          <View className="bg-backgroundDark px-3 pt-3 pb-4 w-full border-t border-borderDark">

            {/* Header */}
            <View className="flex-row justify-between items-center mb-5 mt-2">
              <View>
                <Text className="text-2xl font-bold text-textDark">Filter Transactions</Text>
                {activeFiltersCount > 0 && (
                  <Text className="text-accentTeal text-sm font-bold uppercase mt-1">
                    {activeFiltersCount} active filters
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={onClose}
                className="bg-inputDark p-2 rounded-full border border-borderDark"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
    
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60vh]">
              
              {/* Transaction Type - ACTUAL DROPDOWN MENU */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-textDark mb-3 uppercase">
                  Transaction Type
                </Text>
                <View className="bg-inputDark rounded-xl border border-borderDark overflow-hidden">
                  {/* Header / Trigger */}
                  <TouchableOpacity
                    onPress={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="flex-row items-center justify-between px-4 py-3.5"
                  >
                    <View className="flex-row items-center gap-x-2">
                      <View className={`w-8 h-8 rounded-lg items-center justify-center ${
                        filterType === 'income' ? 'bg-accentTeal' :
                        filterType === 'expense' ? 'bg-accentRed' : 'bg-accentBlue'
                      }`}>
                        <Ionicons
                          name={filterType === 'all' ? 'layers' : filterType === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                      <Text className="text-base font-bold text-textDark capitalize">
                        {filterType}
                      </Text>
                    </View>
                    <Ionicons
                      name={isTypeDropdownOpen ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>

                  {/* Collapsible Content */}
                  {isTypeDropdownOpen && (
                    <View className="border-t border-borderDark/30 pb-1">
                      {(['all', 'income', 'expense'] as const).map((type) => {
                        const isSelected = filterType === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            onPress={() => {
                              setFilterType(type);
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`flex-row items-center justify-between px-4 py-3 ${isSelected ? 'bg-accentBlue/10' : ''}`}
                          >
                            <Text className={`capitalize text-base ${isSelected ? "text-accentBlue font-bold" : "text-textDark"}`}>
                              {type}
                            </Text>
                            {isSelected && <Ionicons name="checkmark" size={18} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
    
              {/* Date Range Selector */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-textDark mb-3 uppercase">
                  Date Range
                </Text>
                <View className="gap-y-2.5">
                  {/* Start Date */}
                  <TouchableOpacity
                    onPress={() => setShowStartPicker(true)}
                    className="flex-row items-center rounded-xl px-4 py-3.5 border border-borderDark bg-inputDark"
                  >
                    <Calendar size={18} color="#94a3b8" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-secondaryDark uppercase">Start Date</Text>
                      <Text className="text-textDark text-base font-medium">{formatDate(dateRange?.start)}</Text>
                    </View>
                  </TouchableOpacity>

                  {/* End Date */}
                  <TouchableOpacity
                    onPress={() => setShowEndPicker(true)}
                    className="flex-row items-center rounded-xl px-4 py-3.5 border border-borderDark bg-inputDark"
                  >
                    <Calendar size={18} color="#94a3b8" />
                    <View className="ml-3 flex-1">
                      <Text className="text-sm text-secondaryDark uppercase">End Date</Text>
                      <Text className="text-textDark text-base font-medium">{formatDate(dateRange?.end)}</Text>
                    </View>
                  </TouchableOpacity>

                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleStartDateChange}
                      themeVariant="dark"
                    />
                  )}

                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={handleEndDateChange}
                      minimumDate={startDate}
                      themeVariant="dark"
                    />
                  )}
                </View>
              </View>
    
              {/* Accounts Selection */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-textDark mb-3 uppercase">
                  Accounts {filterAccounts.length > 0 && `(${filterAccounts.length})`}
                </Text>
                <View className="gap-y-2.5">
                  {accountsList.map((account) => {
                    const isSelected = filterAccounts.includes(account);
                    return (
                      <TouchableOpacity
                        key={account}
                        onPress={() => toggleAccount(account)}
                        className={`flex-row items-center justify-between px-4 py-3.5 rounded-xl border ${
                          isSelected ? "border-accentBlue bg-accentBlue/10" : "border-borderDark bg-inputDark"
                        }`}
                      >
                        <Text className={`text-base ${isSelected ? "text-textDark font-bold" : "text-textDark"}`}>
                          {account}
                        </Text>
                        <View className={`w-6 h-6 rounded-full border ${isSelected ? 'bg-accentBlue border-accentBlue' : 'border-borderDark'} items-center justify-center`}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
    
              {/* Categories Multi-Selection Grid (Bigger Icons) */}
              <View className="mb-6">
                <Text className="text-sm font-bold text-textDark mb-3 uppercase">
                  Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-2.5">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.category_name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleCategory(cat.category_name)}
                        className={`flex-row items-center gap-2.5 px-3 py-3 rounded-xl border ${
                          isSelected ? "border-accentBlue bg-accentBlue/10" : "border-borderDark bg-inputDark"
                        } w-[48%]`}
                      >
                        <View
                          className="w-9 h-9 rounded-lg items-center justify-center"
                          style={{ backgroundColor: cat.color }}
                        >
                          <Ionicons name={cat.icon as any} size={18} color="white" />
                        </View>
                        <Text numberOfLines={1} className={`flex-1 text-sm ${isSelected ? "text-textDark font-bold" : "text-textDark"}`}>
                          {cat.category_name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
    
            {/* Action Buttons */}
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl bg-inputDark border border-borderDark"
                onPress={handleReset}
              >
                <Text className="text-center text-textDark text-base font-bold">Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3.5 rounded-xl bg-accentBlue shadow-xl shadow-accentBlue/40"
                onPress={onClose}
              >
                <Text className="text-center text-textDark font-bold text-base">Apply Filters</Text>
              </TouchableOpacity>
            </View>
    
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
};

export default FilterModal;