import { CreditCard, Edit2, MoreVertical, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';

import { COLOR_MAP, ICON_MAP, TYPE_CONFIG } from '../../hooks/useAccountData';

interface AccountListItemProps {
  account: any;
  index: number;
  currencySymbol: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: (account: any) => void;
  onDelete: (id: number) => void;
}

export const AccountListItem = ({
  account, index, currencySymbol, isMenuOpen, onToggleMenu, onEdit, onDelete
}: AccountListItemProps) => {
  const config = TYPE_CONFIG[account.type.toLowerCase().trim()] || TYPE_CONFIG.checking;
  const IconComponent = ICON_MAP[config.icon] || CreditCard;
  const colorClass = COLOR_MAP[config.color] || 'bg-accentBlue';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      className="mb-2"
    >
      <View className="bg-surfaceDark border-borderDark rounded-2xl p-4 border">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className={`w-12 h-12 ${colorClass} rounded-xl items-center justify-center`}>
              <IconComponent color="#FFFFFF" size={24} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="font-medium text-textDark">{account.account_name}</Text>
              <Text className="text-sm capitalize mt-0.5 text-secondaryDark">{account.type}</Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center">
                <Text style={{ fontSize: 18, fontWeight: '500', color: account.balance < 0 ? '#EF4444' : '#FFFFFF' }}>
                  {currencySymbol}
                </Text>
                <AnimatedRollingNumber
                  value={Math.abs(account.balance)}
                  spinningAnimationConfig={{ duration: 600 }}
                  textStyle={{ fontSize: 18, fontWeight: '500', color: account.balance < 0 ? '#EF4444' : '#FFFFFF' }}
                  toFixed={2}
                />
              </View>
              {account.balance < 0 && <Text className="text-xs text-accentRed mt-0.5">Outstanding</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={onToggleMenu} className="w-8 h-8 items-center justify-center ml-2 active:opacity-70">
            <MoreVertical color="#9CA3AF" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {isMenuOpen && (
        <View className="bg-surfaceDark border-borderDark rounded-xl mt-2 border overflow-hidden">
          <AnimatedMenuRow
            onPress={() => onEdit(account)}
            icon={<Edit2 color="#D1D5DB" size={16} />}
            label="Edit"
            isLast={false}
          />
          <AnimatedMenuRow
            onPress={() => onDelete(account.id)}
            icon={<Trash2 color="#EF4444" size={16} />}
            label="Delete"
            labelColor="text-accentRed"
            isLast={true}
          />
        </View>
      )}
    </MotiView>
  );
};

const AnimatedMenuRow = ({
  onPress,
  icon,
  label,
  labelColor,
  isLast,
}: {
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  isLast: boolean;
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-4 flex-row items-center ${!isLast ? 'border-b border-borderDark' : ''}`}
    >
      {icon}
      <Text className={`text-sm ml-3 font-medium ${labelColor || 'text-textDark'}`}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};