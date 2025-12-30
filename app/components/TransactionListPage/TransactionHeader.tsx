import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";

type TransactionsHeaderProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onFilterPress: () => void;
};

const TransactionsHeader: React.FC<TransactionsHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onFilterPress,
}) => {
  const { isDarkMode } = useTheme();

  return (
    <>
      {/* Title */}
      <View className="mb-4 mt-4 justify-center items-center">
        <Text className="text-3xl font-bold text-textLight dark:text-textDark">
          Transactions
        </Text>
      </View>

      {/* Search + Filter */}
      <View className="flex-row items-center mb-3">
        {/* Search Bar */}
        <View className="flex-row items-center bg-backgroundMuted border border-borderLight dark:border-borderDark dark:bg-surfaceDark rounded-3xl px-4 py-2 flex-1 mr-2">
          <Ionicons
            name="search"
            size={16}
            color={isDarkMode ? "#E5E7EB" : "#374151"}
          />
          <TextInput
            placeholder="Search"
            placeholderTextColor={isDarkMode ? "#E5E7EB" : "#374151"}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2 text-lg text-textLight dark:text-textDark flex-1"
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          className="p-5 border border-borderLight dark:border-borderDark rounded-full bg-backgroundMuted dark:bg-surfaceDark"
          onPress={onFilterPress}
        >
          <Ionicons
            name="filter"
            size={20}
            color={isDarkMode ? "#FFFFFF" : "#1F2937"}
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default TransactionsHeader;
