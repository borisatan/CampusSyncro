import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonBox, SkeletonCircle, SkeletonText } from "../Shared/Skeleton";

interface AccountsSkeletonProps {
  isDarkMode: boolean;
}

const TotalBalanceCardSkeleton = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <View className="rounded-2xl p-6 mb-6 bg-accentSkyBlue opacity-80">
    <SkeletonText width={120} size="sm" isDarkMode={false} style={{ marginBottom: 8, opacity: 0.7 }} />
    <View className="flex-row items-center mb-4">
      <SkeletonBox width={180} height={36} isDarkMode={false} borderRadius={6} style={{ opacity: 0.5 }} />
    </View>
    <View>
      <SkeletonText width={60} size="sm" isDarkMode={false} style={{ marginBottom: 4, opacity: 0.7 }} />
      <SkeletonText width={40} size="lg" isDarkMode={false} style={{ opacity: 0.5 }} />
    </View>
  </View>
);

const AccountItemSkeleton = ({
  isDarkMode,
  delay = 0,
}: {
  isDarkMode: boolean;
  delay?: number;
}) => (
  <MotiView
    from={{ opacity: 0, translateY: 20 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: "timing", duration: 500, delay }}
    className="mb-2"
  >
    <View
      className={`rounded-2xl p-4 border ${
        isDarkMode ? 'bg-surfaceDark border-gray600' : 'bg-surfaceLightAlt border-slate100'
      }`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Account icon */}
          <SkeletonBox
            width={48}
            height={48}
            borderRadius={12}
            isDarkMode={isDarkMode}
          />

          {/* Account name and type */}
          <View className="flex-1 ml-4">
            <SkeletonText
              width={120}
              size="md"
              isDarkMode={isDarkMode}
              style={{ marginBottom: 6 }}
            />
            <SkeletonText width={70} size="sm" isDarkMode={isDarkMode} />
          </View>

          {/* Balance */}
          <View className="items-end">
            <SkeletonText width={90} size="lg" isDarkMode={isDarkMode} />
          </View>
        </View>

        {/* Menu button placeholder */}
        <SkeletonCircle
          size={32}
          isDarkMode={isDarkMode}
          style={{ marginLeft: 8 }}
        />
      </View>
    </View>
  </MotiView>
);

export const AccountsSkeleton: React.FC<AccountsSkeletonProps> = ({ isDarkMode }) => {
  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: "timing", duration: 300 }}
    >
      <TotalBalanceCardSkeleton isDarkMode={isDarkMode} />

      {/* Section header */}
      <SkeletonText
        width={100}
        size="md"
        isDarkMode={isDarkMode}
        style={{ marginBottom: 12 }}
      />

      {/* Account items - show 3 skeleton items */}
      {[0, 1, 2].map((index) => (
        <AccountItemSkeleton key={index} isDarkMode={isDarkMode} delay={index * 100} />
      ))}
    </MotiView>
  );
};
