import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { Category } from '../../types/types';

interface BudgetAmountModalProps {
  visible: boolean;
  category: Category | null;
  currencySymbol: string;
  onSave: (categoryId: number, amount: number | null) => void;
  onClose: () => void;
}

export const BudgetAmountModal: React.FC<BudgetAmountModalProps> = ({
  visible,
  category,
  currencySymbol,
  onSave,
  onClose,
}) => {
  const [amountText, setAmountText] = useState('');

  useEffect(() => {
    if (category) {
      setAmountText(
        category.budget_amount != null && category.budget_amount > 0
          ? category.budget_amount.toString()
          : ''
      );
    }
  }, [category]);

  const handleSave = () => {
    if (!category) return;
    const amount = parseFloat(amountText);
    if (isNaN(amount) || amount <= 0) return;
    onSave(category.id, amount);
  };

  const handleClear = () => {
    if (!category) return;
    onSave(category.id, null);
  };

  if (!category) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={onClose}
        />
        <View className="bg-surfaceDark rounded-t-3xl p-6 border-t border-borderDark">
          {/* Category header */}
          <View className="flex-row items-center gap-3 mb-6">
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: category.color + '20' }}
            >
              <Ionicons
                name={category.icon as any}
                size={24}
                color={category.color}
              />
            </View>
            <View>
              <Text className="text-white text-lg font-semibold">
                {category.category_name}
              </Text>
              <Text className="text-secondaryDark text-sm">Set budget amount</Text>
            </View>
          </View>

          {/* Amount input */}
          <View className="flex-row items-center px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark mb-6">
            <Text className="text-white/70 text-xl mr-2">{currencySymbol}</Text>
            <TextInput
              value={amountText}
              onChangeText={setAmountText}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="decimal-pad"
              className="flex-1 text-xl text-white"
              autoFocus
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3">
            {category.budget_amount != null && category.budget_amount > 0 && (
              <TouchableOpacity
                onPress={handleClear}
                className="flex-1 py-3 rounded-xl items-center border border-rose-500/30 bg-rose-500/10"
                activeOpacity={0.7}
              >
                <Text className="text-rose-400 font-semibold text-base">
                  Clear Budget
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 py-3 rounded-xl items-center bg-accentBlue"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold text-base">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
