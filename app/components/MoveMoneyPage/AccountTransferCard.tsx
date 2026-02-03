import { Ionicons } from '@expo/vector-icons';
import { CreditCard, PiggyBank, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Account } from '../../types/types';

const TYPE_CONFIG: { [key: string]: { icon: string; color: string } } = {
  checking: { icon: 'credit-card', color: 'blue' },
  savings: { icon: 'piggy-bank', color: 'purple' },
  investment: { icon: 'trending-up', color: 'teal' },
  investments: { icon: 'trending-up', color: 'teal' },
  credit: { icon: 'credit-card', color: 'red' },
};

const ICON_MAP: { [key: string]: any } = {
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
};

const COLOR_MAP: { [key: string]: string } = {
  blue: 'bg-accentBlue',
  teal: 'bg-accentTeal',
  red: 'bg-accentRed',
  purple: 'bg-accentPurple',
};

interface AccountTransferCardProps {
  account: Account | null;
  type: 'source' | 'destination';
  amount: number;
  currencySymbol: string;
  onPress: () => void;
  isDarkMode: boolean;
}

export const AccountTransferCard = ({
  account,
  type,
  amount,
  currencySymbol,
  onPress,
  isDarkMode,
}: AccountTransferCardProps) => {
  const isSource = type === 'source';
  const sign = isSource ? '-' : '+';
  const displayAmount = amount > 0 ? `${sign}${currencySymbol}${amount.toFixed(2)}` : `${sign}${currencySymbol}0`;

  if (!account) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={`rounded-2xl p-4 border-2 border-dashed ${
          isDarkMode ? 'border-borderDark bg-surfaceDark' : 'border-borderLight bg-gray-50'
        }`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
                isDarkMode ? 'bg-backgroundDark' : 'bg-gray-200'
              }`}
            >
              <Ionicons
                name="add"
                size={24}
                color={isDarkMode ? '#64748B' : '#9CA3AF'}
              />
            </View>
            <View>
              <Text
                className={`text-base font-medium ${
                  isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
                }`}
              >
                {isSource ? 'Select source account' : 'Select destination account'}
              </Text>
              <Text
                className={`text-sm ${
                  isDarkMode ? 'text-secondaryDark/60' : 'text-secondaryLight/60'
                }`}
              >
                Tap to choose
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-down"
            size={20}
            color={isDarkMode ? '#64748B' : '#9CA3AF'}
          />
        </View>
      </TouchableOpacity>
    );
  }

  const config = TYPE_CONFIG[account.type?.toLowerCase().trim()] || TYPE_CONFIG.checking;
  const IconComponent = ICON_MAP[config.icon] || CreditCard;
  const colorClass = COLOR_MAP[config.color] || 'bg-accentBlue';

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`rounded-2xl p-4 border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-gray-50 border-gray-200'}`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 ${colorClass} rounded-xl items-center justify-center mr-3`}>
            <IconComponent color="#FFFFFF" size={24} />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text
                className={`text-base font-semibold ${
                  isDarkMode ? 'text-textDark' : 'text-textLight'
                }`}
              >
                {account.account_name}
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color={isDarkMode ? '#64748B' : '#9CA3AF'}
                style={{ marginLeft: 4 }}
              />
            </View>
            <Text
              className={`text-sm ${
                isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
              }`}
            >
              Balance: {currencySymbol}{account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
        <Text
          className={`text-2xl font-bold ${
            isSource
              ? isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'
              : 'text-accentTeal'
          }`}
        >
          {displayAmount}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
