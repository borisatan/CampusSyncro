import { ArrowLeft } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from './context/ThemeContext';
import { useRecurringTransactionsStore } from './store/useRecurringTransactionsStore';
import { RecurringTransaction, CategoryIconInfo } from './types/types';
import { useCurrencyStore } from './store/useCurrencyStore';
import { getCurrencySymbol } from './types/types';
import { fetchCategoryIcons } from './services/backendService';
import { getEffectiveNextRunDate } from './utils/dateUtils';
import { EditRecurringTransactionModal } from './components/RecurringTransactionsPage/EditRecurringTransactionModal';

function RecurringCard({
  item,
  onPress,
  isDarkMode,
  currencySymbol,
  categoryIcons,
}: {
  item: RecurringTransaction;
  onPress: () => void;
  isDarkMode: boolean;
  currencySymbol: string;
  categoryIcons: Record<string, CategoryIconInfo>;
}) {
  const cardBg = isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-white border-borderLight';
  const textPrimary = isDarkMode ? 'text-textDark' : 'text-textLight';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const borderBottom = isDarkMode ? 'border-borderDark' : 'border-borderLight';
  const isExpense = item.amount < 0;
  const absAmount = Math.abs(item.amount).toFixed(2);

  const effectiveNext = getEffectiveNextRunDate(item.next_run_date, item.interval_type);
  const nextDate = new Date(effectiveNext + 'T00:00:00');
  const formattedNext = nextDate.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const label = item.description || item.category_name;
  const intervalLabel = item.interval_type === 'monthly' ? 'Monthly' : 'Bi-weekly';
  const iconInfo = categoryIcons[item.category_name] ?? { icon: 'repeat-outline', color: '#4F46E5' };

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className={`p-4 rounded-2xl border mb-3 ${cardBg}`}
    >
      {/* Main row: icon + info + amount */}
      <View className="flex-row items-start">
        {/* Category icon */}
        <View
          className="w-10 h-10 rounded-xl justify-center items-center mr-3"
          style={{ backgroundColor: iconInfo.color }}
        >
          <Ionicons name={iconInfo.icon as any} size={20} color="#FFFFFF" />
        </View>

        {/* Description + category */}
        <View className="flex-1 pr-3">
          <Text className={`text-md font-medium ${textPrimary}`} numberOfLines={1}>
            {item.category_name}
          </Text>
          {!!item.description && (
            <Text className={`text-sm ${textSecondary}`} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>

        {/* Amount + interval badge */}
        <View className="items-end">
          <Text className={`text-md font-medium mb-1 ${isExpense ? 'text-textDark' : 'text-accentTeal'}`}>
            {isExpense ? `-${currencySymbol}` : currencySymbol}{absAmount}
          </Text>
          <View className={`px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
            <Text className={`text-xs font-medium ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>
              {intervalLabel}
            </Text>
          </View>
        </View>
      </View>

      {/* Next date row */}
      <View className={`mt-3 pt-2.5 border-t flex-row items-center gap-2 ${borderBottom}`}>
        <Ionicons name="calendar-outline" size={12} color={isDarkMode ? '#64748b' : '#94a3b8'} />
        <Text className={`text-xs ${textSecondary}`}>Next: {formattedNext}</Text>
        {item.end_date && (
          <>
            <Text className={`text-xs ${textSecondary}`}>·</Text>
            <Text className={`text-xs ${textSecondary}`}>
              Ends {new Date(item.end_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function RecurringTransactionsScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const { items, isLoading, loadRecurringTransactions } = useRecurringTransactionsStore();
  const { currencyCode } = useCurrencyStore();
  const currencySymbol = getCurrencySymbol(currencyCode ?? 'USD');

  const [categoryIcons, setCategoryIcons] = useState<Record<string, CategoryIconInfo>>({});
  const [editingItem, setEditingItem] = useState<RecurringTransaction | null>(null);

  const textPrimary = isDarkMode ? 'text-white' : 'text-black';
  const textSecondary = isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight';
  const screenBg = isDarkMode ? 'bg-backgroundDark' : 'bg-background';

  useEffect(() => {
    loadRecurringTransactions();
    fetchCategoryIcons().then(setCategoryIcons).catch(() => {});
  }, []);

  const activeItems = items.filter((i) => i.is_active);

  return (
    <SafeAreaView className={`flex-1 ${screenBg}`} edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-surfaceDark border border-borderDark rounded-full items-center justify-center mr-3"
        >
          <ArrowLeft color="#94A3B8" size={20} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className={`text-2xl font-semibold ${textPrimary}`}>
            Recurring Transactions
          </Text>
          <Text className={`text-xs ${textSecondary}`}>
            Auto-created on schedule
          </Text>
        </View>
      </View>

      <FlatList
        data={activeItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 40 }}
        refreshing={isLoading}
        onRefresh={loadRecurringTransactions}
        renderItem={({ item }) => (
          <RecurringCard
            item={item}
            isDarkMode={isDarkMode}
            currencySymbol={currencySymbol}
            categoryIcons={categoryIcons}
            onPress={() => setEditingItem(item)}
          />
        )}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center mt-20 px-8">
              <Ionicons
                name="repeat-outline"
                size={56}
                color={isDarkMode ? '#334155' : '#cbd5e1'}
              />
              <Text className={`text-lg font-semibold mt-4 ${textPrimary}`}>
                No recurring transactions
              </Text>
              <Text className={`text-sm text-center mt-2 ${textSecondary}`}>
                Toggle "Recurring" when adding a transaction to set one up.
              </Text>
            </View>
          ) : null
        }
      />

      <EditRecurringTransactionModal
        visible={editingItem !== null}
        onClose={() => setEditingItem(null)}
        transaction={editingItem}
      />
    </SafeAreaView>
  );
}
