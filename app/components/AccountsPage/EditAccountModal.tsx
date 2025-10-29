import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme,
} from 'react-native';

interface EditAccountModalProps {
  visible: boolean;
  name: string;
  balance: string;
  onChangeName: (text: string) => void;
  onChangeBalance: (text: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

const EditAccountModal: React.FC<EditAccountModalProps> = ({
  visible,
  name,
  balance,
  onChangeName,
  onChangeBalance,
  onCancel,
  onSave,
}) => {
  const isDark = useColorScheme() === 'dark';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>

      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1" />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        className="flex-1 justify-end"
      >
        <View
          className={`${isDark ? 'bg-surfaceDark' : 'bg-background'} p-5 rounded-t-3xl border-t border-borderLight dark:border-borderDark`}
        >
          <Text className="text-lg font-semibold text-center mb-4 text-textLight dark:text-textDark">
            Edit Account
          </Text>

          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Account Name
          </Text>
          <TextInput
            value={name}
            onChangeText={onChangeName}
            placeholder="Enter account name"
            placeholderTextColor={isDark ? '#AAAAAA' : '#888888'}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-4 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Balance
          </Text>
          <TextInput
            value={balance}
            onChangeText={onChangeBalance}
            keyboardType="numeric"
            placeholder="Enter balance"
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
              onPress={onSave}
            >
              <Text className="text-center text-textDark font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditAccountModal;
