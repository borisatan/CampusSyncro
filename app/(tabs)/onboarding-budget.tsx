import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface SetBudgetScreenProps {
  navigation: NavigationProp<RootStackParamList, 'SetBudget'>;
  route: RouteProp<RootStackParamList, 'SetBudget'>;
}

type RootStackParamList = {
  CategorySelection: undefined;
  SetBudget: {
    selectedCategories: string[];
    customCategories: string[];
  };
  AddAccounts: {
    selectedCategories: string[];
    customCategories: string[];
    monthlyBudget: number;
    usedHelpMeDecide: boolean;
    categoryBudgets?: { [key: string]: number };
  };
};

interface CategoryBudget {
  name: string;
  amount: number | null;
  percentage: number | null;
}

const SetBudgetScreen: React.FC<SetBudgetScreenProps> = ({ navigation, route }) => {
  const [showCustomAllocation, setShowCustomAllocation] = useState(false);
  const [totalBudget, setTotalBudget] = useState<number | null>(null);
  const [budgetText, setBudgetText] = useState<string>('');
  const [usedHelpMeDecide, setUsedHelpMeDecide] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');
  const [categoryBudgets, setCategoryBudgets] = useState<CategoryBudget[]>([]);
  const [allocationMode, setAllocationMode] = useState<'amount' | 'percentage'>('amount');

  const { selectedCategories = [], customCategories = [] } = route?.params || {};

  // Initialize category budgets when categories are loaded
  React.useEffect(() => {
    const allCategories = [...selectedCategories, ...customCategories];
    setCategoryBudgets(
      allCategories.map(category => ({
        name: category,
        amount: null,
        percentage: null
      }))
    );
  }, [selectedCategories, customCategories]);

  const formatCurrency = (text: string): string => {
    const numericValue: string = text.replace(/[^\d.]/g, '');
    const parts: string[] = numericValue.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    if (parts[1] && parts[1].length > 2) {
      return parts[0] + '.' + parts[1].substring(0, 2);
    }
    return numericValue;
  };

  const handleTotalBudgetChange = (text: string): void => {
    const formatted: string = formatCurrency(text);
    setBudgetText(formatted);
    
    const numericValue: number = parseFloat(formatted);
    
    if (formatted === '' || formatted === '.') {
      setTotalBudget(null);
      setValidationError('');
      return;
    }
    
    if (isNaN(numericValue)) {
      setValidationError('Please enter a valid number');
      setTotalBudget(null);
      return;
    }
    
    if (numericValue <= 0) {
      setValidationError('Budget must be greater than $0');
      setTotalBudget(null);
      return;
    }
    
    if (numericValue > 1000000) {
      setValidationError('Budget cannot exceed $1,000,000');
      setTotalBudget(null);
      return;
    }
    
    setValidationError('');
    setTotalBudget(numericValue);
  };

  const handleCategoryBudgetChange = (index: number, value: string): void => {
    const formatted = formatCurrency(value);
    const numericValue = parseFloat(formatted);
    
    setCategoryBudgets(prev => {
      const newBudgets = [...prev];
      if (allocationMode === 'amount') {
        newBudgets[index] = {
          ...newBudgets[index],
          amount: isNaN(numericValue) ? null : numericValue,
          percentage: totalBudget ? (numericValue / totalBudget) * 100 : null
        };
      } else {
        newBudgets[index] = {
          ...newBudgets[index],
          percentage: isNaN(numericValue) ? null : numericValue,
          amount: totalBudget ? (numericValue / 100) * totalBudget : null
        };
      }
      return newBudgets;
    });
  };

  const handleHelpMeDecide = (): void => {
    setUsedHelpMeDecide(true);
    Alert.alert(
      'Help Me Decide',
      'This feature will be available soon! It will help you determine an appropriate budget based on your income and expenses.',
      [{ text: 'OK' }]
    );
  };

  const handleNext = (): void => {
    if (totalBudget !== null) {
      const categoryBudgetMap = categoryBudgets.reduce((acc, curr) => ({
        ...acc,
        [curr.name]: curr.amount || 0
      }), {});

      navigation.navigate('AddAccounts', {
        selectedCategories,
        customCategories,
        monthlyBudget: totalBudget,
        usedHelpMeDecide,
        categoryBudgets: categoryBudgetMap
      });
    }
  };

  const handleBack = (): void => {
    if (showCustomAllocation) {
      setShowCustomAllocation(false);
    } else {
      navigation.goBack();
    }
  };

  const renderInitialOptions = () => (
    <View className="flex-1 px-6">
      <TouchableOpacity
        className="bg-[#2A9D8F] py-6 px-6 rounded-xl mb-4"
        onPress={() => setShowCustomAllocation(true)}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-white font-semibold text-xl mb-1">
              Custom Allocation
            </Text>
            <Text className="text-white/80 text-base">
              Set specific amounts for each category
            </Text>
          </View>
          <Ionicons name="calculator-outline" size={32} color="white" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className="bg-[#E9C46A] py-6 px-6 rounded-xl"
        onPress={handleHelpMeDecide}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-[#212121] font-semibold text-xl mb-1">
              Help Me Decide
            </Text>
            <Text className="text-[#212121]/80 text-base">
              Get personalized budget recommendations
            </Text>
          </View>
          <Ionicons name="bulb-outline" size={32} color="#212121" />
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderCustomAllocation = () => (
    <ScrollView className="flex-1 px-6">
      <View className="mb-6">
        <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-3">
          Total Monthly Budget
        </Text>
        <View className="relative">
          <TextInput
            className={`bg-[#FFFFFF] dark:bg-[#1E1E1E] border ${
              validationError
                ? 'border-[#E53935] dark:border-[#EF5350]'
                : 'border-[#E0E0E0] dark:border-[#2C2C2C]'
            } rounded-xl px-4 py-4 text-lg text-[#212121] dark:text-[#FFFFFF] pl-8`}
            placeholder="0.00"
            placeholderTextColor="#9E9E9E"
            value={budgetText}
            onChangeText={handleTotalBudgetChange}
            keyboardType="numeric"
          />
          <Text className="absolute left-4 top-4 text-lg text-[#212121] dark:text-[#FFFFFF]">
            $
          </Text>
        </View>
        {validationError ? (
          <Text className="text-[#E53935] dark:text-[#EF5350] text-sm mt-2">
            {validationError}
          </Text>
        ) : null}
      </View>

      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF]">
            Category Allocation
          </Text>
          <View className="flex-row bg-[#E0E0E0] dark:bg-[#2C2C2C] rounded-lg p-1">
            <TouchableOpacity
              className={`px-3 py-1 rounded-md ${
                allocationMode === 'amount' ? 'bg-white dark:bg-[#1E1E1E]' : ''
              }`}
              onPress={() => setAllocationMode('amount')}
            >
              <Text className={`text-sm ${
                allocationMode === 'amount'
                  ? 'text-[#2A9D8F] font-medium'
                  : 'text-[#5F6368] dark:text-[#BBBBBB]'
              }`}>
                Amount
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`px-3 py-1 rounded-md ${
                allocationMode === 'percentage' ? 'bg-white dark:bg-[#1E1E1E]' : ''
              }`}
              onPress={() => setAllocationMode('percentage')}
            >
              <Text className={`text-sm ${
                allocationMode === 'percentage'
                  ? 'text-[#2A9D8F] font-medium'
                  : 'text-[#5F6368] dark:text-[#BBBBBB]'
              }`}>
                Percentage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {categoryBudgets.map((category, index) => (
          <View key={category.name} className="mb-4">
            <Text className="text-sm font-medium text-[#212121] dark:text-[#FFFFFF] mb-2">
              {category.name}
            </Text>
            <View className="relative">
              <TextInput
                className="bg-[#FFFFFF] dark:bg-[#1E1E1E] border border-[#E0E0E0] dark:border-[#2C2C2C] rounded-xl px-4 py-3 text-[#212121] dark:text-[#FFFFFF] pl-8"
                placeholder={allocationMode === 'amount' ? "0.00" : "0"}
                placeholderTextColor="#9E9E9E"
                value={allocationMode === 'amount' 
                  ? category.amount?.toString() || ''
                  : category.percentage?.toString() || ''
                }
                onChangeText={(text) => handleCategoryBudgetChange(index, text)}
                keyboardType="numeric"
              />
              <Text className="absolute left-4 top-3 text-[#212121] dark:text-[#FFFFFF]">
                {allocationMode === 'amount' ? '$' : '%'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FAFAFA] dark:bg-[#282A36]">
      <View className="px-6 pt-4 pb-6">
        <Text className="text-sm font-medium text-[#5F6368] dark:text-[#BBBBBB] mb-2">
          Step 2 of 3
        </Text>
        <Text className="text-2xl font-bold text-[#212121] dark:text-[#FFFFFF] mb-2">
          {showCustomAllocation ? 'Custom Budget Allocation' : 'Set Your Budget'}
        </Text>
        <Text className="text-base text-[#5F6368] dark:text-[#BBBBBB]">
          {showCustomAllocation 
            ? 'Allocate your budget across different categories'
            : 'Choose how you want to set up your budget'
          }
        </Text>
      </View>

      {showCustomAllocation ? renderCustomAllocation() : renderInitialOptions()}

      <View className="px-6 pb-6 pt-4 border-t border-[#E0E0E0] dark:border-[#2C2C2C]">
        <View className="flex-row gap-4">
          <TouchableOpacity
            className="flex-1 bg-[#E0E0E0] dark:bg-[#2C2C2C] py-4 rounded-xl"
            onPress={handleBack}
          >
            <Text className="text-[#212121] dark:text-[#FFFFFF] font-semibold text-base text-center">
              Back
            </Text>
          </TouchableOpacity>
          
          {showCustomAllocation && (
            <TouchableOpacity
              className={`flex-1 py-4 rounded-xl ${
                totalBudget
                  ? 'bg-[#2A9D8F]'
                  : 'bg-[#E0E0E0] dark:bg-[#2C2C2C]'
              }`}
              onPress={handleNext}
              disabled={!totalBudget}
            >
              <Text
                className={`text-center font-semibold text-base ${
                  totalBudget
                    ? 'text-white'
                    : 'text-[#9E9E9E] dark:text-[#777777]'
                }`}
              >
                Next
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SetBudgetScreen;