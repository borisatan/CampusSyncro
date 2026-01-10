import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react'; // Added useEffect and useRef
import { Animated, ScrollView, Text, TouchableOpacity, View } from 'react-native'; // Added Animated
import { Account } from '../../types/types';

interface AccountSelectorProps {
  isDarkMode: boolean;
  showAccountDropdown: boolean;
  setShowAccountDropdown: (val: boolean) => void;
  isLoadingAccounts: boolean;
  selectedAccount: string;
  setSelectedAccount: (name: string) => void;
  accountOptions: Account[];
  expenseAccountOptions: Account[];
  transactionType: 'expense' | 'income';
}

export const AccountSelector = ({
  isDarkMode,
  showAccountDropdown,
  setShowAccountDropdown,
  isLoadingAccounts,
  selectedAccount,
  setSelectedAccount,
  accountOptions,
  expenseAccountOptions,
  transactionType,
}: AccountSelectorProps) => {

  const currentOptions = transactionType === 'expense' 
    ? expenseAccountOptions 
    : accountOptions;


  return (
    <View className="mb-6">
      <Text className={`text-sm mb-2 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
        Account
      </Text>
      
      <TouchableOpacity
        onPress={() => setShowAccountDropdown(!showAccountDropdown)}
        activeOpacity={0.7}
        className={`w-full px-4 py-3 rounded-xl flex-row justify-between items-center border ${
          isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
        }`}
      >
        <Text className={isDarkMode ? 'text-textDark' : 'text-textLight'}>
          {isLoadingAccounts ? 'Loading accounts...' : selectedAccount}
        </Text>
        <Ionicons 
          name={showAccountDropdown ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={isDarkMode ? "#9CA3AF" : "#4B5563"} 
        />
      </TouchableOpacity>

      {showAccountDropdown && (
        <View className={`mt-2 rounded-xl overflow-hidden border ${
          isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'
        }`}>
          <ScrollView className="max-h-60" nestedScrollEnabled={true}>
            {currentOptions.map((account, index) => (
              <AnimatedAccountRow
                key={account.id}
                account={account}
                index={index}
                isDarkMode={isDarkMode}
                isSelected={selectedAccount === account.account_name}
                isVisible={showAccountDropdown} 
                onSelect={(name) => {
                  setSelectedAccount(name);
                  setShowAccountDropdown(false);
                }}
                isLast={index === accountOptions.length - 1}
              />
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const AnimatedAccountRow = ({ 
  account, 
  index, 
  isDarkMode, 
  isSelected, 
  onSelect, 
  isLast,
  isVisible 
}: { 
  account: Account, 
  index: number, 
  isDarkMode: boolean, 
  isSelected: boolean, 
  onSelect: (name: string) => void,
  isLast: boolean,
  isVisible: boolean
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // 2. Trigger animation immediately on mount (which happens when showAccountDropdown is true)
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50, // Stagger effect
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []); 

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <TouchableOpacity
        onPress={() => onSelect(account.account_name)}
        className={`px-4 py-4 flex-row items-center justify-between ${
          !isLast 
            ? isDarkMode ? 'border-b border-borderDark' : 'border-b border-borderLight' 
            : ''
        } ${isSelected ? (isDarkMode ? 'bg-backgroundDark' : 'bg-backgroundMuted') : ''}`}
      >
        <View>
          <Text className={`font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {account.account_name}
          </Text>
          <Text className={`text-xs ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
            €{account.balance.toFixed(2)}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={isDarkMode ? "#B2A4FF" : "#2563EB"} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};