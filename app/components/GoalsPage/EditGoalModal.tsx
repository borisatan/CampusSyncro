import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
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
import { deleteGoal, updateGoal } from '../../services/backendService';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Goal } from '../../types/types';

interface EditGoalModalProps {
  visible: boolean;
  goal: Goal | null;
  currencySymbol: string;
  onClose: () => void;
  onGoalUpdated: () => void;
}

export function EditGoalModal({
  visible,
  goal,
  currencySymbol,
  onClose,
  onGoalUpdated,
}: EditGoalModalProps) {
  const { updateGoalOptimistic, deleteGoalOptimistic } = useGoalsStore();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
    }
  }, [goal]);

  const canSubmit =
    name.trim().length > 0 &&
    parseFloat(targetAmount) > 0 &&
    !isSubmitting &&
    !isDeleting;

  const hasChanges =
    goal &&
    (name.trim() !== goal.name ||
      parseFloat(targetAmount) !== goal.target_amount);

  const handleSubmit = async () => {
    if (!canSubmit || !goal || !hasChanges) return;

    setIsSubmitting(true);
    try {
      const updates = {
        name: name.trim(),
        target_amount: parseFloat(targetAmount),
      };

      updateGoalOptimistic(goal.id, updates);
      await updateGoal(goal.id, updates);

      onGoalUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
      onGoalUpdated(); // Refresh to revert optimistic update
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!goal) return;

    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              deleteGoalOptimistic(goal.id);
              await deleteGoal(goal.id);

              onGoalUpdated();
              onClose();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
              onGoalUpdated(); // Refresh to revert optimistic update
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
    }
    onClose();
  };

  if (!goal) return null;

  const progress =
    goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;

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
              <View
                className="w-10 h-10 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: goal.color || '#a78bfa' }}
              >
                <Ionicons
                  name={(goal.icon as any) || 'flag-outline'}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text className="text-white text-lg font-semibold">Edit Goal</Text>
            </View>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Current Progress */}
            <View className="bg-backgroundDark rounded-xl p-4 mb-4">
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondaryDark text-sm">Current Progress</Text>
                <Text className="text-purple-400 font-semibold">
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: goal.color || '#a78bfa',
                  }}
                />
              </View>
              <Text className="text-white text-sm">
                {currencySymbol}
                {goal.current_amount.toLocaleString('en-US', {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}{' '}
                saved
              </Text>
            </View>

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
            <View className="mb-6">
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

            {/* Save Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!canSubmit || !hasChanges}
              className={`py-4 rounded-xl items-center mb-3 ${
                canSubmit && hasChanges ? 'bg-accentBlue' : 'bg-gray-600'
              }`}
            >
              <Text
                className={`font-semibold text-base ${
                  canSubmit && hasChanges ? 'text-white' : 'text-gray-400'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isDeleting || isSubmitting}
              className="py-4 rounded-xl items-center border border-red-500/30"
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={isDeleting ? '#6B7280' : '#EF4444'}
                />
                <Text
                  className={`font-semibold text-base ml-2 ${
                    isDeleting ? 'text-gray-500' : 'text-red-500'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Goal'}
                </Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
