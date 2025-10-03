import React from "react";
import { RefreshControl, SectionList, Text } from "react-native";
import { CategoryIconInfo, TransactionSection } from "../../types/types";
import TransactionItem from "./TransactionItem";

type TransactionsListProps = {
  sections: TransactionSection[];
  categoryIcons: Record<string, CategoryIconInfo>;
  refreshing: boolean;
  onRefresh?: () => Promise<void>;
  onEndReached?: () => void;          
  isFetchingMore?: boolean;          
};

const TransactionsList: React.FC<TransactionsListProps> = ({
  sections,
  categoryIcons,
  refreshing,
  onRefresh,
  onEndReached,          
  isFetchingMore        
}) => {
  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item }) => <TransactionItem transaction={item} categoryIcons={categoryIcons} />}
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
        autoscrollToTopThreshold: 10
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