import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AccountOption, Category } from '../../types/types';
import AccountSelector from './AccountSelector'; // <-- import here

interface TransactionModalProps {
  visible: boolean;
  onClose: () => void;
  category: Category | null;
  amount: string;
  setAmount: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  onConfirm: () => void;
  accountOptions: AccountOption[];
  selectedAccount: string;
  onSelectAccount: (accountName: string) => void;
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  visible,
  onClose,
  category,
  amount,
  setAmount,
  description,
  setDescription,
  onConfirm,
  accountOptions,
  selectedAccount,
  onSelectAccount
}) => {
  const { isDarkMode } = useTheme();
  const amountInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1 justify-end"
      >
        <View className="bg-background dark:bg-surfaceDark p-5 rounded-t-3xl">
          <Text className="text-lg font-semibold text-center mb-4 text-textLight dark:text-textDark">
            Add transaction for {category?.category_name}
          </Text>

          {/* --- Account Selector --- */}
          <AccountSelector
            accountOptions={accountOptions}
            selectedAccount={selectedAccount}
            onSelectAccount={onSelectAccount}
          />

          {/* --- Amount Input --- */}
          <View className="flex-row items-center border dark:border-borderDark border-borderLight rounded-xl px-4 py-5 mb-3 bg-background dark:bg-inputDark mt-3">
            <TextInput
              ref={amountInputRef}
              keyboardType="numeric"
              autoFocus
              placeholder="Enter amount"
              placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
              value={amount}
              onChangeText={setAmount}
              className="flex-1 text-textLight dark:text-textDark text-3xl text-center font-semibold bg-transparent"
            />
            <Text className="ml-2 text-3xl text-secondaryDark">€</Text>
          </View>

          {/* --- Description Input --- */}
          <TextInput
            placeholder="Enter description (optional)"
            placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
            value={description}
            maxLength={200}
            onChangeText={setDescription}
            className="border dark:border-borderDark border-borderLight rounded-xl p-3 mb-1 text-textLight dark:text-textDark text-center"
          />
          <Text className="text-right text-xs mb-3 text-secondaryLight dark:text-secondaryDark">
            {description.length}/200
          </Text>

          {/* --- Buttons --- */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 py-3 mr-2 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={() => {
                onClose();
                setAmount('');
                setDescription('');
              }}
            >
              <Text className="text-center text-textLight dark:text-textDark">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 ml-2 rounded-xl bg-accentTeal"
              onPress={onConfirm}
            >
              <Text className="text-center text-textDark font-semibold">Enter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default TransactionModal;
