import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useColorScheme
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { deleteTransaction, updateTransaction } from "../../services/backendService";
import { Transaction } from "../../types/types";

interface EditTransactionModalProps {
  visible: boolean;
  transaction: Transaction | null;
  accountsList: string[];
  onClose: () => void;
  onSave: (updatedTransaction: Transaction) => void;
  onDelete: (transactionId: number) => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  visible,
  accountsList,
  transaction,
  onClose,
  onDelete,
  onSave,
}) => {
  const isDark = useColorScheme() === "dark";

  const [description, setDescription] = useState("");
  const [accountName, setAccountName] = useState("");
  const [amount, setAmount] = useState("");
  
  const { userId, isLoading } = useAuth();

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAccountName(transaction.account_name);
      setAmount(transaction.amount.toString());
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = async () => {
    const updatedTransaction: Transaction = {
      ...transaction,
      description,
      account_name: accountName,
      amount: parseFloat(amount),
    };

    await updateTransaction(updatedTransaction.id, updatedTransaction.amount, updatedTransaction.description, updatedTransaction.account_name);
    onSave(updatedTransaction);
    onClose();
  };

  const handleDelete = async () => {
    await deleteTransaction(transaction.id, userId);
    onDelete(transaction.id)
    onClose();
  };

  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1" />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-end"
      >
        <View
          className={`${
            isDark ? "bg-surfaceDark" : "bg-background"
          } p-5 rounded-t-3xl border-t border-borderLight dark:border-borderDark`}
        >
          {/* Delete Icon on top-right */}
          <TouchableOpacity
            onPress={handleDelete}
            className="absolute -top-2 -right-0 bg-red-500 rounded-full w-8 h-8 items-center justify-center"

          >
            <Ionicons name="remove" size={18} color="white" />
          </TouchableOpacity>

          <Text className="text-lg font-semibold text-center mb-4 text-textLight dark:text-textDark">
            Edit Transaction
          </Text>

          {/* Account Selector */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text
                className={`text-base font-semibold ${
                  "text-textDark"
                }`}
              >
                Select Account
              </Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {accountsList.map((account) => {
                const isSelected = accountName === account;
                return (
                  <TouchableOpacity
                    key={account}
                    onPress={() => setAccountName(account)}
                    className={`px-6 py-2 mr-3 mb-4 rounded-full ${
                      isSelected
                        ? "bg-accentTeal"
                        : "bg-surfaceDark border border-borderDark"
                    }`}
                  >
                    <Text
                      className={`${
                        isSelected
                          ? "text-textDark font-semibold"
                          : "text-textDark"
                      }`}
                    >
                      {account}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Description */}
          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor={isDark ? "#AAAAAA" : "#888888"}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-4 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          {/* Amount */}
          <Text className="text-sm font-semibold mb-2 text-secondaryLight dark:text-secondaryDark">
            Amount
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            placeholder="Enter amount"
            placeholderTextColor={isDark ? "#AAAAAA" : "#888888"}
            className="border dark:border-borderDark border-borderLight rounded-xl px-4 py-4 mb-7 bg-background dark:bg-inputDark text-textLight dark:text-textDark"
          />

          {/* Buttons */}
          <View className="flex-row justify-between">
          <TouchableOpacity
              className="flex-1 py-3 mr-2 rounded-xl border border-borderLight dark:border-borderDark"
              onPress={onClose}
            >
              <Text className="text-center text-textLight dark:text-textDark">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 py-3 ml-2 rounded-xl bg-accentTeal"
              onPress={handleSave}
            >
              <Text className="text-center text-textDark font-semibold">
                Save
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default EditTransactionModal;
