import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AccountOption } from '../../types/types';

interface AccountSelectorProps {
  accountOptions: AccountOption[];
  selectedAccount: string;
  onSelectAccount: (accountName: string) => void;
}

const AccountSelector: React.FC<AccountSelectorProps> = ({ accountOptions, selectedAccount, onSelectAccount }) => {
  const { isDarkMode } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="max-h-13 rounded-2xl mb-3"
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 5 }}
    >
      {accountOptions.map((account) => (
        <TouchableOpacity
          key={account.id}
          className={`px-4 py-2 rounded-2xl mr-2 ${
            selectedAccount === account.account_name
              ? isDarkMode ? 'bg-accentTeal' : 'bg-backgroundDark' 
              : isDarkMode ? "bg-inputDark border border-borderDark" : "bg-background border border-borderLight"
          }`}
          onPress={() => onSelectAccount(account.account_name)}
        >
          <Text
            className={`text-md ${
              selectedAccount === account.account_name
                ? isDarkMode ? 'text-textDark font-medium' : 'text-textLight font-medium' 
                : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
            }`}
          >
            {account.account_name}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export default AccountSelector;
