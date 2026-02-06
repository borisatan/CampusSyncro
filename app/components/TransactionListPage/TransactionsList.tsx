import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Pressable, SectionList, Text } from "react-native";
import { CategoryIconInfo, TransactionSection } from "../../types/types";
import TransactionItem from "./TransactionItem";

type TransactionsListProps = {
  sections: TransactionSection[];
  categoryIcons: Record<string, CategoryIconInfo>;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  onItemLongPress?: (transactionId: string) => void;
};

const TransactionsList: React.FC<TransactionsListProps> = ({
  sections,
  categoryIcons,
  onEndReached,
  isFetchingMore,
  onItemLongPress,
}) => {
  // We pass the global index if needed, but for simplicity here 
  // each item will just trigger its own fade on mount.
  const renderItem = useCallback(({ item }: { item: any }) => (
    <AnimatedTransactionItem
      transaction={item}
      categoryIcons={categoryIcons}
      onLongPress={onItemLongPress}
    />
  ), [categoryIcons, onItemLongPress]);
  
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.id}-${String(item.created_at)}`}
      renderItem={renderItem}
      renderSectionHeader={({ section: { title } }) => (
        <Text className="text-md text-secondaryLight dark:text-secondaryDark mb-2 mt-4 px-1">
          {new Date(title).toDateString()}
        </Text>
      )}
      className="px-2"
      contentContainerStyle={{ paddingBottom: 100 }}
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
          <Text className="text-center py-4 text-secondaryLight dark:text-secondaryDark">Loading more...</Text>
        ) : null
      }
    />
  );
};

export default TransactionsList;

const AnimatedTransactionItem = React.memo(function AnimatedTransactionItem({
  transaction,
  categoryIcons,
  onLongPress,
}: {
  transaction: any;
  categoryIcons: Record<string, CategoryIconInfo>;
  onLongPress?: (id: string) => void;
}) {
  // 1. Initialize Animation Values
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0)).current; // Start invisible
  const translateY = useRef(new Animated.Value(10)).current; // Optional: slight slide up

  // 2. Entrance Animation on Mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Press Interactions (Scale)
  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={() => onLongPress?.(transaction.id)}
      delayLongPress={200}
    >
      <Animated.View 
        style={{ 
          opacity, // Apply the fade
          transform: [
            { scale }, 
            { translateY } // Apply the slide
          ] 
        }}
      >
        <TransactionItem transaction={transaction} categoryIcons={categoryIcons} />
      </Animated.View>
    </Pressable>
  );
});