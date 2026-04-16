import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { parseAmount } from '../../utils/parseAmount';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteGoal, updateGoal } from '../../services/backendService';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Goal } from '../../types/types';
import { ColorPicker } from '../Shared/ColorPicker';

const GOAL_ICONS = [
  'flag-outline', 'trophy-outline', 'ribbon-outline', 'star-outline', 'rocket-outline', 'flash-outline',
  'home-outline', 'key-outline', 'bed-outline', 'business-outline', 'hammer-outline', 'construct-outline',
  'airplane-outline', 'car-outline', 'train-outline', 'bus-outline', 'bicycle-outline', 'boat-outline',
  'map-outline', 'globe-outline', 'compass-outline', 'trail-sign-outline', 'navigate-outline', 'location-outline',
  'wallet-outline', 'cash-outline', 'card-outline', 'diamond-outline', 'trending-up-outline', 'bar-chart-outline',
  'receipt-outline', 'pricetag-outline', 'gift-outline', 'bag-outline', 'cart-outline', 'storefront-outline',
  'heart-outline', 'people-outline', 'person-outline', 'baby-outline', 'paw-outline', 'rose-outline',
  'fitness-outline', 'barbell-outline', 'medkit-outline', 'leaf-outline', 'pulse-outline', 'nutrition-outline',
  'school-outline', 'book-outline', 'library-outline', 'laptop-outline', 'pencil-outline', 'briefcase-outline',
  'film-outline', 'musical-notes-outline', 'game-controller-outline', 'headset-outline', 'camera-outline', 'ticket-outline',
  'restaurant-outline', 'cafe-outline', 'wine-outline', 'beer-outline', 'pizza-outline', 'ice-cream-outline',
  'phone-portrait-outline', 'desktop-outline', 'hardware-chip-outline', 'tv-outline', 'color-palette-outline', 'brush-outline',
  'sunny-outline', 'moon-outline', 'snow-outline', 'umbrella-outline', 'flower-outline', 'planet-outline',
  'american-football-outline', 'basketball-outline', 'tennisball-outline', 'baseball-outline', 'football-outline', 'golf-outline',
  'shirt-outline', 'glasses-outline', 'watch-outline', 'newspaper-outline', 'calculator-outline', 'cube-outline',
];

const COLS = 2;

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
  const [selectedIcon, setSelectedIcon] = useState('flag-outline');
  const [selectedColor, setSelectedColor] = useState('#a78bfa');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.target_amount.toString());
      setSelectedIcon(goal.icon || 'flag-outline');
      setSelectedColor(goal.color || '#a78bfa');
    }
  }, [goal]);

  const canSubmit =
    name.trim().length > 0 &&
    parseAmount(targetAmount) > 0 &&
    !isSubmitting &&
    !isDeleting;

  const hasChanges =
    goal &&
    (name.trim() !== goal.name ||
      parseAmount(targetAmount) !== goal.target_amount ||
      selectedIcon !== (goal.icon || 'flag-outline') ||
      selectedColor !== (goal.color || '#a78bfa'));

  const handleSubmit = async () => {
    if (!canSubmit || !goal || !hasChanges) return;

    setIsSubmitting(true);
    try {
      const updates = {
        name: name.trim(),
        target_amount: parseAmount(targetAmount),
        icon: selectedIcon,
        color: selectedColor,
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
      setSelectedIcon(goal.icon || 'flag-outline');
      setSelectedColor(goal.color || '#a78bfa');
    }
    onClose();
  };

  if (!goal) return null;

  const accentColor = selectedColor || goal.color || '#a78bfa';
  const progress =
    goal.target_amount > 0
      ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
      : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <SafeAreaView className="flex-1 bg-backgroundDark" edges={['top']}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View className="flex-row items-center justify-between px-2 mt-4 mb-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={handleClose}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className="text-textDark text-2xl font-semibold">Edit Goal</Text>
              <Text className="text-secondaryDark">Update your savings target</Text>
            </View>
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            {/* Live Preview Card */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }} className="mx-2 mt-4 mb-5">
              <View className="rounded-3xl p-8 items-center justify-center border bg-surfaceDark border-borderDark">
                <View className="w-28 h-28 rounded-2xl items-center justify-center mb-5" style={{ backgroundColor: accentColor }}>
                  <Ionicons name={selectedIcon as any} size={56} color="#FFFFFF" />
                </View>
                <Text className="text-textDark text-2xl font-bold text-center" numberOfLines={1}>
                  {name || 'Goal Name'}
                </Text>
                <Text className="text-secondaryDark text-sm mt-2">Editing existing goal</Text>
              </View>
            </Animated.View>

            {/* Current Progress */}
            <View className="bg-surfaceDark rounded-xl p-4 mb-4 border border-borderDark">
              <View className="flex-row justify-between mb-2">
                <Text className="text-secondaryDark text-sm">Current Progress</Text>
                <Text className="font-semibold" style={{ color: accentColor }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${progress}%`,
                    backgroundColor: accentColor,
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
                className="px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark text-white"
              />
            </View>

            {/* Target Amount */}
            <View className="mb-4">
              <Text className="text-secondaryDark text-sm mb-2">Target Amount</Text>
              <View className="flex-row items-center px-4 py-3 rounded-xl bg-surfaceDark border border-borderDark">
                <Text className="text-white/70 text-lg mr-2" style={{ lineHeight: 18 }}>{currencySymbol}</Text>
                <TextInput
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="0"
                  placeholderTextColor="#64748B"
                  keyboardType="decimal-pad"
                  className="flex-1 text-lg text-white"
                  style={{ lineHeight: 18 }}
                />
              </View>
            </View>

            {/* Icon Picker */}
            <View className="mb-4">
              <Text className="text-secondaryDark text-sm mb-2">Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ flexDirection: 'row' }}>
                  {Array.from({ length: Math.ceil(GOAL_ICONS.length / COLS) }).map((_, colIndex) => (
                    <View key={colIndex} style={{ flexDirection: 'column', marginRight: 8 }}>
                      {GOAL_ICONS.slice(colIndex * COLS, colIndex * COLS + COLS).map((icon) => {
                        const isSelected = selectedIcon === icon;
                        return (
                          <TouchableOpacity
                            key={icon}
                            onPress={() => { setSelectedIcon(icon); animateSelection(); }}
                            activeOpacity={0.7}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 8,
                              backgroundColor: isSelected ? accentColor : '#1F2937',
                              borderWidth: 1.5,
                              borderColor: isSelected ? accentColor : '#374151',
                            }}
                          >
                            <Ionicons
                              name={icon as any}
                              size={22}
                              color={isSelected ? '#FFFFFF' : '#6B7280'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Color Picker */}
            <View className="mb-6">
              <ColorPicker
                selectedColor={selectedColor}
                onColorSelect={(c) => { setSelectedColor(c); animateSelection(); }}
                isDarkMode
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity
                onPress={handleDelete}
                disabled={isDeleting || isSubmitting}
                activeOpacity={0.8}
                className="flex-1 rounded-xl py-3 items-center bg-accentRed border border-accentRed"
              >
                <Text className="text-white font-bold text-lg">
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSubmit || !hasChanges}
                activeOpacity={0.8}
                className={`flex-1 rounded-xl py-3 items-center border ${
                  canSubmit && hasChanges ? 'bg-accentTeal border-accentTeal' : 'bg-gray400 border-gray400'
                }`}
              >
                <Text className="text-white font-bold text-lg">
                  {isSubmitting ? 'Saving...' : 'Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
