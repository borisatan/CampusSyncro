import { RouteProp, useRoute } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { PageTour } from "../components/Shared/AppTour";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import FilterModal from "../components/TransactionListPage/FilterModal";
import TransactionsHeader from "../components/TransactionListPage/TransactionHeader";
import { TransactionListSkeleton } from "../components/TransactionListPage/TransactionListSkeleton";
import TransactionsList from "../components/TransactionListPage/TransactionsList";
import { useDataRefresh } from "../context/DataRefreshContext";
import { useTheme } from "../context/ThemeContext";
import { fetchAccountNames, fetchCategoryIcons, fetchFilteredTransactions, fetchTransactions } from "../services/backendService";
import { CategoryIconInfo, TimeFrame, Transaction } from "../types/types";
import { getDateRange } from "../utils/dateUtils";

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
  const router = useRouter();
  const { registerTransactionListRefresh, registerOptimisticDeleteTransaction, registerOptimisticUpdateTransaction } = useDataRefresh();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, CategoryIconInfo>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const route = useRoute<RouteProp<{ Transactions: { initialCategory?: string } }, "Transactions">>();
  
  const [transactionType, setTransactionType] = useState<'all' |'expense' | 'income'>('all');

  const { initialCategory, initialTimeFrame, initialOffset, t } = useLocalSearchParams<{ initialCategory?: string; initialTimeFrame?: string; initialOffset?: string; t?: string }>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [isFilterVisible, setIsFilterVisible] = useState(false);

  const [filterAccounts, setFilterAccounts] = useState<string[]>([]);
  const [accountsList, setAccountsList] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const LIMIT = 50;
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  // Track if we're using filtered mode (category from dashboard)
  const [isFilteredMode, setIsFilteredMode] = useState(false);

  // --- Load initial transactions (first page / refresh)
  const loadInitialTransactions = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    try {
      const [transactionsData, iconsData] = await Promise.all([
        fetchTransactions(LIMIT, 0),
        fetchCategoryIcons(),
      ]);

      setTransactions(transactionsData);
      setCategoryIcons(iconsData);
      setPage(1);
      setHasMore(transactionsData.length === LIMIT);

      if (transactionsData.length === 0) {
        console.log("No transactions found");
      }
    } catch (err) {
      console.error("Failed to load transactions:", err);
      setLoadError("Failed to load transactions. Please try again.");
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  // --- Load filtered transactions (for category + time period from dashboard)
  const loadFilteredTransactionsAsync = async (category: string, timeFrame: string, periodOffset: number = 0) => {
    console.log('Loading filtered transactions:', { category, timeFrame, periodOffset });
    setIsRefreshing(true);
    setLoadError(null);
    setIsInitialLoading(true);

    try {
      const { startDate, endDate } = getDateRange(timeFrame as TimeFrame, periodOffset);
      console.log('Date range:', { startDate, endDate });

      const [transactionsData, iconsData] = await Promise.all([
        fetchFilteredTransactions({
          category,
          startDate,
          endDate,
          limit: LIMIT,
          offset: 0,
        }),
        fetchCategoryIcons(),
      ]);

      console.log('Fetched transactions count:', transactionsData.length);
      setTransactions(transactionsData);
      setCategoryIcons(iconsData);
      setPage(1);
      setHasMore(transactionsData.length === LIMIT);

      if (transactionsData.length === 0) {
        console.warn('No transactions found for category:', category);
      }
    } catch (err) {
      console.error("Failed to load filtered transactions:", err);
      setLoadError("Failed to load transactions. Please try again.");
      setTransactions([]);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  // Set filters when navigating from dashboard with category
  useEffect(() => {
    if (initialCategory) {
      setFilterCategory(initialCategory);
      setSelectedCategories([initialCategory]);

      if (initialTimeFrame) {
        const periodOffset = initialOffset ? parseInt(initialOffset, 10) : 0;
        const { startDate, endDate } = getDateRange(initialTimeFrame as TimeFrame, periodOffset);
        setDateRange({
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        });
        setIsFilteredMode(true);
      } else {
        setIsFilteredMode(false);
      }
    } else {
      setFilterCategory(null);
      setSelectedCategories([]);
      setDateRange(null);
      setIsFilteredMode(false);
    }
  }, [initialCategory, initialTimeFrame, initialOffset, t]);

  // Load transactions - either filtered or all
  useEffect(() => {
    console.log('Navigation params received:', { initialCategory, initialTimeFrame, initialOffset, t });

    if (initialCategory && initialCategory.trim() !== '') {
      const periodOffset = initialOffset ? parseInt(initialOffset, 10) : 0;
      const timeFrameToUse = initialTimeFrame && initialTimeFrame.trim() !== '' ? initialTimeFrame : 'year';

      console.log('Loading filtered transactions with:', {
        category: initialCategory,
        timeFrame: timeFrameToUse,
        offset: periodOffset
      });

      loadFilteredTransactionsAsync(initialCategory, timeFrameToUse, periodOffset);
    } else {
      console.log('Loading all transactions');
      loadInitialTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory, initialTimeFrame, initialOffset, t]);

  // --- Load more transactions (next page)
  const loadMoreTransactions = async () => {
    if (!hasMore || isFetchingMore) return;

    setIsFetchingMore(true);
    try {
      let data: Transaction[];

      // If in filtered mode, continue fetching with the same filters
      if (isFilteredMode && initialCategory && initialTimeFrame) {
        const periodOffset = initialOffset ? parseInt(initialOffset, 10) : 0;
        const { startDate, endDate } = getDateRange(initialTimeFrame as TimeFrame, periodOffset);
        data = await fetchFilteredTransactions({
          category: initialCategory,
          startDate,
          endDate,
          limit: LIMIT,
          offset: page * LIMIT,
        });
      } else {
        data = await fetchTransactions(LIMIT, page * LIMIT);
      }

      if (data.length < LIMIT) setHasMore(false);

      setTransactions(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
    } catch (err) {
      console.error("Failed to fetch more transactions:", err);
    } finally {
      setIsFetchingMore(false);
    }
  };

  // Register refresh and optimistic update functions so they can be called from other screens
  useEffect(() => {
    registerTransactionListRefresh(loadInitialTransactions);
    registerOptimisticDeleteTransaction(handleDeleteTransaction);
    registerOptimisticUpdateTransaction(handleSaveTransaction);
  }, [registerTransactionListRefresh, registerOptimisticDeleteTransaction, registerOptimisticUpdateTransaction]);

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
    const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(tx.category_name) : true;
    const matchesAccount = filterAccounts.length > 0 ? filterAccounts.includes(tx.account_name) : true;
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.amount.toString().includes(searchQuery);

    const matchesDate = dateRange
      ? (() => {
          const txDate = new Date(tx.created_at);
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);

          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);

          return txDate >= startDate && txDate <= endDate;
        })()
      : true;

    const matchesType = transactionType === 'all'
      ? true
      : transactionType === 'income'
        ? tx.amount > 0
        : tx.amount < 0;

    return matchesCategory && matchesAccount && matchesSearch && matchesDate && matchesType;
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
    setSelectedCategories([]);
    setTransactionType('all');
    setIsFilterVisible(false);

    // If we were in filtered mode, exit and reload all transactions
    if (isFilteredMode) {
      setIsFilteredMode(false);
      loadInitialTransactions();
    }
  };

  const headerRef = useRef<View>(null);

  const handleEditTransaction = (transactionId: string) => {
    const tx = transactions.find(t => t.id === Number(transactionId));
    if (tx) {
      router.navigate({
        pathname: "/edit-transaction",
        params: { transaction: JSON.stringify(tx) }
      });
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
      <SafeAreaView className={`flex-1 ${isDarkMode ? 'bg-backgroundDark' : 'bg-background'}`} edges={['top']}>

        <View ref={headerRef} className="px-2">
          <TransactionsHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onFilterPress={() => setIsFilterVisible(true)}
          />
        </View>

        {/* Transactions list */}
        {isInitialLoading ? (
          <TransactionListSkeleton isDarkMode={isDarkMode} />
        ) : loadError ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className={`text-center text-base ${isDarkMode ? 'text-textDark' : 'text-text'}`}>
              {loadError}
            </Text>
          </View>
        ) : sections.length === 0 ? (
          <View className="flex-1 items-center justify-center p-4">
            <Text className={`text-center text-base ${isDarkMode ? 'text-textDark' : 'text-text'}`}>
              No transactions found
            </Text>
          </View>
        ) : (
          <TransactionsList
            sections={sections}
            categoryIcons={categoryIcons}
            onEndReached={loadMoreTransactions}
            isFetchingMore={isFetchingMore}
            onItemLongPress={handleEditTransaction}
          />
        )}

        {/* Filter Modal */}
        <FilterModal
          visible={isFilterVisible}
          onClose={() => setIsFilterVisible(false)}
          dateRange={dateRange}
          setDateRange={setDateRange}
          filterAccounts={filterAccounts}
          setFilterAccounts={setFilterAccounts}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          isDarkMode={isDarkMode}
          filterType={transactionType}
          setFilterType={setTransactionType}
          accountsList={accountsList}
          handleReset={handleResetFilters}
        />

        <PageTour
          pageId="transactions"
          title="Your transaction history"
          description="All your logged transactions appear here. Use the search bar or tap the filter icon to narrow down by category, account, or date."
          targetRef={headerRef}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default TransactionsScreen;