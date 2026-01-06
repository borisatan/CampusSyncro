import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useCurrencyStore } from "../../store/useCurrencyStore";
import { CategoryIconInfo, Transaction } from "../../types/types";


type TransactionItemProps = {
  transaction: Transaction;
  categoryIcons: Record<string, CategoryIconInfo>;
};

const TransactionItem: React.FC<TransactionItemProps> = ({ transaction, categoryIcons }) => {
  const { isDarkMode } = useTheme();
  const { currencySymbol } = useCurrencyStore();
  const iconInfo = categoryIcons[transaction.category_name] || { icon: "help-circle", color: "#999" };
  // console.log(iconName)
  return (
    <View className="bg-backgroundMuted dark:bg-surfaceDark border border-borderLight dark:border-borderDark p-4 rounded-2xl mb-2 flex-row justify-between items-start">
      {/* Left side */}
      <View className="flex-row items-start flex-1 pr-3">
        <View
          className="w-10 h-10 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: iconInfo.color }}
        >
          <Ionicons name={iconInfo.icon as any} size={20} color="#FFFFFF" /> 
        </View>
        <View className="flex-1">
          <Text className="text-md font-medium text-textLight dark:text-textDark">
            {transaction.category_name}
          </Text>
          <Text
            className="text-sm text-secondaryLight dark:text-secondaryDark"
          >
            {transaction.description}
          </Text>
        </View>
      </View>

      {/* Right side */}
      <View className="items-end flex-shrink-0">
      <Text
        className={`text-md font-medium mb-1 ${
          transaction.amount < 0 ? "text-textDark" : "text-accentTeal"
        }`}
      >
        {transaction.amount < 0 ? `-${currencySymbol}` : currencySymbol}
        {Math.abs(transaction.amount)}
      </Text>
        <Text
          className={`text-md ${
            isDarkMode ? "text-textDark" : "text-textLight"
          }`}
        >
          {transaction.account_name}
        </Text>
      </View>
    </View>

  );
};

export default TransactionItem;
