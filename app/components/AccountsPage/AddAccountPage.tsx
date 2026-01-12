import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft, CreditCard, PiggyBank, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SuccessModal } from '../Shared/SuccessModal';

interface Account {
  id?: number;
  name: string;
  type: string;
  balance: number;
}

const accountTypeIcons: { [key: string]: any } = {
  checking: CreditCard,
  savings: PiggyBank,
  credit: CreditCard,
  investment: TrendingUp,
};

// Use your existing Tailwind background classes
const accountTypeColors: { [key: string]: string } = {
  checking: 'bg-accentBlue',
  savings: 'bg-accentPurple',
  credit: 'bg-accentRed',
  investment: 'bg-accentTeal',
};

interface AddAccountProps {
  onBack: () => void;
  onSave: (newAccount: any) => void;
  currencySymbol: string;
  accountCount: number;
}

export default function AddAccountPage({ onBack, onSave, currencySymbol, accountCount }: AddAccountProps) {
  // Generate sort order options from 0 to accountCount (0-indexed internally, displayed as 1-indexed)
  const sortOrderOptions = Array.from({ length: accountCount + 1 }, (_, i) => i);
  const [name, setName] = useState('');
  const [type, setType] = useState('checking');
  const [balance, setBalance] = useState('0');
  const [sortOrder, setSortOrder] = useState(0);
  const [showSortOrderPicker, setShowSortOrderPicker] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Please enter an account name");
      return;
    }

    // 2. Defaulting Balance to 0 if empty or invalid
    const sanitizedBalance = balance.trim() === '' || isNaN(parseFloat(balance)) 
      ? 0 
      : parseFloat(balance);

    setShowSuccess(true);
    
    setTimeout(() => {
      onSave({
        name: name.trim(),
        type,
        balance: sanitizedBalance,
        sort_order: sortOrder,
      });
      setShowSuccess(false);
    }, 1900);
  };

  const Icon = accountTypeIcons[type] || CreditCard;
  const colorClass = accountTypeColors[type] || 'bg-accentBlue';

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-backgroundDark"
    >
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="flex-row items-center mb-8">
          <TouchableOpacity
            onPress={onBack}
            className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
          >
            <ArrowLeft color="#94A3B8" size={20} />
          </TouchableOpacity>
          <View>
            <Text className="text-2xl font-semibold text-textDark">Add Account</Text>
            <Text className="text-secondaryDark">Create account details</Text>
          </View>
        </View>

        {/* Account Preview Card (Solid Color) */}
        <View className={`${colorClass} rounded-3xl p-6 mb-8 shadow-lg`}>
          <View className="flex-row items-center mb-4">
            <View className="w-14 h-14 bg-white/20 rounded-2xl items-center justify-center mr-4">
              <Icon color="#FFFFFF" size={28} />
            </View>
            <View>
              <Text className="text-white/70 text-sm font-medium">Preview</Text>
              <Text className="text-white text-xl font-bold">{name || 'Account Name'}</Text>
            </View>
          </View>
          <View className="flex-row items-baseline">
            <Text className="text-white text-3xl font-bold mr-2">
              {currencySymbol} {Math.abs(parseFloat(balance) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            {parseFloat(balance) < 0 && (
              <Text className="text-white/80 text-sm">Outstanding</Text>
            )}
          </View>
        </View>

        {/* Form */}
        <View className="space-y-6">
          <View className="mb-6">
            <Text className="text-sm text-secondaryDark mb-2 font-medium">Account Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Checking"
              placeholderTextColor="#475569"
              className="w-full px-4 py-4 bg-surfaceDark border border-borderDark rounded-2xl text-textDark text-base"
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm text-secondaryDark mb-3 font-medium">Account Type</Text>
            <View className="flex-row flex-wrap gap-3">
              {['checking', 'savings', 'credit', 'investment'].map((item) => {
                const TypeIcon = accountTypeIcons[item];
                const isActive = type === item;
                const isInvestment = item === 'investment'; // Check for investment

                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => !isInvestment && setType(item)} // Prevent selection if investment
                    disabled={isInvestment} // Disable the button
                    style={{ width: '47%' }}
                    className={`p-4 rounded-2xl border-2 items-center justify-center mb-1 ${
                      isInvestment 
                        ? 'border-dashed border-slate-800 bg-slate-900/50 opacity-60' // Grayed out style
                        : isActive 
                          ? 'border-accentBlue bg-accentBlue/10' 
                          : 'border-borderDark bg-surfaceDark'
                    }`}
                  >
                    <TypeIcon 
                      color={isInvestment ? '#475569' : isActive ? '#3B82F6' : '#94A3B8'} 
                      size={24} 
                    />
                    {!isInvestment && <Text className={`capitalize font-medium mt-1 ${
                      isInvestment ? 'text-slate-500' : isActive ? 'text-textDark' : 'text-secondaryDark'
                    }`}>
                      {item}
                    </Text>}
                    {isInvestment && (
                      <Text className="text-[10px] text-accentTeal font-bold uppercase tracking-tighter">
                        Coming Soon
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View className="mb-6">
            <Text className="text-sm text-secondaryDark mb-2 font-medium">Current Balance</Text>
            <View className="relative flex-row items-center bg-surfaceDark border border-borderDark rounded-2xl px-4">
              <Text className="text-xl text-secondaryDark mr-2">{currencySymbol}</Text>
              <TextInput
                keyboardType="numeric"
                value={balance}
                onChangeText={setBalance}
                placeholder="0.00"
                placeholderTextColor="#475569"
                className="flex-1 py-4 text-textDark text-xl"
              />
            </View>
            <Text className="text-xs text-secondaryDark mt-2 italic">
              Use negative values for credit card balances
            </Text>
          </View>

          <View className="mb-6">
            <Text className="text-sm text-secondaryDark mb-2 font-medium">Display Order</Text>
            <TouchableOpacity
              onPress={() => setShowSortOrderPicker(!showSortOrderPicker)}
              activeOpacity={0.7}
              className="flex-row items-center justify-between bg-surfaceDark border border-borderDark rounded-2xl px-4 py-4"
            >
              <Text className="text-textDark text-base">Position {sortOrder + 1}</Text>
              <Ionicons
                name={showSortOrderPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color="#94A3B8"
              />
            </TouchableOpacity>

            {showSortOrderPicker && (
              <View className="mt-2 rounded-xl overflow-hidden border bg-surfaceDark border-borderDark">
                <ScrollView className="max-h-60" nestedScrollEnabled={true}>
                  {sortOrderOptions.map((option, index) => (
                    <AnimatedSortOrderRow
                      key={option}
                      option={option}
                      index={index}
                      isSelected={sortOrder === option}
                      onSelect={(val) => {
                        setSortOrder(val);
                        setShowSortOrderPicker(false);
                      }}
                      isLast={index === sortOrderOptions.length - 1}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            <Text className="text-xs text-secondaryDark mt-2 italic">
              Lower numbers appear first in the account list
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 pt-6 pb-20">
            <TouchableOpacity
              onPress={onBack}
              className="flex-1 py-4 bg-surfaceDark border border-borderDark rounded-2xl items-center mr-2"
            >
              <Text className="text-secondaryDark text-base font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-4 bg-accentBlue rounded-2xl items-center"
            >
              <Text className="text-white text-base font-bold">Add Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal Overlay */}
      <SuccessModal visible={showSuccess} text="Account Added!" />
    </KeyboardAvoidingView>
  );
}

const AnimatedSortOrderRow = ({
  option,
  index,
  isSelected,
  onSelect,
  isLast,
}: {
  option: number;
  index: number;
  isSelected: boolean;
  onSelect: (val: number) => void;
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
        onPress={() => onSelect(option)}
        className={`px-4 py-4 flex-row items-center justify-between ${
          !isLast ? 'border-b border-borderDark' : ''
        } ${isSelected ? 'bg-backgroundDark' : ''}`}
      >
        <Text className={`font-medium ${isSelected ? 'text-textDark' : 'text-secondaryDark'}`}>
          Position {option + 1}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#B2A4FF" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};