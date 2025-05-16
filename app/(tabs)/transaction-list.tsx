import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    SafeAreaView,
    SectionList,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

//  Types
type Transaction = {
  id: string;
  date: string; // 'YYYY-MM-DD'
  name: string;
  amount: number;
  currency: string;
  time: string; // e.g. '14:30'
  category: string;
  account: string;
  logo: string;
};

type TransactionSection = {
  title: string;
  data: Transaction[];
};

type RootStackParamList = {
  Transactions: { category?: string };
};

type TransactionsScreenRouteProp = RouteProp<RootStackParamList, 'Transactions'>;

//  Mock data
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    date: '2024-10-03',
    name: 'Amazon',
    amount: -121.7,
    currency: 'лв',
    time: '20:35',
    category: 'Shopping',
    account: 'Visa',
    logo: '🛒',
  },
  {
    id: '2',
    date: '2024-10-03',
    name: 'Amazon EU',
    amount: -61.99,
    currency: '€',
    time: '20:36',
    category: 'Shopping',
    account: 'Revolut',
    logo: '🛒',
  },
  {
    id: '3',
    date: '2024-05-14',
    name: 'Alex K',
    amount: 125,
    currency: '€',
    time: '10:03',
    category: 'Salary',
    account: 'Bank',
    logo: 'AK',
  },
];

//  Utility to group by date
const groupTransactionsByDate = (transactions: Transaction[]): TransactionSection[] => {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    if (!groups[tx.date]) groups[tx.date] = [];
    groups[tx.date].push(tx);
  });

  return Object.entries(groups).map(([date, data]) => ({ title: date, data }));
};

//  Main Screen
const TransactionsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();
  const route = useRoute<TransactionsScreenRouteProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(route.params?.category || null);
  const [filterAccount, setFilterAccount] = useState<string | null>(null);

  const filteredTransactions = sampleTransactions.filter((tx) => {
    const matchesCategory = filterCategory ? tx.category === filterCategory : true;
    const matchesAccount = filterAccount ? tx.account === filterAccount : true;
    const matchesSearch =
      tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesAccount && matchesSearch;
  });

  const sections: TransactionSection[] = groupTransactionsByDate(filteredTransactions);

  return (
    <SafeAreaView className={isDarkMode ? 'flex-1 bg-[#1F2937]' : 'flex-1 bg-white'}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
            <>
            <View className="mb-4 mt-4 justify-center items-center">
                <Text className="text-2xl font-bold text-black dark:text-white">Transactions</Text>
            </View>

            <View className="flex-row items-center mb-4">
                <View className="flex-row items-center bg-[#F3F4F6] dark:bg-[#4B5563] rounded-full px-4 py-2 flex-1 mr-2">
                <Ionicons name="search" size={16} color={isDarkMode ? '#F3F4F6' : '#4B5563'} />
                <TextInput
                    placeholder="Search"
                    placeholderTextColor={isDarkMode ? '#F3F4F6' : '#4B5563'}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="ml-2 text-black dark:text-white flex-1"
                />
                </View>
                <TouchableOpacity className="p-2 rounded-full bg-[#E5E7EB] dark:bg-[#374151]">
                <Ionicons name="filter" size={20} color={isDarkMode ? '#FFFFFF' : '#1F2937'} />
                </TouchableOpacity>
            </View>
            </>
        }
        renderSectionHeader={({ section: { title } }) => (
            <Text className="text-xs text-[#9CA3AF] mb-2 mt-4">{new Date(title).toDateString()}</Text>
        )}
        renderItem={({ item }) => (
            <View className="bg-[#F3F4F6] dark:bg-[#374151] p-4 rounded-2xl mb-2 flex-row justify-between items-center">
            <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-pink-500 justify-center items-center mr-3">
                <Text className="text-white font-bold">{item.logo}</Text>
                </View>
                <View>
                <Text className="text-sm font-medium text-black dark:text-white">{item.name}</Text>
                <Text className="text-xs text-gray-500 dark:text-[#F3F4F6]">{item.time}</Text>
                </View>
            </View>
            <View className='items-end'>
                <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {item.amount > 0 ? '+' : ' '}
                    {item.amount} {item.currency}
                </Text>
                <Text className={`text-sm font-small  ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    {item.account}
                </Text>
            </View>
            
            </View>
        )}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
        />
    </SafeAreaView>
  );
};

export default TransactionsScreen;
