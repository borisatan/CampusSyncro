import * as Haptics from 'expo-haptics';
import React, { useCallback, useRef } from "react";
import { Alert, SectionList, Text, View } from "react-native";
import { Pressable } from 'react-native-gesture-handler';
import ReanimatedSwipeable, { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { SharedValue, useAnimatedStyle, interpolate } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIconInfo, TransactionSection } from "../../types/types";
import TransactionItem from "./TransactionItem";

type TransactionsListProps = {
  sections: TransactionSection[];
  categoryIcons: Record<string, CategoryIconInfo>;
  onEndReached?: () => void;
  isFetchingMore?: boolean;
  onItemLongPress?: (transactionId: string) => void;
  onDelete?: (transactionId: number) => void;
};

const TransactionsList: React.FC<TransactionsListProps> = ({
  sections,
  categoryIcons,
  onEndReached,
  isFetchingMore,
  onItemLongPress,
  onDelete,
}) => {
  const renderItem = useCallback(({ item }: { item: any }) => (
    <AnimatedTransactionItem
      transaction={item}
      categoryIcons={categoryIcons}
      onLongPress={onItemLongPress}
      onDelete={onDelete}
    />
  ), [categoryIcons, onItemLongPress, onDelete]);

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

function DeleteAction({ drag }: { drag: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(drag.value, [-80, -40, 0], [1, 0.85, 0.7], 'clamp');
    const opacity = interpolate(drag.value, [-80, -30, 0], [1, 0.8, 0], 'clamp');
    return { transform: [{ scale }], opacity };
  });

  return (
    <View className="bg-red-500 rounded-2xl mb-2 justify-center items-center" style={{ width: 80 }}>
      <Animated.View style={animatedStyle} className="items-center justify-center">
        <Ionicons name="trash-outline" size={24} color="white" />
      </Animated.View>
    </View>
  );
}

const AnimatedTransactionItem = React.memo(function AnimatedTransactionItem({
  transaction,
  categoryIcons,
  onLongPress,
  onDelete,
}: {
  transaction: any;
  categoryIcons: Record<string, CategoryIconInfo>;
  onLongPress?: (id: string) => void;
  onDelete?: (transactionId: number) => void;
}) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.(transaction.id);
  }, [transaction.id, onLongPress]);

  const handleSwipeOpen = useCallback((_direction: 'left' | 'right') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            swipeableRef.current?.close();
            onDelete?.(transaction.id);
          },
        },
      ]
    );
  }, [transaction.id, onDelete]);

  const renderRightActions = useCallback(
    (_progress: SharedValue<number>, drag: SharedValue<number>) => (
      <DeleteAction drag={drag} />
    ),
    []
  );

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableOpen={handleSwipeOpen}
      friction={1}
    >
      <Pressable
        onPress={handlePress}
        style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}
      >
        <TransactionItem transaction={transaction} categoryIcons={categoryIcons} />
      </Pressable>
    </ReanimatedSwipeable>
  );
});
