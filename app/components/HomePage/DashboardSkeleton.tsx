import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonBox, SkeletonCircle, SkeletonText } from "../Shared/Skeleton";

interface DashboardSkeletonProps {
  isDarkMode: boolean;
}

const SummarySkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className="flex-col mb-2">
    {/* Total Balance Header */}
    <View className="flex-1 rounded-2xl p-2 mb-1">
      <SkeletonText width={140} size="xl" isDarkMode={isDarkMode} style={{ marginBottom: 12 }} />
      <SkeletonBox width={220} height={48} isDarkMode={isDarkMode} borderRadius={8} />
    </View>

    {/* Income & Expenses Cards */}
    <View className="flex-row gap-4 mb-3">
      <View
        className="flex-1 rounded-2xl p-4"
        style={{ backgroundColor: isDarkMode ? "#0D9488" : "#14B8A6", opacity: 0.6 }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <SkeletonCircle size={16} isDarkMode={isDarkMode} />
          <SkeletonText width={60} size="md" isDarkMode={isDarkMode} />
        </View>
        <SkeletonBox width={100} height={30} isDarkMode={isDarkMode} />
      </View>

      <View
        className="flex-1 rounded-2xl p-4"
        style={{ backgroundColor: isDarkMode ? "#DC2626" : "#EF4444", opacity: 0.6 }}
      >
        <View className="flex-row items-center gap-2 mb-2">
          <SkeletonCircle size={16} isDarkMode={isDarkMode} />
          <SkeletonText width={70} size="md" isDarkMode={isDarkMode} />
        </View>
        <SkeletonBox width={100} height={30} isDarkMode={isDarkMode} />
      </View>
    </View>
  </View>
);

const TimeFrameSelectorSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className="flex-row justify-center gap-2 mb-4">
    {[80, 80, 80].map((width, i) => (
      <SkeletonBox
        key={i}
        width={width}
        height={36}
        borderRadius={18}
        isDarkMode={isDarkMode}
      />
    ))}
  </View>
);

const ChartSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="rounded-2xl p-4 mb-4"
    style={{
      backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
    }}
  >
    {/* Chart header with arrows */}
    <View className="flex-row items-center justify-between mb-4">
      <SkeletonCircle size={36} isDarkMode={isDarkMode} />
      <SkeletonText width={120} size="lg" isDarkMode={isDarkMode} />
      <SkeletonCircle size={36} isDarkMode={isDarkMode} />
    </View>

    {/* Chart area placeholder */}
    <SkeletonBox width="100%" height={180} borderRadius={12} isDarkMode={isDarkMode} />

    {/* Legend items */}
    <View className="flex-row justify-center gap-4 mt-4">
      <View className="flex-row items-center">
        <SkeletonCircle size={12} isDarkMode={isDarkMode} style={{ marginRight: 6 }} />
        <SkeletonText width={50} size="sm" isDarkMode={isDarkMode} />
      </View>
      <View className="flex-row items-center">
        <SkeletonCircle size={12} isDarkMode={isDarkMode} style={{ marginRight: 6 }} />
        <SkeletonText width={50} size="sm" isDarkMode={isDarkMode} />
      </View>
    </View>
  </View>
);

const BudgetHealthSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="rounded-2xl p-4 mb-4"
    style={{
      backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
    }}
  >
    <View className="flex-row items-center">
      {/* Circular progress placeholder */}
      <SkeletonCircle size={80} isDarkMode={isDarkMode} style={{ marginRight: 16 }} />

      {/* Stats */}
      <View className="flex-1">
        <SkeletonText width={100} size="sm" isDarkMode={isDarkMode} style={{ marginBottom: 8 }} />
        <SkeletonText width={140} size="xl" isDarkMode={isDarkMode} style={{ marginBottom: 12 }} />
        <View className="flex-row gap-4">
          <View>
            <SkeletonText width={50} size="sm" isDarkMode={isDarkMode} style={{ marginBottom: 4 }} />
            <SkeletonText width={70} size="md" isDarkMode={isDarkMode} />
          </View>
          <View>
            <SkeletonText width={60} size="sm" isDarkMode={isDarkMode} style={{ marginBottom: 4 }} />
            <SkeletonText width={70} size="md" isDarkMode={isDarkMode} />
          </View>
        </View>
      </View>
    </View>
  </View>
);

const CategoryDonutSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View
    className="rounded-2xl p-4 mb-4"
    style={{
      backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
    }}
  >
    <SkeletonText width={140} size="lg" isDarkMode={isDarkMode} style={{ marginBottom: 16 }} />
    <View className="items-center">
      <SkeletonCircle size={160} isDarkMode={isDarkMode} />
    </View>
  </View>
);

const CategoryCardSkeleton = ({
  isDarkMode,
  delay = 0,
}: {
  isDarkMode: boolean;
  delay?: number;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 8 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: "timing", duration: 250, delay }}
    className="mb-2"
  >
    <View
      className="flex-row items-center rounded-2xl p-4"
      style={{
        backgroundColor: isDarkMode ? "#20283A" : "#F8FAFC",
        borderWidth: 1,
        borderColor: isDarkMode ? "#4B5563" : "#E2E8F0",
      }}
    >
      {/* Icon */}
      <SkeletonBox
        width={48}
        height={48}
        borderRadius={12}
        isDarkMode={isDarkMode}
        style={{ marginRight: 12 }}
      />

      {/* Name */}
      <View className="flex-1">
        <SkeletonText width={100} size="lg" isDarkMode={isDarkMode} />
      </View>

      {/* Amount & Percent */}
      <View className="items-end">
        <SkeletonText width={80} size="lg" isDarkMode={isDarkMode} style={{ marginBottom: 4 }} />
        <SkeletonText width={40} size="md" isDarkMode={isDarkMode} />
      </View>
    </View>
  </MotiView>
);

export const DashboardSkeleton: React.FC<DashboardSkeletonProps> = ({ isDarkMode }) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <SummarySkeleton isDarkMode={isDarkMode} />
      <TimeFrameSelectorSkeleton isDarkMode={isDarkMode} />
      <ChartSkeleton isDarkMode={isDarkMode} />
      <BudgetHealthSkeleton isDarkMode={isDarkMode} />
      <CategoryDonutSkeleton isDarkMode={isDarkMode} />

      {/* Category breakdown skeleton - 3 items */}
      <View className="mt-1 mb-10">
        {[0, 1, 2].map((index) => (
          <CategoryCardSkeleton key={index} isDarkMode={isDarkMode} delay={index * 50} />
        ))}
      </View>
    </MotiView>
  );
};
