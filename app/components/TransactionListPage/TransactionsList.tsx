import * as Haptics from 'expo-haptics';
import React, { useCallback } from "react";
import { SectionList, Text } from "react-native";
import { CategoryIconInfo, TransactionSection } from "../../types/types";
import TransactionItem from "./TransactionItem";
import { RipplePressable } from "../Shared/RipplePressable";

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
  
  const renderSectionHeader = useCallback(({ section: { title } }: { section: { title: string } }) => (
    <Text className="text-md text-secondaryLight dark:text-secondaryDark mb-2 mt-4 px-1">
      {new Date(title).toDateString()}
    </Text>
  ), []);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => `${item.id}-${String(item.created_at)}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      className="px-2"
      contentContainerStyle={{ paddingBottom: 100 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={15}
      windowSize={10}
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
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(transaction.id);
  }, [transaction.id, onLongPress]);

  return (
    <RipplePressable
      onPress={handlePress}
      delayLongPress={200}
      className="rounded-2xl overflow-hidden mb-2"
      rippleColor="rgba(255, 255, 255, 0.15)"
    >
      <TransactionItem transaction={transaction} categoryIcons={categoryIcons} />
    </RipplePressable>
  );
});