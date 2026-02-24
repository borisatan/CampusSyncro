import { MotiView } from "moti";
import React from "react";
import { View } from "react-native";
import { SkeletonCircle, SkeletonText } from "../Shared/Skeleton";

export const ProfileCardSkeleton = () => (
  <MotiView
    from={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ type: "timing", duration: 300 }}
  >
    <View className="rounded-2xl p-6 flex-row items-center mb-8 bg-accentIndigo">
      {/* Avatar */}
      <View className="w-16 h-16 rounded-full items-center justify-center mr-4 bg-overlayLight">
        <SkeletonCircle size={32} isDarkMode={false} style={{ opacity: 0.5 }} />
      </View>

      {/* User info */}
      <View>
        <SkeletonText
          width={120}
          size="lg"
          isDarkMode={false}
          style={{ marginBottom: 8, opacity: 0.5 }}
        />
        <SkeletonText
          width={180}
          size="sm"
          isDarkMode={false}
          style={{ opacity: 0.4 }}
        />
      </View>
    </View>
  </MotiView>
);
