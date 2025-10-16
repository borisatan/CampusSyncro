import { RouteProp, useRoute } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import EditTransactionModal from "../components/AddTransactionPage/EditTransactionModal";
import FilterModal from "../components/TransactionListPage/FilterModal";
import TransactionsHeader from "../components/TransactionListPage/TransactionHeader";
import TransactionsList from "../components/TransactionListPage/TransactionsList";
import { useTheme } from "../context/ThemeContext";
import { fetchAccountNames, fetchCategoryIcons, fetchTransactions } from "../services/backendService";
import { CategoryIconInfo, Transaction } from "../types/types";

type RouteParams = {
  initialCategory?: string;
};

// Section type
type TransactionSection = {
  title: string;
  data: Transaction[];
};

type RootStackParamList = {
  Transactions: { category?: string };
};

type TransactionsScreenRouteProp = RouteProp<
  RootStackParamList,
  "Transactions"
>;

// Group transactions by date for SectionList
const groupTransactionsByDate = (
  transactions: Transaction[]
): TransactionSection[] => {
  const groups: Record<string, Transaction[]> = {};

  transactions.forEach((tx) => {
    const dateObj = new Date(tx.created_at);
    const date = dateObj.toISOString().split("T")[0];

    if (!groups[date]) groups[date] = [];
    groups[date].push(tx);
  });

  return Object.entries(groups)
    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
    .map(([title, data]) => ({ title, data }));
};

// Main screen
const TransactionsScreen: React.FC = () => {
  const { isDarkMode } = useTheme();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, CategoryIconInfo>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const route = useRoute<RouteProp<{ Transactions: { initialCategory?: string } }, "Transactions">>();

  const { initialCategory } = useLocalSearchParams<{ initialCategory?: string }>();
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);
  const [accountsList, setAccountsList] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const LIMIT = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  useEffect(() => {
    if (initialCategory) {
      setFilterCategory(initialCategory);
    } else {
      setFilterCategory(null);
    }
  }, [initialCategory]);

  // --- Load initial transactions (first page / refresh)
  const loadInitialTransactions = async () => {
    setIsRefreshing(true);
    try {
      const [transactionsData, iconsData] = await Promise.all([
        fetchTransactions(LIMIT, 0),
        fetchCategoryIcons(),
      ]);
      
      setTransactions(transactionsData);
      setCategoryIcons(iconsData);
      setPage(1);
      setHasMore(transactionsData.length === LIMIT);
    } catch (err) {
      console.error("Failed to load transactions:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // --- Load more transactions (next page)
  const loadMoreTransactions = async () => {
    if (!hasMore || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      const data = await fetchTransactions(LIMIT, page * LIMIT);

      if (data.length < LIMIT) setHasMore(false);

      setTransactions(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error("Failed to fetch more transactions:", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    loadInitialTransactions();
  }, []);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const names = await fetchAccountNames();
        setAccountsList(names.map((a: any) => a.account_name));
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    };
  
    loadAccounts();
  }, []);

  // Apply all filters
  const filteredTransactions = transactions.filter((tx) => {
    const matchesCategory = filterCategory ? tx.category_name === filterCategory : true;
    const matchesAccount = filterAccounts.length > 0 ? filterAccounts.includes(tx.account_name) : true;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);
    const matchesDate = dateRange
      ? new Date(tx.created_at) >= new Date(dateRange.start) &&
        new Date(tx.created_at) <= new Date(dateRange.end)
      : true;

    return matchesCategory && matchesAccount && matchesSearch && matchesDate;
  });

  const dedupeById = (transactions: Transaction[]) => {
    const map = new Map();
    for (const tx of transactions) {
      map.set(tx.id, tx);
    }
    return Array.from(map.values());
  };
  
  const sections: TransactionSection[] = groupTransactionsByDate(dedupeById(filteredTransactions));
  const handleResetFilters = () => {
    setDateRange(null);
    setFilterAccounts([]);
    setFilterCategory(null);
    setIsFilterVisible(false);
  };


  const handleEditTransaction = (transactionId: string) => {
    const tx = transactions.find(t => t.id === Number(transactionId));
    if (tx) {
      setSelectedTransaction(tx);
      setIsEditModalVisible(true);
    }
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions(prev => prev.filter(tx => tx.id !== id));
  };
  
  const handleSaveTransaction = (updatedTx: Transaction) => {
    setTransactions(prev =>
      prev.map(t => (t.id === updatedTx.id ? updatedTx : t))
    );
  };
  return (
    <SafeAreaProvider>
      <SafeAreaView className={isDarkMode ? "flex-1 bg-backgroundDark" : "flex-1 bg-background"}>

        <View className="px-4">
          <TransactionsHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterPress={() => setIsFilterVisible(true)}
          />
        </View>
      
        {/* Transactions list */}
        <TransactionsList
          sections={sections}
          categoryIcons={categoryIcons}
          refreshing={isRefreshing} 
          onRefresh={loadInitialTransactions} 
          onEndReached={loadMoreTransactions} 
          isFetchingMore={isFetchingMore}    
          onItemLongPress={handleEditTransaction}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterAccounts={filterAccounts}
          setFilterAccounts={setFilterAccounts}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          isDarkMode={isDarkMode}
          accountsList={accountsList}
          handleReset={handleResetFilters}
        />

        <EditTransactionModal
          visible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          accountsList={accountsList}
          transaction={selectedTransaction}
          onSave={handleSaveTransaction}
          onDelete={handleDeleteTransaction}
        />

      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default TransactionsScreen;
