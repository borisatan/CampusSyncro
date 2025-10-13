// components/ProfilePage/AddAccountModal.tsx

import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface AddAccountModalProps {
  visible: boolean;
  onCancel: () => void;
  onSave: (name: string, balance: number) => void;
}

const AddAccountModal: React.FC<AddAccountModalProps> = ({ visible, onCancel, onSave }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const { isDarkMode: isDark } = useTheme();

  const handleSave = () => {
    const parsedBalance = parseFloat(balance) || 0;
    if (!name.trim()) return; // prevent empty name
    onSave(name, parsedBalance);
    setName('');
    setBalance('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1 justify-end"
      >
        <View
          className={`${isDark ? 'bg-surfaceDark' : 'bg-background'} p-5 rounded-t-3xl border-t border-borderLight dark:border-borderDark`}
        >
          <Text className="text-lg font-semibold text-center mb-4 text-textLight dark:text-textDark">
            Add New Account
          </Text>

          {/* Account Name */}
          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Account Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Enter account name"
            placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-4 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          {/* Initial Balance */}
          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Initial Balance
          </Text>
          <TextInput
            value={balance}
            onChangeText={setBalance}
            keyboardType="numeric"
            placeholder="Enter balance"
            placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-6 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          {/* Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 py-3 mr-2 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={onCancel}
            >
              <Text className="text-center text-textLight dark:text-textDark">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 ml-2 rounded-xl bg-accentTeal"
              onPress={handleSave}
            >
              <Text className="text-center text-textDark font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddAccountModal;
