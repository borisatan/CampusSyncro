import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { createGoal } from '../../services/backendService';
import { Account } from '../../types/types';

interface CreateGoalModalProps {
  visible: boolean;
  accounts: Account[];
  currencySymbol: string;
  onClose: () => void;
  onGoalCreated: () => void;
}

export function CreateGoalModal({
  visible,
  accounts,
  currencySymbol,
  onClose,
  onGoalCreated,
}: CreateGoalModalProps) {
  const { userId } = useAuth();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter to only savings and investment accounts
  const savingsAccounts = accounts.filter(
    (acc) => acc.type === 'savings' || acc.type === 'investment'
  );

  const canSubmit =
    name.trim().length > 0 &&
    parseFloat(targetAmount) > 0 &&
    selectedAccountId !== null &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit || !userId) return;

    setIsSubmitting(true);
    try {
      await createGoal({
        user_id: userId,
        account_id: selectedAccountId!,
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
      });

      // Reset form
      setName('');
      setTargetAmount('');
      setSelectedAccountId(null);

      onGoalCreated();
      onClose();
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert('Error', 'Failed to create goal. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setTargetAmount('');
    setSelectedAccountId(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        />
        <View className="bg-surfaceDark rounded-t-3xl p-6 border-t border-borderDark max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center bg-purple-500/20 mr-3">
                <Ionicons name="flag-outline" size={20} color="#a78bfa" />
              </View>
              <Text className="text-white text-lg font-semibold">New Savings Goal</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Goal Name */}
            <View className="mb-4">
              <Text className="text-secondaryDark text-sm mb-2">Goal Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g., Vacation Fund, Emergency Savings"
                placeholderTextColor="#64748B"
                className="px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark text-white"
              />
            </View>

            {/* Target Amount */}
            <View className="mb-4">
              <Text className="text-secondaryDark text-sm mb-2">Target Amount</Text>
              <View className="flex-row items-center px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark">
                <Text className="text-white/70 text-lg mr-2">{currencySymbol}</Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  className="flex-1 text-lg text-white"
                />
              </View>
            </View>

            {/* Account Selector */}
            <View className="mb-6">
              <Text className="text-secondaryDark text-sm mb-2">Savings Account</Text>
              {savingsAccounts.length === 0 ? (
                <View className="px-4 py-3 rounded-xl bg-backgroundDark border border-borderDark">
                  <Text className="text-secondaryDark">
                    No savings or investment accounts found. Create one first.
                  </Text>
                </View>
              ) : (
                <View className="bg-backgroundDark rounded-xl border border-borderDark overflow-hidden">
                  {savingsAccounts.map((account) => {
                    const isSelected = selectedAccountId === account.id;
                    return (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() => setSelectedAccountId(account.id)}
                        className={`flex-row items-center justify-between px-4 py-3 border-b border-borderDark ${
                          isSelected ? 'bg-accentBlue/10' : ''
                        }`}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name={account.type === 'investment' ? 'trending-up' : 'wallet-outline'}
                            size={20}
                            color={isSelected ? '#3B82F6' : '#64748B'}
                          />
                          <Text className={`ml-3 ${isSelected ? 'text-accentBlue' : 'text-white'}`}>
                            {account.account_name}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit}
              className={`py-4 rounded-xl items-center ${
                canSubmit ? 'bg-accentBlue' : 'bg-gray-600'
              }`}
            >
              <Text className={`font-semibold text-base ${canSubmit ? 'text-white' : 'text-gray-400'}`}>
                {isSubmitting ? 'Creating...' : 'Create Goal'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
