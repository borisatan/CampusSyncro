import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CategoryModal } from '../components/category-modal';
import { useTheme } from '../context/ThemeContext'; // Assuming similar theme context
import { Category, CategoryName } from "../types/types";

// Category icons using Ionicons
const categoryIcons: Record<CategoryName, string> = {
  Transport: 'bus',
  Food: 'restaurant',
  Education: 'school',
  Savings: 'wallet',
  Travel: 'airplane',
  Health: 'heart',
  Care: 'flask',
  Home: 'home',
  Personal: 'person',
  Clothes: 'shirt',
  Medical: 'medkit',
};

// Define types for our data
interface AccountOption {
  id: number;
  name: string;
  selected: boolean;
}

// Dummy account data
const accountOptions: AccountOption[] = [
  { id: 1, name: 'Credit Card', selected: true },
  { id: 2, name: 'Cash', selected: false },
  { id: 3, name: 'Savings', selected: false },
  { id: 4, name: 'Euro Cash', selected: false },
];

// Initial categories data
const initialCategories: Category[] = [
  { id: 1, name: 'Transport', icon: 'bus', color: '#F9C74F' },
  { id: 2, name: 'Food', icon: 'restaurant', color: '#F94144' },
  { id: 3, name: 'Education', icon: 'school', color: '#8338EC' },
  { id: 4, name: 'Savings', icon: 'wallet', color: '#3A86FF' },
  { id: 5, name: 'Travel', icon: 'airplane', color: '#3A86FF' },
  { id: 6, name: 'Health', icon: 'heart', color: '#FF66C4' },
  { id: 7, name: 'Care', icon: 'flask', color: '#8338EC' },
  { id: 8, name: 'Home', icon: 'home', color: '#F8961E' },
  { id: 9, name: 'Personal', icon: 'person', color: '#3A86FF' },
  { id: 10, name: 'Clothes', icon: 'shirt', color: '#577590' },
  { id: 11, name: 'Medical', icon: 'medkit', color: '#90BE6D' },
];

const TransactionAdder = () => {
  const { isDarkMode } = useTheme(); // Using the theme context as in your example
  const [selectedAccount, setSelectedAccount] = useState('Credit Card');
  const [inputModalVisible, setInputModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const amountInputRef = useRef<TextInput>(null);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setCategories(categories.filter(c => c.id !== category.id));
          }
        }
      ]
    );
  };

  const handleEditCategory = (category: Category) => {
    if (isEditMode) {
      setEditingCategory(category);
      setShowCategoryModal(true);
    } else {
      setSelectedCategory(category);
      setInputModalVisible(true);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
    if (!isEditMode) {
      setEditingCategory(null);
    }
  };

  const handleConfirm = () => {
    if (amount) {
      console.log({
        account: selectedAccount,
        category: selectedCategory,
        amount,
        currency,
        description,
      });

      // Reset modal state
      setInputModalVisible(false);
      setAmount('');
      setDescription('');
    }
  };

  const renderCategories = () => {
    const rows = [];
    for (let i = 0; i < categories.length; i += 3) {
      const rowItems = categories.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-start mb-5">
          {rowItems.map((category) => (
            <View key={category.id} className="w-[32%] items-center mr-[1%]">
              <TouchableOpacity
                className="w-20 h-20 rounded-3xl justify-center items-center mb-2 relative"
                style={{ backgroundColor: category.color }}
                onPress={() => handleEditCategory(category)}
              >
                <Ionicons name={categoryIcons[category.name] as any} size={24} color="white" />
                {isEditMode && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(category)}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 items-center justify-center"
                  >
                    <Ionicons name="remove" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <Text className={isDarkMode ? "text-gray-200 text-xs" : "text-gray-800 text-xs"}>
                {category.name}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <SafeAreaView className={isDarkMode ? "flex-1 bg-[#0A0F1F]" : "flex-1 bg-white"}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View className="flex-row justify-between items-center px-4 py-3">
        <TouchableOpacity className="p-2">
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text className={isDarkMode ? "text-base font-semibold text-white" : "text-base font-semibold text-black"}>
          Categories
        </Text>
        <TouchableOpacity 
          onPress={toggleEditMode}
          className={`px-3 py-1 rounded-lg w-16 items-center ${isEditMode ? 'bg-[#2A9D8F] dark:bg-[#2A9D8F]' : 'bg-[#2A9D8F]'}`}
        >
          <Text className={`text-base font-medium ${isEditMode ? 'text-white' : isDarkMode ? 'text-white' : 'text-black'}`}>
            {isEditMode ? 'Done' : 'Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Account options */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="max-h-12"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 5,
        }}
      >
        {accountOptions.map((account) => (
          <TouchableOpacity
            key={account.id}
            className={`px-4 py-2 rounded-2xl mr-2 ${
              selectedAccount === account.name
                ? isDarkMode ? 'bg-blue-600' : 'bg-[#E4E4E4]' 
                : isDarkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-300"
            }`}
            onPress={() => setSelectedAccount(account.name)}
          >
            <Text
              className={`text-sm ${
                selectedAccount === account.name
                  ? isDarkMode ? 'text-white font-medium' : 'text-black font-medium' 
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
            >
              {account.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categories grid */}
      <ScrollView className="flex-1 px-4 pt-4">
        {renderCategories()}
      </ScrollView>

      <Modal
        visible={inputModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInputModalVisible(false)}
        onShow={() => {
          amountInputRef.current?.focus(); 
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
        >
          <View className="bg-white dark:bg-[#1E1E1E] p-5 rounded-t-3xl">
            <Text className="text-lg font-semibold text-center mb-4 text-black dark:text-white">
              Add transaction for {selectedCategory?.name}
            </Text>

            <TextInput
              ref={amountInputRef}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
              value={amount}
              onChangeText={setAmount}
              className="border dark:border-gray-600 border-gray-300 rounded-xl px-4 py-5 mb-3 text-black dark:text-white text-3xl font-semibold text-center"
            />

            <TextInput
              placeholder="Enter description (optional)"
              placeholderTextColor={isDarkMode ? "#aaa" : "#888"}
              value={description}
              maxLength={200}
              onChangeText={setDescription}
              className="border dark:border-gray-600 border-gray-300 rounded-xl p-3 mb-4 text-black dark:text-white text-center"
            />
            <Text className="text-right text-xs mb-3 text-gray-500 dark:text-gray-400">
              {description.length}/200
            </Text>

            <View className="flex-row justify-between">
              <TouchableOpacity
                className="flex-1 py-3 mr-2 rounded-xl border border-gray-400 dark:border-gray-600"
                onPress={() => {
                  setInputModalVisible(false); 
                  setAmount('');
                  setDescription('');}}
              >
                <Text className="text-center text-black dark:text-white">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 ml-2 rounded-xl bg-blue-600"
                onPress={handleConfirm}
              >
                <Text className="text-center text-white font-semibold">Enter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <CategoryModal
        visible={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onSubmit={(category) => {
          if (editingCategory) {
            // Update existing category
            const updatedCategories = categories.map((c) =>
              c.id === category.id ? category : c
            );
            setCategories(updatedCategories);
            setEditingCategory(null);
          } else {
            // Add new category
            setCategories([...categories, category]);
          }
          setShowCategoryModal(false);
        }}
        mode={editingCategory ? 'edit' : 'add'}
        category={editingCategory || undefined}
        existingCategories={categories.map(c => c.name)}
      />
    </SafeAreaView>
  );
};

export default TransactionAdder;
