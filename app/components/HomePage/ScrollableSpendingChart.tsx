import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Text, TouchableOpacity, View } from "react-native";
import { CategoryBudgetStatus, ChartDataPoint } from "../../types/types";
import { getDateRange } from "../../utils/dateUtils";
import { SpendingTrendChart } from "./SpendingTrendChart";

type TimeFrame = "week" | "month" | "year";

interface ScrollableSpendingChartProps {
  chartDataByOffset: Record<number, ChartDataPoint[]>;
  timeFrame: TimeFrame;
  font: any;
  currencySymbol: string;
  categoryBudgets?: CategoryBudgetStatus[];
  isUnlocked?: boolean;
  onOffsetChange: (offset: 0 | -1 | -2) => void;
}

// Display order: oldest first (left) to current (right)
const PAGES = [-2, -1, 0] as const;

const getPeriodLabel = (timeFrame: TimeFrame, offset: number): string => {
  const { startDate } = getDateRange(timeFrame, offset);
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  if (offset === 0) {
    if (timeFrame === "week") return "This Week";
    if (timeFrame === "month") return "This Month";
    return "This Year";
  }

  if (timeFrame === "week") {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    const fmt = (d: Date) =>
      `${d.getDate()} ${monthNames[d.getMonth()].slice(0, 3)}`;
    return `${fmt(startDate)} - ${fmt(endDate)}`;
  }

  if (timeFrame === "month") {
    return `${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
  }

  return `${startDate.getFullYear()}`;
};

const ArrowButton = ({
  enabled,
  onPress,
  icon,
}: {
  enabled: boolean;
  onPress: () => void;
  icon: "chevron-back" | "chevron-forward";
}) => {
  const opacity = useRef(new Animated.Value(enabled ? 1 : 0.3)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: enabled ? 1 : 0.3,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [enabled]);

  return (
    <Animated.View style={{ opacity }}>
      <TouchableOpacity
        onPress={onPress}
        disabled={!enabled}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      >
        <View className="w-9 h-9 rounded-full bg-surfaceDark border border-borderDark items-center justify-center">
          <Ionicons name={icon} size={18} color="#94a3b8" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ScrollableSpendingChart = React.memo(
  ({
    chartDataByOffset,
    timeFrame,
    font,
    currencySymbol,
    categoryBudgets = [],
    isUnlocked = true,
    onOffsetChange,
  }: ScrollableSpendingChartProps) => {
    const [activeIndex, setActiveIndex] = useState(PAGES.length - 1); // start on current

    const goLeft = useCallback(() => {
      setActiveIndex((prev) => {
        const next = prev - 1;
        if (next < 0) return prev;
        onOffsetChange(PAGES[next] as 0 | -1 | -2);
        return next;
      });
    }, [onOffsetChange]);

    const goRight = useCallback(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        if (next >= PAGES.length) return prev;
        onOffsetChange(PAGES[next] as 0 | -1 | -2);
        return next;
      });
    }, [onOffsetChange]);

    const canGoLeft = activeIndex > 0;
    const canGoRight = activeIndex < PAGES.length - 1;
    const currentOffset = PAGES[activeIndex];
    const chartData = chartDataByOffset[currentOffset] ?? [];

    return (
      <View>
        {/* Period label at top left */}
        <View className="mb-2 px-1">
          <Text className="text-secondaryDark text-sm">
            {getPeriodLabel(timeFrame, currentOffset)}
          </Text>
        </View>

        <SpendingTrendChart
          data={chartData}
          timeFrame={timeFrame}
          font={font}
          currencySymbol={currencySymbol}
          categoryBudgets={categoryBudgets}
          isCurrentPeriod={currentOffset === 0}
          isUnlocked={isUnlocked}
        />

        {/* Navigation below chart: chevron arrows with dot indicators in the middle */}
        <View className="flex-row items-center justify-center -mt-4 mb-2">
          <ArrowButton
            enabled={canGoLeft}
            onPress={goLeft}
            icon="chevron-back"
          />

          <View className="flex-row gap-2.5 mx-5">
            {PAGES.map((_, index) => (
              <View
                key={index}
                className={`w-2.5 h-2.5 rounded-full ${
                  index === activeIndex ? "bg-accentBlue" : "bg-borderDark"
                }`}
              />
            ))}
          </View>

          <ArrowButton
            enabled={canGoRight}
            onPress={goRight}
            icon="chevron-forward"
          />
        </View>
      </View>
    );
  },
);
