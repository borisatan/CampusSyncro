import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonBox, SkeletonText } from "../Shared/Skeleton";

interface TransactionListSkeletonProps {
  isDarkMode: boolean;
}

const TransactionItemSkeleton = ({
  isDarkMode,
  delay = 0,
}: {
  isDarkMode: boolean;
  delay?: number;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 10 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: "timing", duration: 300, delay }}
  >
    <View
      className="p-4 rounded-2xl mb-2 flex-row justify-between items-start"
      style={{
        backgroundColor: isDarkMode ? "#20283A" : "#F5F5F4",
        borderWidth: 1,
        borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
      }}
    >
      {/* Left side - icon and text */}
      <View className="flex-row items-start flex-1 pr-3">
        <SkeletonBox
          width={40}
          height={40}
          borderRadius={12}
          isDarkMode={isDarkMode}
          style={{ marginRight: 12 }}
        />
        <View className="flex-1">
          <SkeletonText
            width={100}
            size="md"
            isDarkMode={isDarkMode}
            style={{ marginBottom: 6 }}
          />
          <SkeletonText width={140} size="sm" isDarkMode={isDarkMode} />
        </View>
      </View>

      {/* Right side - amount and account */}
      <View className="items-end">
        <SkeletonText
          width={70}
          size="md"
          isDarkMode={isDarkMode}
          style={{ marginBottom: 6 }}
        />
        <SkeletonText width={80} size="sm" isDarkMode={isDarkMode} />
      </View>
    </View>
  </MotiView>
);

const DateSectionSkeleton = ({
  isDarkMode,
  itemCount = 3,
  baseDelay = 0,
}: {
  isDarkMode: boolean;
  itemCount?: number;
  baseDelay?: number;
}) => (
  <View className="mb-2">
    {/* Date header */}
    <SkeletonText
      width={120}
      size="sm"
      isDarkMode={isDarkMode}
      style={{ marginBottom: 8, marginTop: 16, marginLeft: 4 }}
    />

    {/* Transaction items */}
    {Array.from({ length: itemCount }).map((_, index) => (
      <TransactionItemSkeleton
        key={index}
        isDarkMode={isDarkMode}
        delay={baseDelay + index * 50}
      />
    ))}
  </View>
);

export const TransactionListSkeleton: React.FC<TransactionListSkeletonProps> = ({
  isDarkMode,
}) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
      className="px-2"
    >
      {/* Multiple date sections */}
      <DateSectionSkeleton isDarkMode={isDarkMode} itemCount={3} baseDelay={0} />
      <DateSectionSkeleton isDarkMode={isDarkMode} itemCount={2} baseDelay={150} />
      <DateSectionSkeleton isDarkMode={isDarkMode} itemCount={2} baseDelay={250} />
    </MotiView>
  );
};
