import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

type AccountSelectorProps = {
  accountsList: string[];
  filterAccounts: string[];
  setFilterAccounts: (accounts: string[]) => void;
  isDarkMode: boolean;
};


const AccountSelector: React.FC<AccountSelectorProps> = ({ accountsList, filterAccounts, setFilterAccounts, isDarkMode }) => {
  return (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-3">
        <Text className={`text-base font-semibold ${isDarkMode ? "text-textDark" : "text-textLight"}`}>
          Select account(s)
        </Text>
        <TouchableOpacity
          onPress={() => setFilterAccounts(filterAccounts.length === accountsList.length ? [] : [...accountsList])}
        >
          <Text className="text-sm font-semibold text-accentTeal">
            {filterAccounts.length === accountsList.length ? "Deselect All" : "Select All"}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {accountsList.map((account) => {
          const isSelected = filterAccounts.includes(account);
          return (
            <TouchableOpacity
              key={account}
              onPress={() =>
                setFilterAccounts(isSelected ? filterAccounts.filter(a => a !== account) : [...filterAccounts, account])
              }
              className={`px-6 py-2 mr-3 mb-4 rounded-full ${
                isSelected ? "bg-accentTeal" : isDarkMode ? "bg-surfaceDark border border-borderDark" : "bg-background border border-borderLight"
              }`}
            >
              <Text className={`${isSelected ? "text-textDark font-semibold" : isDarkMode ? "text-textDark" : "text-textLight"}`}>
                {account}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default AccountSelector;
