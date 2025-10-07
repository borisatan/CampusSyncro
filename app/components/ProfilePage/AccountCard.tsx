import { Plus } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Account } from '../../types/types';

interface AccountCardProps {
  account: Account;
  onPress: (account: Account) => void;
  onAddPress: (account: Account) => void;
  formatBalance: (balance: number) => string;
}

const AccountCard: React.FC<AccountCardProps> = ({
  account,
  onPress,
  onAddPress,
  formatBalance,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <View
      className={`${isDark ? 'bg-surfaceDark' : 'bg-background'} rounded-xl p-5 mb-3 shadow-sm flex-row justify-between items-center`}
    >
      {/* Left side — tap to edit */}
      <TouchableOpacity
        onPress={() => onPress(account)}
        activeOpacity={0.7}
        className="flex-1"
      >
        <Text className={`text-lg font-semibold ${isDark ? 'text-textDark' : 'text-textLight'} mb-1`}>
          {account.account_name}
        </Text>
        <Text className={`text-2xl font-bold ${account.balance < 0 ? 'text-accentRed' : 'text-accentTeal'}`}>
          {formatBalance(account.balance)}
        </Text>
      </TouchableOpacity>

      {/* Right side — plus icon */}
      <TouchableOpacity
        onPress={() => onAddPress(account)}
        activeOpacity={0.7}
        className={`ml-4 w-10 h-10 rounded-full border items-center justify-center ${isDark ? 'border-borderDark' : 'border-borderLight'}`}
      >
        <Plus size={20} color={isDark ? '#fff' : '#000'} />
      </TouchableOpacity>
    </View>
  );
};

export default AccountCard;
