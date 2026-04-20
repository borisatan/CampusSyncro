import { Ionicons } from '@expo/vector-icons';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
import { ColorPicker } from '../Shared/ColorPicker';
import { useTheme } from '../../context/ThemeContext';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { deleteCategory, getUserId, saveCategory } from '../../services/backendService';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useCategoriesStore } from '../../store/useCategoriesStore';

const availableIcons = [
  'restaurant-outline', 'bus-outline', 'film-outline', 'flash-outline', 'cart-outline', 'medkit-outline', 'school-outline',
  'wallet-outline', 'home-outline', 'shield-checkmark-outline', 'airplane-outline', 'person-outline',
  'gift-outline', 'cafe-outline', 'car-outline', 'bicycle-outline', 'train-outline', 'subway-outline',
  'basketball-outline', 'football-outline', 'tennisball-outline', 'fitness-outline', 'barbell-outline',
  'book-outline', 'library-outline', 'newspaper-outline', 'pencil-outline', 'calculator-outline',
  'card-outline', 'cash-outline', 'pricetag-outline', 'pricetags-outline', 'receipt-outline',
  'shirt-outline', 'bag-outline', 'glasses-outline', 'watch-outline', 'diamond-outline',
  'wine-outline', 'beer-outline', 'pizza-outline', 'ice-cream-outline', 'reorder-three-outline',
  'musical-notes-outline',
];

const DEFAULT_CATEGORY_COLOR = '#3B82F6';

interface CategoryEditorModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId?: string;
  initialName?: string;
  initialIcon?: string;
  initialColor?: string;
}

export const CategoryEditorModal: React.FC<CategoryEditorModalProps> = ({
  visible,
  onClose,
  categoryId,
  initialName = '',
  initialIcon,
  initialColor,
}) => {
  const { isDarkMode } = useTheme();
  const { refreshAll } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);

  const [categoryName, setCategoryName] = useState(initialName);
  const [selectedIcon, setSelectedIcon] = useState(initialIcon || availableIcons[0]);
  const [selectedColor, setSelectedColor] = useState(initialColor || DEFAULT_CATEGORY_COLOR);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);

  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (!visible) return;
    setCategoryName(initialName);
    setSelectedIcon(initialIcon || availableIcons[0]);
    setSelectedColor(initialColor || DEFAULT_CATEGORY_COLOR);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Name Required', 'Please give your category a name to continue');
      return;
    }
    try {
      setIsProcessing(true);
      const userId = await getUserId();
      if (!userId) throw new Error('User not authenticated');
      await saveCategory(userId, { category_name: categoryName.trim(), icon: selectedIcon, color: selectedColor }, categoryId);
      await loadCategories();
      await refreshAll();
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save category');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Category?',
      'This category will be removed from all your transactions. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              const userId = await getUserId();
              if (!userId) throw new Error('User not authenticated');
              if (!categoryId) throw new Error('Category ID not found');
              await deleteCategory(categoryId, userId);
              await loadCategories();
              await loadAccounts();
              await refreshAll();
              onClose();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete category');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView edges={['top']} className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

        <View className="flex-row items-center justify-between px-4 mb-4 mt-4">
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-4"
            >
              <ArrowLeft color="#94A3B8" size={20} />
            </TouchableOpacity>
            <View>
              <Text className={`text-2xl font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
                {categoryId ? 'Edit Category' : 'Create Category'}
              </Text>
              <Text className="text-secondaryDark">
                {categoryId ? 'Update category details' : 'Customize your category'}
              </Text>
            </View>
          </View>
          <View className="w-10" />
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
          <ScrollView
            contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
            className="flex-1"
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }} className="mx-2 mt-4">
              <View className={`rounded-3xl p-8 items-center justify-center border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight'}`}>
                <View className="w-28 h-28 rounded-2xl items-center justify-center mb-5" style={{ backgroundColor: selectedColor }}>
                  <Ionicons name={selectedIcon as any} size={56} color="#FFFFFF" />
                </View>
                <Text className={`text-2xl font-bold text-center ${isDarkMode ? 'text-textDark' : 'text-textLight'}`} numberOfLines={1}>
                  {categoryName || 'Category Name'}
                </Text>
                <Text className={`text-sm mt-2 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  {categoryId ? 'Editing existing category' : 'New category preview'}
                </Text>
              </View>
            </Animated.View>

            <View className="mx-2 mt-5">
              <View className="flex-row items-center justify-between mb-3">
                <Text className={`text-sm font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>Category Name</Text>
                <Text className={`text-xs ${categoryName.length > 0 ? 'text-accentTeal' : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
                  {categoryName.length}/30
                </Text>
              </View>
              <View className={`rounded-2xl border ${focusedInput ? 'border-accentBlue' : isDarkMode ? 'border-borderDark bg-inputDark' : 'border-borderLight bg-white'}`}>
                <TextInput
                  value={categoryName}
                  onChangeText={(text) => setCategoryName(text.slice(0, 30))}
                  placeholder="e.g., Groceries, Rent, Entertainment"
                  placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
                  onFocus={() => setFocusedInput(true)}
                  onBlur={() => setFocusedInput(false)}
                  className={`px-5 py-4 text-lg font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
                  style={{ lineHeight: 18 }}
                  maxLength={30}
                />
              </View>
            </View>

            <View className="mt-5">
              <Text className={`px-2 mb-3 text-sm font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>Choose Icon</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 8 }}>
                {Array.from({ length: Math.ceil(availableIcons.length / 2) }).map((_, colIndex) => (
                  <View key={`icon-col-${colIndex}`} className="flex-col mr-3">
                    {availableIcons.slice(colIndex * 2, colIndex * 2 + 2).map((icon) => (
                      <TouchableOpacity
                        key={icon}
                        onPress={() => { setSelectedIcon(icon); animateSelection(); }}
                        activeOpacity={0.7}
                        className="w-16 h-16 rounded-xl items-center justify-center mb-3"
                        style={{
                          backgroundColor: selectedIcon === icon ? selectedColor : (isDarkMode ? '#1F2937' : '#F3F4F6'),
                          borderWidth: 1,
                          borderColor: selectedIcon === icon ? selectedColor : (isDarkMode ? '#374151' : '#E5E7EB'),
                        }}
                      >
                        <Ionicons name={icon as any} size={28} color={selectedIcon === icon ? '#FFFFFF' : (isDarkMode ? '#9CA3AF' : '#4B5563')} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>

            <View className="mt-5 px-2">
              <ColorPicker selectedColor={selectedColor} onColorSelect={(color) => { setSelectedColor(color); animateSelection(); }} isDarkMode={isDarkMode} />
            </View>

            <View className="px-2 mt-6 flex-row" style={{ gap: 8 }}>
              {categoryId && (
                <TouchableOpacity onPress={handleDelete} disabled={isProcessing} activeOpacity={0.8} className="flex-1 rounded-xl py-3 items-center bg-accentRed border border-borderDark">
                  <Text className="text-white font-bold text-lg">Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={handleSave}
                disabled={isProcessing || !categoryName.trim()}
                activeOpacity={0.8}
                className={`flex-1 rounded-xl py-3 items-center border ${isProcessing || !categoryName.trim() ? 'bg-gray400 border-gray400' : 'bg-accentTeal border-borderDark'}`}
              >
                {isProcessing ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">{categoryId ? 'Update' : 'Create'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

      </SafeAreaView>
    </Modal>
  );
};
