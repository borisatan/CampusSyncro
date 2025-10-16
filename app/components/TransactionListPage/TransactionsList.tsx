import React, { useRef } from "react";
import { Animated, Pressable, RefreshControl, SectionList, Text } from "react-native";
import { CategoryIconInfo, TransactionSection } from "../../types/types";
import TransactionItem from "./TransactionItem";

type TransactionsListProps = {
  sections: TransactionSection[];
  categoryIcons: Record<string, CategoryIconInfo>;
  refreshing: boolean;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  onItemLongPress?: (transactionId: string) => void; 
};

const TransactionsList: React.FC<TransactionsListProps> = ({
  sections,
  categoryIcons,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingMore,
  onItemLongPress, 
}) => {
  
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => {
        console.log(`${item.id}-${String(item.created_at)}`)
        return `${item.id}-${String(item.created_at)}`;
      }}

      renderItem={({ item }) => <AnimatedTransactionItem
        transaction={item}
        categoryIcons={categoryIcons}
        onLongPress={onItemLongPress}
      />}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="text-md text-secondaryLight dark:text-secondaryDark mb-2 mt-4">
          {new Date(title).toDateString()}
        </Text>
      )}
      className="px-4"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#000000"]}
          tintColor={"#000000"}
        />
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
        autoscrollToTopThreshold: 10,
      }}
      ListFooterComponent={
        isFetchingMore ? (
          <Text className="text-center py-4">Loading more...</Text>
        ) : null
      }
    />
  );
};

export default TransactionsList;


const AnimatedTransactionItem = ({
  transaction,
  categoryIcons,
  onLongPress,
}: {
  transaction: any;
  categoryIcons: Record<string, CategoryIconInfo>;
  onLongPress?: (id: string) => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94, // Slightly smaller
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={() => onLongPress?.(transaction.id)}
      delayLongPress={225}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TransactionItem transaction={transaction} categoryIcons={categoryIcons} />
      </Animated.View>
    </Pressable>
  );
};