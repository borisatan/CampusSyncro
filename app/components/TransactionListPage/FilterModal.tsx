import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { fetchCategories } from "../../services/backendService";
import { Category } from "../../types/types";
import DateRangeSelector from "../Shared/date-selector";

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


  useEffect(() => {
    const loadCategories = async () => {
      const cats = await fetchCategories();
      setCategoriesList(cats);
    };
    loadCategories();
  }, []);

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
          <View className="bg-backgroundDark p-4  w-full border-t border-borderDark">
            
            {/* Header */}
            <View className="flex-row justify-between items-center mb-10 mt-3">
              <View>
                <Text className="text-2xl font-bold  text-textDark">Filter Transactions</Text>
                {activeFiltersCount > 0 && (
                  <Text className="text-accentBlue text-sm font-bold uppercase tracking-[2px] mt-2">
                    {activeFiltersCount} active filters
                  </Text>
                )}
              </View>
              <TouchableOpacity 
                onPress={onClose}
                className="bg-inputDark p-3 rounded-full border border-borderDark"
              >
                <Ionicons name="close" size={28} color="#FFFFFF" /> 
              </TouchableOpacity>
            </View>
    
            <ScrollView showsVerticalScrollIndicator={false} className="max-h-[60vh]">
              
              {/* Transaction Type - ACTUAL DROPDOWN MENU */}
              <View className="mb-10">
                <Text className="text-sm font-bold text-textDark mb-4 uppercase tracking-[2px]">
                  Transaction Type
                </Text>
                <View className="bg-inputDark rounded-xl border border-borderDark overflow-hidden">
                  {/* Header / Trigger */}
                  <TouchableOpacity
                    onPress={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                    className="flex-row items-center justify-between px-6 py-5"
                  >
                    <View className="flex-row items-center gap-x-3">
                      <Ionicons 
                        name={filterType === 'all' ? 'layers' : filterType === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'} 
                        size={22} 
                        color="#2563EB" 
                      />
                      <Text className="text-lg font-bold text-textDark capitalize">
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
                    <View className="border-t border-borderDark/30 pb-2">
                      {(['all', 'income', 'expense'] as const).map((type) => {
                        const isSelected = filterType === type;
                        return (
                          <TouchableOpacity
                            key={type}
                            onPress={() => {
                              setFilterType(type);
                              setIsTypeDropdownOpen(false);
                            }}
                            className={`flex-row items-center justify-between px-6 py-4 ${isSelected ? 'bg-accentBlue/10' : ''}`}
                          >
                            <Text className={`capitalize text-lg ${isSelected ? "text-accentBlue font-bold" : "text-textDark"}`}>
                              {type}
                            </Text>
                            {isSelected && <Ionicons name="checkmark" size={20} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
    
              {/* Date Range Selector Integration */}
              <View className="mb-10">
                <Text className="text-sm font-bold text-textDark mb-4 uppercase tracking-[2px]">
                  Date Range
                </Text>
                <View className="bg-inputDark rounded-xl border border-borderDark overflow-hidden">
                  <DateRangeSelector
                    currentRange={dateRange}
                    onDateRangeSelect={(startDate, endDate) => setDateRange({ start: startDate, end: endDate })}
                  />
                </View>
              </View>
    
              {/* Accounts Selection */}
              <View className="mb-10">
                <Text className="text-sm font-bold text-textDark mb-4 uppercase tracking-[2px]">
                  Accounts {filterAccounts.length > 0 && `(${filterAccounts.length})`}
                </Text>
                <View className="gap-y-3">
                  {accountsList.map((account) => {
                    const isSelected = filterAccounts.includes(account);
                    return (
                      <TouchableOpacity
                        key={account}
                        onPress={() => toggleAccount(account)}
                        className={`flex-row items-center justify-between px-6 py-5 rounded-xl border ${
                          isSelected ? "border-accentBlue bg-accentBlue/10" : "border-borderDark bg-inputDark"
                        }`}
                      >
                        <Text className={`text-lg ${isSelected ? "text-textDark font-bold" : "text-textDark"}`}>
                          {account}
                        </Text>
                        <View className={`w-6 h-6 rounded-full border ${isSelected ? 'bg-accentBlue border-accentBlue' : 'border-borderDark'} items-center justify-center`}>
                          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
    
              {/* Categories Multi-Selection Grid (Bigger Icons) */}
              <View className="mb-12">
                <Text className="text-sm font-bold text-textDark mb-4 uppercase tracking-[2px]">
                  Categories {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                </Text>
                <View className="flex-row flex-wrap justify-between gap-y-4">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.category_name);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => toggleCategory(cat.category_name)}
                        className={`flex-row items-center gap-4 px-4 py-5 rounded-xl border ${
                          isSelected ? "border-accentBlue bg-accentBlue/10" : "border-borderDark bg-inputDark"
                        } w-[48%]`}
                      >
                        <View 
                          className="w-12 h-12 rounded-xl items-center justify-center"
                          style={{ backgroundColor: isSelected ? cat.color : `${cat.color}20` }}
                        >
                          <Ionicons name={cat.icon as any} size={24} color={isSelected ? 'white' : cat.color} />
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
            <View className="flex-row gap-5 mt-3">
              <TouchableOpacity
                className="flex-1 py-5 rounded-xl bg-inputDark border border-borderDark"
                onPress={handleReset}
              >
                <Text className="text-center text-textDark text-md font-bold">Reset</Text>
              </TouchableOpacity>
    
              <TouchableOpacity 
                className="flex-1 py-5 rounded-xl bg-accentBlue shadow-xl shadow-accentBlue/40" 
                onPress={onClose}
              >
                <Text className="text-center text-textDark font-bold text-md">Apply Filters</Text>
              </TouchableOpacity>
            </View>
    
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
};

export default FilterModal;