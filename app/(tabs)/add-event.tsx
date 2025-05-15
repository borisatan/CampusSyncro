import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useTheme } from '../context/ThemeContext'; // Assuming similar theme context

// Define category name type for TypeScript
type CategoryName = 'Transport' | 'Food' | 'Education' | 'Savings' | 'Travel' | 
  'Health' | 'Care' | 'Home' | 'Personal' | 'Clothes' | 'Medical';

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

interface Category {
  id: number;
  name: CategoryName;
  icon: string;
  color: string;
}

// Dummy account data
const accountOptions: AccountOption[] = [
  { id: 1, name: 'Credit Card', selected: true },
  { id: 2, name: 'Cash', selected: false },
  { id: 3, name: 'Savings', selected: false },
  { id: 4, name: 'Euro Cash', selected: false },
];

// Dummy category data - arranged in rows of 3
const categories: Category[] = [
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
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [amount, setAmount] = useState('0');
  const [currency, setCurrency] = useState('USD');

  const handleCategoryPress = (category: Category) => {
    setSelectedCategory(category);
    setModalVisible(true);
  };

  const handleConfirm = () => {
    // Here you would handle the transaction data
    console.log({
      account: selectedAccount,
      category: selectedCategory,
      amount: amount,
      currency: currency,
    });
    setModalVisible(false);
  };

  const renderCategories = () => {
    const rows = [];
    for (let i = 0; i < categories.length; i += 3) {
      const rowItems = categories.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} className="flex-row justify-start mb-4">
          {rowItems.map((category) => (
            <TouchableOpacity
              key={category.id}
              className="w-[30%] items-center mr-[5%]"
              onPress={() => handleCategoryPress(category)}
            >
              <View 
                className="w-16 h-16 rounded-lg justify-center items-center mb-2" 
                style={{ backgroundColor: category.color }}
              >
                <Ionicons name={categoryIcons[category.name] as any} size={24} color="white" />
              </View>
              <Text className={isDarkMode ? "text-gray-200 text-xs" : "text-gray-800 text-xs"}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return rows;
  };

  return (
    <SafeAreaView className={isDarkMode ? "flex-1 bg-[#121212]" : "flex-1 bg-white"}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View className="flex-row justify-between items-center px-4 py-3">
        <TouchableOpacity className="p-2">
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? "white" : "black"} />
        </TouchableOpacity>
        <Text className={isDarkMode ? "text-base font-semibold text-white" : "text-base font-semibold text-black"}>
          Categories
        </Text>
        <TouchableOpacity>
          <Text className={isDarkMode ? "text-base font-medium text-white" : "text-base font-medium text-black"}>
            Edit
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
                : isDarkMode ? 'bg-[#252525]' : 'bg-gray-200'
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
      <View className="flex-1 px-4 pt-4">
        {renderCategories()}
      </View>

     
    </SafeAreaView>
  );
};

export default TransactionAdder;
