import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import React from 'react';
import { Modal, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface FormFieldsProps {
  isDarkMode: boolean;
  description: string;
  setDescription: (val: string) => void;
  selectedDate: Date;
  showDatePicker: boolean;
  setShowDatePicker: (val: boolean) => void;
  handleDateChange: (event: any, date?: Date) => void;
  handleSubmit: () => void;
  transactionType: 'expense' | 'income';
}

export const TransactionFormFields = ({
  isDarkMode,
  description,
  setDescription,
  selectedDate,
  showDatePicker,
  setShowDatePicker,
  handleDateChange,
  handleSubmit,
  transactionType,
}: FormFieldsProps) => {
  return (
    <>
      {/* Description */}
      <View className="mb-6">
        <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Grocery shopping"
          placeholderTextColor={isDarkMode ? "#475569" : "#9ca3af"}
          className={`w-full px-4 py-3 rounded-xl border ${
            isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
          }`}
        />
      </View>

      {/* Date Picker */}
      <View className="mb-6">
        <Text className={`text-sm mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Date</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className={`w-full px-4 py-3 rounded-xl flex-row items-center justify-between border ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-300'
          }`}
        >
          <Text className={isDarkMode ? 'text-white' : 'text-gray-900'}>{selectedDate.toLocaleDateString()}</Text>
          <Calendar size={20} color={isDarkMode ? '#94a3b8' : '#6b7280'} />
        </TouchableOpacity>

        {showDatePicker && (
          Platform.OS === 'ios' ? (
            <Modal visible={showDatePicker} transparent animationType="slide">
              <TouchableOpacity activeOpacity={1} onPress={() => setShowDatePicker(false)} className="flex-1 bg-black/50 justify-end">
                <View className={`${isDarkMode ? 'bg-slate-900' : 'bg-white'} rounded-t-3xl`}>
                  <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200">
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text className="text-blue-500">Cancel</Text></TouchableOpacity>
                    <Text className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Select Date</Text>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}><Text className="text-blue-500 font-semibold">Done</Text></TouchableOpacity>
                  </View>
                  <DateTimePicker value={selectedDate} mode="date" display="spinner" onChange={handleDateChange} maximumDate={new Date()} textColor={isDarkMode ? '#ffffff' : '#000000'} />
                </View>
              </TouchableOpacity>
            </Modal>
          ) : (
            <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
          )
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        className={`w-full py-4 rounded-xl items-center mb-6 ${transactionType === 'expense' ? 'bg-rose-500' : 'bg-emerald-500'}`}
      >
        <Text className="text-white font-semibold">Add {transactionType === 'expense' ? 'Expense' : 'Income'}</Text>
      </TouchableOpacity>
    </>
  );
};