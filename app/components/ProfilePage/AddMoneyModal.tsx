import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';

interface AddMoneyModalProps {
  visible: boolean;
  accountName?: string;
  amount: string;
  onChangeAmount: (text: string) => void;
  onCancel: () => void;
  onAdd: () => void;
}

const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  visible,
  accountName,
  amount,
  onChangeAmount,
  onCancel,
  onAdd,
}) => {
  const isDark = useColorScheme() === 'dark';

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
            Add Money to {accountName}
          </Text>

          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Amount to Add
          </Text>
          <TextInput
            value={amount}
            onChangeText={onChangeAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-6 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          <View className="flex-row justify-between">
            <TouchableOpacity
              className="flex-1 py-3 mr-2 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={onCancel}
            >
              <Text className="text-center text-textLight dark:text-textDark">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 ml-2 rounded-xl bg-accentTeal"
              onPress={onAdd}
            >
              <Text className="text-center text-textDark font-semibold">Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default AddMoneyModal;
