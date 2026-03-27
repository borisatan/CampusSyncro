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
      <View className="pt-4 pb-3">
        <Text
          style={{
            fontSize: 28,
            fontWeight: "800",
            color: isDarkMode ? "#F1F5F9" : "#0F172A",
            letterSpacing: -0.5,
          }}
        >
          Transactions
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: isDarkMode ? "#7C8CA0" : "#94A3B8",
            marginTop: 2,
          }}
        >
          View your transaction history
        </Text>
      </View>

      {/* Search + Filter */}
      <View className="flex-row items-center mb-3 mt-1">
        {/* Search Bar */}
        <View className="flex-row items-center bg-surfaceDark border border-borderDark rounded-3xl px-4 py-2 flex-1 mr-2">
          <Ionicons
            name="search"
            size={16}
            color="#E5E7EB"
          />
          <TextInput
            placeholder="Search"
            placeholderTextColor="#E5E7EB"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2 text-lg text-textDark flex-1"
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity
          className="p-5 border border-borderDark rounded-full bg-surfaceDark"
          onPress={onFilterPress}
        >
          <Ionicons
            name="filter"
            size={20}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>
    </>
  );
};

export default TransactionsHeader;
