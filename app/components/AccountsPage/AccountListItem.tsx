import { CreditCard, Edit2, MoreVertical, Trash2 } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { Easing } from 'react-native-reanimated';
import { COLOR_MAP, ICON_MAP, TYPE_CONFIG } from '../../hooks/useAccountData';

interface AccountListItemProps {
  account: any;
  index: number;
  isDark: boolean;
  currencySymbol: string;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onEdit: (account: any) => void;
  onDelete: (id: number) => void;
}

export const AccountListItem = ({ 
  account, index, isDark, currencySymbol, isMenuOpen, onToggleMenu, onEdit, onDelete 
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
      <View className={`${isDark ? 'bg-surfaceDark border-borderDark' : 'bg-backgroundMuted border-borderLight'} rounded-2xl p-4 border`}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center flex-1">
            <View className={`w-12 h-12 ${colorClass} rounded-xl items-center justify-center`}>
              <IconComponent color="#FFFFFF" size={24} />
            </View>
            <View className="flex-1 ml-4">
              <Text className={`font-medium ${isDark ? 'text-textDark' : 'text-textLight'}`}>{account.account_name}</Text>
              <Text className={`text-sm capitalize mt-0.5 ${isDark ? 'text-secondaryDark' : 'text-secondaryLight'}`}>{account.type}</Text>
            </View>
            <View className="items-end">
              <View className="flex-row items-center">
                <Text style={{ fontSize: 18, fontWeight: '500', color: account.balance < 0 ? '#EF4444' : (isDark ? '#FFFFFF' : '#1F2937') }}>
                  {currencySymbol}
                </Text>
                <AnimatedRollingNumber
                  value={Math.abs(account.balance)}
                  spinningAnimationConfig={{ duration: 1200, easing: Easing.bounce }}
                  textStyle={{ fontSize: 18, fontWeight: '500', color: account.balance < 0 ? '#EF4444' : (isDark ? '#FFFFFF' : '#1F2937') }}
                  toFixed={2}
                />
              </View>
              {account.balance < 0 && <Text className="text-xs text-accentRed mt-0.5">Outstanding</Text>}
            </View>
          </View>
          <TouchableOpacity onPress={onToggleMenu} className="w-8 h-8 items-center justify-center ml-2 active:opacity-70">
            <MoreVertical color={isDark ? "#9CA3AF" : "#4B5563"} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {isMenuOpen && (
        <View className={`${isDark ? 'bg-surfaceDark border-borderDark' : 'bg-background border-borderLight'} rounded-xl mt-2 border overflow-hidden`}>
          <AnimatedMenuRow
            index={0}
            isDark={isDark}
            onPress={() => onEdit(account)}
            icon={<Edit2 color={isDark ? "#D1D5DB" : "#4B5563"} size={16} />}
            label="Edit"
            isLast={false}
          />
          <AnimatedMenuRow
            index={1}
            isDark={isDark}
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
  index,
  isDark,
  onPress,
  icon,
  label,
  labelColor,
  isLast,
}: {
  index: number;
  isDark: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  labelColor?: string;
  isLast: boolean;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
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
        onPress={onPress}
        className={`px-4 py-4 flex-row items-center ${
          !isLast
            ? isDark ? 'border-b border-borderDark' : 'border-b border-borderLight'
            : ''
        }`}
      >
        {icon}
        <Text className={`text-sm ml-3 font-medium ${labelColor || (isDark ? 'text-textDark' : 'text-textLight')}`}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};