import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../../context/ThemeContext';
import { deleteCategory, getUserId, saveCategory } from '../../services/backendService';
import { SuccessModal } from '../Shared/SuccessModal';
import { ColorPicker } from '../Shared/ColorPicker';

import { useDataRefresh } from '../../context/DataRefreshContext';
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
];

// Default color for new categories
const DEFAULT_CATEGORY_COLOR = '#3B82F6';

export default function CategoryEditor() {
  const { isDarkMode } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const categoryId = params.id;

  const [categoryName, setCategoryName] = useState((params.name as string) || '');
  const [selectedIcon, setSelectedIcon] = useState((params.icon as string) || availableIcons[0]);
  const [selectedColor, setSelectedColor] = useState((params.color as string) || DEFAULT_CATEGORY_COLOR);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedInput, setFocusedInput] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const iconRefs = useRef<any[]>([]);
  const iconScrollX = useRef(new Animated.Value(0)).current;

  const { refreshAll } = useDataRefresh();
  const loadCategories = useCategoriesStore((state) => state.loadCategories);
  const loadAccounts = useAccountsStore((state) => state.loadAccounts);
  
  // Animation values
  const scaleAnim = useState(new Animated.Value(1))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const iconListener = iconScrollX.addListener(({ value }) => {
      iconRefs.current.forEach((ref) => {
        ref?.scrollToOffset({ offset: value, animated: false });
      });
    });

    return () => {
      iconScrollX.removeListener(iconListener);
    };
  }, []);

  useEffect(() => {
    if (params.category_name) setCategoryName(params.category_name as string);
    if (params.icon) setSelectedIcon(params.icon as string);
    if (params.color) setSelectedColor(params.color as string);
    
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [params.category_name, params.icon, params.color]);

  const animateSelection = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
    animateSelection();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    animateSelection();
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      Alert.alert("Name Required", "Please give your category a name to continue");
      return;
    }

    try {
      setIsProcessing(true);
      const userId = await getUserId();
      if (!userId) throw new Error("User not authenticated");

      await saveCategory(
        userId,
        {
          category_name: categoryName.trim(),
          icon: selectedIcon,
          color: selectedColor,
        },
        categoryId ? Number(categoryId) : undefined
      );

      // 3. TRIGGER REFRESHES HERE
      // Load fresh categories into Zustand store
      await loadCategories(); 
      // Refresh Dashboard, Transaction List, etc. via Context
      await refreshAll(); 

      setShowSuccess(true);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to save category");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Category?",
      "This category will be removed from all your transactions. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setIsProcessing(true);
              const userId = await getUserId();
              if (userId && categoryId) {
                await deleteCategory(Number(categoryId), userId);
                
                await loadCategories(); // Update the grid
                await loadAccounts();   // Balance might change if transactions were deleted
                await refreshAll();     // Update dashboard and list
                
                router.back();
              }
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete category");
            } finally {
              setIsProcessing(false);
            }
          } 
        }
      ]
    );
  };

  return (
    <SafeAreaView className={isDarkMode ? "flex-1 bg-backgroundDark" : "flex-1 bg-background"}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View className={`px-4 py-3 flex-row items-center justify-between border-b ${isDarkMode ? 'border-borderDark' : 'border-borderLight'}`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          className={`w-11 h-11 rounded-xl items-center justify-center border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight'}`}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
        
        <View className="flex-1 items-center">
          <Text className={`text-xl font-bold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
            {categoryId ? 'Edit Category' : 'Create Category'}
          </Text>
          <Text className={`text-xs mt-0.5 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
            Customize your category
          </Text>
        </View>
        
        <View className="w-11" />
      </View>

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Live Preview Card - Always at top */}
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}
          className="mx-4 mt-4"
        >
          <View 
            className={`rounded-3xl p-8 items-center justify-center border ${isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight'}`}
          >
            <View 
              className="w-28 h-28 rounded-2xl items-center justify-center mb-5" 
              style={{ backgroundColor: selectedColor }}
            >
              <Ionicons name={selectedIcon as any} size={56} color="#FFFFFF" />
            </View>
            <Text 
              className={`text-2xl font-bold text-center ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
              numberOfLines={1}
            >
              {categoryName || 'Category Name'}
            </Text>
            <Text className={`text-sm mt-2 ${isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              {categoryId ? 'Editing existing category' : 'New category preview'}
            </Text>
          </View>
        </Animated.View>

        {/* Category Name Input */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-sm font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>
              Category Name
            </Text>
            <Text className={`text-xs ${categoryName.length > 0 ? 'text-accentTeal' : isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}`}>
              {categoryName.length}/30
            </Text>
          </View>
          <View 
            className={`rounded-2xl border ${
              focusedInput 
                ? 'border-accentBlue' 
                : isDarkMode ? 'border-borderDark bg-inputDark' : 'border-borderLight bg-white'
            }`}
          >
            <TextInput
              value={categoryName}
              onChangeText={(text) => setCategoryName(text.slice(0, 30))}
              placeholder="e.g., Groceries, Rent, Entertainment"
              placeholderTextColor={isDarkMode ? "#AAAAAA" : "#888888"}
              onFocus={() => setFocusedInput(true)}
              onBlur={() => setFocusedInput(false)}
              className={`px-5 py-4 text-lg font-medium ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}
              maxLength={30}
            />
          </View>
        </View>
{/* --- FIXED ICON PICKER: No more lag --- */}
<View className="mt-5">
          <Text className={`px-4 mb-3 text-sm font-semibold ${isDarkMode ? 'text-textDark' : 'text-textLight'}`}>Choose Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {Array.from({ length: Math.ceil(availableIcons.length / 2) }).map((_, colIndex) => (
              <View key={`icon-col-${colIndex}`} className="flex-col mr-3">
                {availableIcons.slice(colIndex * 2, colIndex * 2 + 2).map((icon) => (
                  <TouchableOpacity
                    key={icon}
                    onPress={() => handleIconSelect(icon)}
                    activeOpacity={0.7}
                    className="w-16 h-16 rounded-xl items-center justify-center mb-3"
                    style={{
                      backgroundColor: selectedIcon === icon ? selectedColor : (isDarkMode ? '#1F2937' : '#F3F4F6'),
                      borderWidth: 1,
                      borderColor: selectedIcon === icon ? selectedColor : (isDarkMode ? '#374151' : '#E5E7EB')
                    }}
                  >
                    <Ionicons name={icon as any} size={28} color={selectedIcon === icon ? "#FFFFFF" : (isDarkMode ? "#9CA3AF" : "#4B5563")} />
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Color Picker */}
        <View className="mt-5 px-4">
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={handleColorSelect}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Action Buttons */}
        <View className="px-4 mt-6 flex-row" style={{ gap: 8 }}>
          {categoryId && (
            <TouchableOpacity
              onPress={handleDelete}
              disabled={isProcessing}
              activeOpacity={0.8}
              className="flex-1 rounded-xl py-4 items-center bg-accentRed border border-accentRed"
            >
              <Text className="text-white font-bold text-lg">
                Delete
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleSave}
            disabled={isProcessing || !categoryName.trim()}
            activeOpacity={0.8}
            className={`flex-1 rounded-xl py-4 items-center border ${
              isProcessing || !categoryName.trim()
                ? 'bg-gray-400 border-gray-400'
                : 'bg-accentTeal border-accentTeal'
            }`}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                {categoryId ? 'Update' : 'Create'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccess}
        text={categoryId ? 'Category Updated!' : 'Category Created!'}
        onDismiss={() => {
          setShowSuccess(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}