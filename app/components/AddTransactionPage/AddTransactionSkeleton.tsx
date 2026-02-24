import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonBox, SkeletonText } from "../Shared/Skeleton";

interface AddTransactionSkeletonProps {
  isDarkMode: boolean;
}

const CategoryGridSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className="mb-4">
    <SkeletonText
      width={80}
      size="md"
      isDarkMode={isDarkMode}
      style={{ marginBottom: 12 }}
    />

    {/* Grid of category items - 4 columns, 2 rows */}
    {[0, 1].map((row) => (
      <View key={row} className="flex-row justify-between mb-3">
        {[0, 1, 2, 3].map((col) => (
          <MotiView
            key={col}
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "timing", duration: 250, delay: (row * 4 + col) * 30 }}
            style={{ width: "23%", alignItems: "center" }}
          >
            <SkeletonBox
              width={56}
              height={56}
              borderRadius={16}
              isDarkMode={isDarkMode}
              style={{ marginBottom: 6 }}
            />
            <SkeletonText width={50} size="sm" isDarkMode={isDarkMode} />
          </MotiView>
        ))}
      </View>
    ))}
  </View>
);

const AccountSelectorSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className="mb-4">
    <SkeletonText
      width={60}
      size="md"
      isDarkMode={isDarkMode}
      style={{ marginBottom: 12 }}
    />
    <SkeletonBox
      width="100%"
      height={56}
      borderRadius={16}
      isDarkMode={isDarkMode}
    />
  </View>
);

export const AddTransactionSkeleton: React.FC<AddTransactionSkeletonProps> = ({
  isDarkMode,
}) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
      className="px-4"
    >
      <CategoryGridSkeleton isDarkMode={isDarkMode} />
      <AccountSelectorSkeleton isDarkMode={isDarkMode} />
    </MotiView>
  );
};
