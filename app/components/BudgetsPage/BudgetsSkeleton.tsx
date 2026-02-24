import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonBox } from "../Shared/Skeleton";

interface BudgetsSkeletonProps {
  isDarkMode: boolean;
}

const IncomeCardSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => {
  const ringSize = 72;

  return (
    <View
      className={`rounded-2xl mb-4 overflow-hidden border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-surfaceLight border-slate100'
      }`}
    >
      <View className="px-4 py-4">
        <View className="flex-row items-center">
          {/* Progress Ring Skeleton */}
          <View className="mr-4" style={{ width: ringSize, height: ringSize }}>
            <SkeletonBox
              width={ringSize}
              height={ringSize}
              borderRadius={ringSize / 2}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Income info skeleton */}
          <View className="flex-1">
            <SkeletonBox
              width={100}
              height={14}
              isDarkMode={isDarkMode}
              style={{ marginBottom: 8 }}
            />
            <SkeletonBox width={140} height={28} isDarkMode={isDarkMode} />
          </View>

          {/* Chevron placeholder */}
          <SkeletonBox
            width={32}
            height={32}
            borderRadius={12}
            isDarkMode={isDarkMode}
          />
        </View>

        {/* Allocated / Remaining stats skeleton */}
        <View className="flex-row mt-4 gap-3">
          <View
            className={`flex-1 rounded-xl px-3 py-2.5 border ${
              isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
            }`}
          >
            <SkeletonBox
              width={60}
              height={12}
              isDarkMode={isDarkMode}
              style={{ marginBottom: 6 }}
            />
            <SkeletonBox width={80} height={18} isDarkMode={isDarkMode} />
          </View>
          <View
            className={`flex-1 rounded-xl px-3 py-2.5 border ${
              isDarkMode ? 'bg-inputDark border-borderDark' : 'bg-slate50 border-slate100'
            }`}
          >
            <SkeletonBox
              width={60}
              height={12}
              isDarkMode={isDarkMode}
              style={{ marginBottom: 6 }}
            />
            <SkeletonBox width={80} height={18} isDarkMode={isDarkMode} />
          </View>
        </View>
      </View>
    </View>
  );
};

const CategoryBudgetRowSkeleton = ({
  isDarkMode,
  delay = 0,
}: {
  isDarkMode: boolean;
  delay?: number;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 8 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{
      type: "timing",
      duration: 250,
      delay,
    }}
    className="mb-2.5"
  >
    <View
      className={`rounded-2xl overflow-hidden border ${
        isDarkMode ? 'bg-surfaceDark border-borderDark' : 'bg-surfaceLight border-slate100'
      }`}
    >
      <View className="p-4 flex-row items-center">
        {/* Category icon skeleton */}
        <SkeletonBox
          width={44}
          height={44}
          borderRadius={12}
          isDarkMode={isDarkMode}
          style={{ marginRight: 12 }}
        />

        {/* Category name and status skeleton */}
        <View className="flex-1">
          <SkeletonBox
            width={100}
            height={16}
            isDarkMode={isDarkMode}
            style={{ marginBottom: 6 }}
          />
          <SkeletonBox width={70} height={12} isDarkMode={isDarkMode} />
        </View>

        {/* Amount skeleton */}
        <View className="items-end">
          <SkeletonBox
            width={60}
            height={18}
            isDarkMode={isDarkMode}
            style={{ marginBottom: 4 }}
          />
          <SkeletonBox width={50} height={12} isDarkMode={isDarkMode} />
        </View>
      </View>

      {/* Progress bar skeleton */}
      <View className="px-4 pb-3">
        <SkeletonBox
          width="100%"
          height={6}
          borderRadius={9999}
          isDarkMode={isDarkMode}
        />
        <View className="flex-row justify-end mt-1">
          <SkeletonBox width={30} height={11} isDarkMode={isDarkMode} />
        </View>
      </View>
    </View>
  </MotiView>
);

export const BudgetsSkeleton: React.FC<BudgetsSkeletonProps> = ({
  isDarkMode,
}) => {
  return (
    <View>
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 350 }}
      >
        <IncomeCardSkeleton isDarkMode={isDarkMode} />
      </MotiView>

      {/* 3 Category Budget Row Skeletons */}
      {[0, 1, 2].map((index) => (
        <CategoryBudgetRowSkeleton
          key={index}
          isDarkMode={isDarkMode}
          delay={index * 50}
        />
      ))}
    </View>
  );
};
