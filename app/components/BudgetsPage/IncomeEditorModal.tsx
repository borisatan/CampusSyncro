import React, { useState, useEffect } from 'react';
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X } from 'lucide-react-native';

interface IncomeEditorModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (useDynamic: boolean, manualIncome: number) => void;
  currentUseDynamic: boolean;
  currentManualIncome: number;
  currentDynamicIncome: number;
  currencySymbol: string;
  isDarkMode: boolean;
}

export const IncomeEditorModal: React.FC<IncomeEditorModalProps> = ({
  visible,
  onClose,
  onSave,
  currentUseDynamic,
  currentManualIncome,
  currentDynamicIncome,
  currencySymbol,
  isDarkMode,
}) => {
  const [useDynamicIncome, setUseDynamicIncome] = useState(currentUseDynamic);
  const [manualIncome, setManualIncome] = useState(currentManualIncome.toString());

  useEffect(() => {
    if (visible) {
      setUseDynamicIncome(currentUseDynamic);
      setManualIncome(currentManualIncome > 0 ? currentManualIncome.toString() : '');
    }
  }, [visible, currentUseDynamic, currentManualIncome]);

  const handleSave = () => {
    const income = parseFloat(manualIncome) || 0;
    onSave(useDynamicIncome, income);
    onClose();
  };

  const formatAmount = (amount: number): string => {
    return `${currencySymbol}${Math.abs(amount).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={onClose}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View
              className={`rounded-t-3xl ${
                isDarkMode ? 'bg-backgroundDark' : 'bg-white'
              }`}
            >
              {/* Header */}
              <View
                className={`flex-row items-center justify-between px-5 py-4 border-b ${
                  isDarkMode ? 'border-borderDark' : 'border-borderLight'
                }`}
              >
                <Text
                  className={`text-xl font-semibold ${
                    isDarkMode ? 'text-white' : 'text-black'
                  }`}
                >
                  Monthly Income
                </Text>
                <TouchableOpacity onPress={onClose} className="p-1">
                  <X size={24} color={isDarkMode ? '#9CA3AF' : '#6B7280'} />
                </TouchableOpacity>
              </View>

              <View className="px-5 py-6">
                {/* Income Source Toggle */}
                <View className="mb-6">
                  <Text
                    className={`text-sm mb-3 ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-600'
                    }`}
                  >
                    Income Source
                  </Text>

                  <View
                    className={`flex-row items-center justify-between p-4 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800 border-slate-700'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <View className="flex-1">
                      <Text
                        className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}
                      >
                        Use Dynamic Income
                      </Text>
                      <Text
                        className={`text-xs mt-1 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-500'
                        }`}
                      >
                        Calculate from Income transactions
                      </Text>
                    </View>
                    <Switch
                      value={useDynamicIncome}
                      onValueChange={setUseDynamicIncome}
                      trackColor={{ false: '#374151', true: '#2563EB' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Dynamic Income Display */}
                {useDynamicIncome && (
                  <View
                    className={`mb-6 p-4 rounded-xl border ${
                      isDarkMode
                        ? 'bg-slate-800/50 border-slate-700'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Current Month Income
                    </Text>
                    <Text
                      className={`text-2xl font-bold mt-1 ${
                        isDarkMode ? 'text-white' : 'text-black'
                      }`}
                    >
                      {formatAmount(currentDynamicIncome)}
                    </Text>
                    <Text
                      className={`text-xs mt-2 italic ${
                        isDarkMode ? 'text-slate-500' : 'text-gray-400'
                      }`}
                    >
                      Based on transactions in the Income category this month
                    </Text>
                  </View>
                )}

                {/* Manual Income Input */}
                {!useDynamicIncome && (
                  <View className="mb-6">
                    <Text
                      className={`text-sm mb-2 ${
                        isDarkMode ? 'text-slate-400' : 'text-gray-600'
                      }`}
                    >
                      Manual Income Amount
                    </Text>
                    <View
                      className={`flex-row items-center px-4 py-3 rounded-xl border ${
                        isDarkMode
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      <Text
                        className={`text-lg mr-2 ${
                          isDarkMode ? 'text-slate-400' : 'text-gray-500'
                        }`}
                      >
                        {currencySymbol}
                      </Text>
                      <TextInput
                        value={manualIncome}
                        onChangeText={setManualIncome}
                        placeholder="0"
                        placeholderTextColor={isDarkMode ? '#475569' : '#9ca3af'}
                        keyboardType="decimal-pad"
                        className={`flex-1 text-lg ${
                          isDarkMode ? 'text-white' : 'text-black'
                        }`}
                      />
                    </View>
                  </View>
                )}

                {/* Save Button */}
                <TouchableOpacity
                  onPress={handleSave}
                  className="w-full py-4 rounded-xl items-center bg-accentBlue"
                >
                  <Text className="text-white font-semibold text-base">
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
};
