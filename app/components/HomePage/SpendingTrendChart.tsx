import {
  Circle,
  Group,
  Rect,
  rect as skRect,
} from "@shopify/react-native-skia";
import { MotiView } from "moti";
import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import {
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";

import { CartesianChart, Line, useChartPressState } from "victory-native";
import { CategoryBudgetStatus } from "../../types/types";

interface ChartProps {
  data: any[];
  font: any;
  timeFrame: "week" | "month" | "year";
  currencySymbol: string;
  categoryBudgets?: CategoryBudgetStatus[];
  isCurrentPeriod?: boolean;
  isUnlocked?: boolean;
}

function ToolTip({
  x,
  y,
  isActive,
  overColor,
  underColor,
  defaultColor,
  isOverBudget,
  hasBudget,
}: {
  x: SharedValue<number>;
  y: SharedValue<number>;
  isActive: SharedValue<boolean>;
  overColor: string;
  underColor: string;
  defaultColor: string;
  isOverBudget: SharedValue<boolean>;
  hasBudget: boolean;
}) {
  const opacity = useDerivedValue(() => (isActive.value ? 1 : 0));
  const dotColor = useDerivedValue(() => {
    if (!hasBudget) return defaultColor;
    return isOverBudget.value ? overColor : underColor;
  });
  return (
    <Group opacity={opacity}>
      <Rect x={x} y={0} width={1} height={300} color="#94a3b8" opacity={0.3} />
      <Circle cx={x} cy={y} r={5} color={dotColor} />
    </Group>
  );
}

// Normalize total budget to chart timeframe (budgets are always monthly for now)
const normalizeTotalBudgetToTimeframe = (
  totalBudget: number,
  timeFrame: "week" | "month" | "year",
): number => {
  if (timeFrame === "week") return totalBudget / 4;
  if (timeFrame === "month") return totalBudget;
  return totalBudget * 12; // year
};

// Format label for the tooltip display (not x-axis)
const formatDisplayLabel = (
  label: string,
  timeFrame: "week" | "month" | "year",
): string => {
  if (!label) return "";
  if (timeFrame === "week") {
    const dayMap: Record<string, string> = {
      Mon: "Monday",
      Tue: "Tuesday",
      Wed: "Wednesday",
      Thu: "Thursday",
      Fri: "Friday",
      Sat: "Saturday",
      Sun: "Sunday",
    };
    return dayMap[label] || label;
  }
  if (timeFrame === "year") {
    const monthMap: Record<string, string> = {
      Jan: "January",
      Feb: "February",
      Mar: "March",
      Apr: "April",
      May: "May",
      Jun: "June",
      Jul: "July",
      Aug: "August",
      Sep: "September",
      Oct: "October",
      Nov: "November",
      Dec: "December",
    };
    return monthMap[label] || label;
  }
  if (timeFrame === "month") {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(Number(label)).padStart(2, "0");
    return `${day}.${month}`;
  }
  return label;
};

export const SpendingTrendChart = React.memo(({
  data,
  currencySymbol,
  font,
  timeFrame,
  categoryBudgets = [],
  isCurrentPeriod = true,
  isUnlocked = true,
}: ChartProps) => {
  const [tooltipData, setTooltipData] = useState({
    label: "",
    value: "",
    paceValue: "",
    diffStr: "",
    diffPctStr: "",
    isOverBudget: false,
    isFuture: false,
  });
  const { state } = useChartPressState({
    x: 0,
    y: { amount: 0, pace: 0 },
  });

  // Track last index to prevent redundant JS bridge calls
  const lastIndex = useSharedValue(-1);

  // Calculate total budget normalized to the current timeframe
  const totalBudget = useMemo(() => {
    if (!categoryBudgets || categoryBudgets.length === 0) return 0;
    const rawTotal = categoryBudgets.reduce(
      (sum, cb) => sum + cb.budget_amount,
      0,
    );
    return normalizeTotalBudgetToTimeframe(rawTotal, timeFrame);
  }, [categoryBudgets, timeFrame]);

  // Build cumulative spending data with pace comparison
  const { cumulativeData, lastActualIndex } = useMemo(() => {
    let fullLabels: string[] = [];

    if (timeFrame === "week") {
      fullLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    } else if (timeFrame === "month") {
      fullLabels = ["1", "8", "15", "22", "29"];
    } else if (timeFrame === "year") {
      fullLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    }

    let runningTotal = 0;
    let lastIdx = -1;
    const totalPoints = fullLabels.length;

    const result = fullLabels.map((label, index) => {
      const existingPoint = data.find((d) => d.label === label);

      // Only mark points as future for the current period;
      // past periods are complete so the line should span the full range.
      let isFuture = false;
      if (isCurrentPeriod) {
        if (timeFrame === "week") {
          const dayMap: Record<string, number> = {
            Mon: 1,
            Tue: 2,
            Wed: 3,
            Thu: 4,
            Fri: 5,
            Sat: 6,
            Sun: 0,
          };
          const todayNum = new Date().getDay();
          const labelNum = dayMap[label];
          const adjustedToday = todayNum === 0 ? 7 : todayNum;
          const adjustedLabel = labelNum === 0 ? 7 : labelNum;
          isFuture = adjustedLabel > adjustedToday;
        } else if (timeFrame === "month") {
          const currentWeekIdx = Math.floor((new Date().getDate() - 1) / 7);
          isFuture = index > currentWeekIdx;
        } else if (timeFrame === "year") {
          isFuture = index > new Date().getMonth();
        }
      }

      if (!isFuture) {
        runningTotal += existingPoint ? existingPoint.amount : 0;
        lastIdx = index;
      }

      // Calculate pace value at this point (each period gets an equal share of budget)
      const paceValue =
        totalBudget > 0 ? (totalBudget / totalPoints) * (index + 1) : 0;
      const isOverBudget = runningTotal > paceValue;

      return {
        x: index,
        label: label,
        amount: isFuture ? 0 : runningTotal,
        pace: paceValue,
        isFuture: isFuture,
        isOverBudget: isOverBudget,
      };
    });

    return { cumulativeData: result, lastActualIndex: lastIdx };
  }, [data, timeFrame, totalBudget, isCurrentPeriod]);

  // Catmull-Rom spline interpolation for smooth curves
  const catmullRom = (
    p0: number,
    p1: number,
    p2: number,
    p3: number,
    t: number,
  ) => {
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      0.5 *
      (2 * p1 +
        (-p0 + p2) * t +
        (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
        (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
    );
  };

  // Upsample data for smooth scrubbing (inserts intermediate interpolated points)
  // week: 7 pts * 86 = ~602, month: 5 pts * 120 = ~600, year: 12 pts * 50 = ~600
  const INTERPOLATION_STEPS =
    timeFrame === "month" ? 120 : timeFrame === "week" ? 86 : 50;
  const { smoothData, smoothLastActualIndex } = useMemo(() => {
    if (cumulativeData.length < 2) {
      return {
        smoothData: cumulativeData,
        smoothLastActualIndex: lastActualIndex,
      };
    }

    const result: typeof cumulativeData = [];
    const len = cumulativeData.length;

    for (let i = 0; i < len; i++) {
      // Push original point with new x index
      result.push({ ...cumulativeData[i], x: i * INTERPOLATION_STEPS });

      // Insert intermediate points between this and next using Catmull-Rom
      if (i < len - 1) {
        const curr = cumulativeData[i];
        const next = cumulativeData[i + 1];
        // Catmull-Rom needs 4 control points: clamp at edges
        const prev = cumulativeData[Math.max(0, i - 1)];
        const nextNext = cumulativeData[Math.min(len - 1, i + 2)];

        for (let j = 1; j < INTERPOLATION_STEPS; j++) {
          const t = j / INTERPOLATION_STEPS;
          const interpAmount =
            curr.isFuture && next.isFuture
              ? 0
              : next.isFuture
                ? curr.amount
                : catmullRom(
                    prev.amount,
                    curr.amount,
                    next.amount,
                    nextNext.amount,
                    t,
                  );
          const interpPace = catmullRom(
            prev.pace,
            curr.pace,
            next.pace,
            nextNext.pace,
            t,
          );

          result.push({
            x: i * INTERPOLATION_STEPS + j,
            label: "", // no label for intermediate points
            amount: interpAmount,
            pace: interpPace,
            isFuture: next.isFuture && j > INTERPOLATION_STEPS / 2,
            isOverBudget: interpAmount > interpPace,
          });
        }
      }
    }

    const newLastIdx =
      lastActualIndex >= 0 ? lastActualIndex * INTERPOLATION_STEPS : -1;
    return { smoothData: result, smoothLastActualIndex: newLastIdx };
  }, [cumulativeData, lastActualIndex]);

  const maxValue = useMemo(() => {
    const maxSpending = Math.max(...smoothData.map((d) => d.amount || 0));
    // Only exceed budget scale if spending actually goes over
    if (maxSpending > totalBudget) {
      return maxSpending * 1.15;
    }
    // Otherwise, show just a bit above the budget
    return totalBudget > 0 ? totalBudget * 1.12 : (maxSpending > 0 ? maxSpending * 1.15 : 100);
  }, [smoothData, totalBudget]);

  // Compute default tooltip from the last actual data point
  const defaultTooltip = useMemo(() => {
    if (lastActualIndex < 0 || cumulativeData.length === 0) {
      return {
        label: "",
        value: `${currencySymbol}0`,
        paceValue: "",
        diffStr: "",
        diffPctStr: "",
        isOverBudget: false,
        isFuture: false,
      };
    }
    const pt = cumulativeData[lastActualIndex];
    const amount = Math.round(pt.amount);
    const pace = Math.round(pt.pace);
    const diff = amount - pace;
    const sign = diff >= 0 ? "+" : "-";
    return {
      label: formatDisplayLabel(pt.label, timeFrame),
      value: `${currencySymbol}${amount.toLocaleString()}`,
      paceValue: `${currencySymbol}${pace.toLocaleString()}`,
      diffStr: `${sign}${currencySymbol}${Math.abs(diff).toLocaleString()}`,
      diffPctStr:
        pace > 0 ? `${(Math.abs(diff / pace) * 100).toFixed(1)}%` : "0.0%",
      isOverBudget: pt.isOverBudget,
      isFuture: false,
    };
  }, [cumulativeData, lastActualIndex, currencySymbol]);

  // Check if there's any actual spending data
  const hasSpendingData = useMemo(() => {
    return cumulativeData.some((d) => !d.isFuture && d.amount > 0);
  }, [cumulativeData]);

  // Show scrubbed data if available, otherwise default to latest actual point
  const displayData = tooltipData.value ? tooltipData : defaultTooltip;

  const instanceKey = useMemo(() => {
    return `${timeFrame}-${totalBudget}-${isCurrentPeriod}-${isUnlocked}`;
  }, [timeFrame, totalBudget, isCurrentPeriod, isUnlocked]);

  // Clamped tooltip positions - never go past the last actual data point
  const clampedX = useSharedValue(0);
  const clampedY = useSharedValue(0);
  // Store the pixel position of the last actual data point (set during render)
  const lastActualPixelX = useSharedValue(0);
  const lastActualPixelY = useSharedValue(0);
  // Over-budget status driven on UI thread for instant tooltip color
  const tooltipIsOverBudget = useSharedValue(false);
  const endpointIsOverBudget = useSharedValue(false);

  // Animated clip rect for highlight - runs on UI thread, no JS bridge lag
  const HIGHLIGHT_HALF_WIDTH = 30;
  const highlightClip = useDerivedValue(() => {
    return skRect(
      clampedX.value - HIGHLIGHT_HALF_WIDTH,
      0,
      HIGHLIGHT_HALF_WIDTH * 2,
      300,
    );
  });

  // Shared-value-driven opacities for instant Skia response (no JS bridge delay)
  const dimmedOpacity = useDerivedValue(() =>
    state.isActive.value ? 0.25 : 1,
  );
  const highlightOpacity = useDerivedValue(() =>
    state.isActive.value ? 1 : 0,
  );
  const endpointOpacity = useDerivedValue(() =>
    state.isActive.value ? 0 : 1,
  );

  const handleTooltipUpdate = (
    rawIndex: number,
    xPos: number,
    yPos: number,
  ) => {
    const index = Math.min(
      Math.max(Math.round(rawIndex), 0),
      smoothLastActualIndex,
    );
    if (index < 0 || index >= smoothData.length) return;

    const originalIndex = Math.round(index / INTERPOLATION_STEPS);
    const dataPoint = smoothData[index];
    const nearestOriginal =
      cumulativeData[Math.min(originalIndex, cumulativeData.length - 1)];
    const label = formatDisplayLabel(nearestOriginal?.label || "", timeFrame);
    const isOverBudget = dataPoint?.isOverBudget || false;
    const amount = Math.round(dataPoint?.amount || 0);
    const pace = Math.round(dataPoint?.pace || 0);
    const valueStr = `${currencySymbol}${amount.toLocaleString()}`;
    const paceValueStr = `${currencySymbol}${pace.toLocaleString()}`;

    const diff = amount - pace;
    const sign = diff >= 0 ? "+" : "-";
    const diffStr = `${sign}${currencySymbol}${Math.abs(diff).toLocaleString()}`;
    const diffPct = pace > 0 ? Math.abs(diff / pace) * 100 : 0;
    const diffPctStr = `${diffPct.toFixed(1)}%`;

    setTooltipData({
      label,
      value: valueStr,
      paceValue: paceValueStr,
      diffStr,
      diffPctStr,
      isOverBudget,
      isFuture: false,
    });
  };

  const handleTooltipClear = () => {
    setTooltipData({
      label: "",
      value: "",
      paceValue: "",
      diffStr: "",
      diffPctStr: "",
      isOverBudget: false,
      isFuture: false,
    });
  };

  useAnimatedReaction(
    () => ({
      x: state.x.value.value,
      y: state.y.amount.value.value,
      active: state.isActive.value,
    }),
    (current) => {
      if (!current.active) {
        lastIndex.value = -1;
        runOnJS(handleTooltipClear)();
        return;
      }

      const rawIndex = Math.round(current.x);

      // Update clamped positions for tooltip rendering
      if (rawIndex > smoothLastActualIndex && smoothLastActualIndex >= 0) {
        clampedX.value = lastActualPixelX.value;
        clampedY.value = lastActualPixelY.value;
        tooltipIsOverBudget.value = endpointIsOverBudget.value;
      } else {
        clampedX.value = state.x.position.value;
        clampedY.value = state.y.amount.position.value;
        // Compare data values: amount > pace means over budget
        tooltipIsOverBudget.value =
          state.y.amount.value.value > state.y.pace.value.value;
      }

      runOnJS(handleTooltipUpdate)(
        current.x,
        state.x.position.value,
        state.y.amount.position.value,
      );
    },
  );

  return (
    <View className="bg-surfaceDark rounded-2xl p-5 border border-borderDark mb-6">
      <MotiView
        key={instanceKey}
        from={
          isUnlocked
            ? { opacity: 0, translateY: 10 }
            : { opacity: 1, translateY: 0 }
        }
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 500 }}
      >
        <View>
          <View className="mb-2">
            {hasSpendingData ? (
              <>
                <View className="flex-row items-baseline">
                  {!displayData.isFuture && displayData.label !== "" && (
                    <Text className="text-textDark text-3xl font-bold mr-2">
                      {displayData.label}:
                    </Text>
                  )}
                  <Text className="text-white text-3xl font-bold">
                    {displayData.value}
                  </Text>
                  <Text className="text-slate-500 text-xl font-bold ml-2">
                    spent
                  </Text>
                </View>
                <View
                  className="flex-row items-center mt-0.5"
                  style={{ minHeight: 18 }}
                >
                  {totalBudget > 0 && !displayData.isFuture && (
                    <>
                      <Text
                        style={{
                          color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                          fontSize: 15,
                        }}
                      >
                        {displayData.diffStr}
                      </Text>
                      <Text
                        style={{
                          color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                          fontSize: 15,
                          marginLeft: 2,
                        }}
                      >
                        {displayData.isOverBudget ? "\u25B2" : "\u25BC"}
                      </Text>
                      <Text
                        style={{
                          color: displayData.isOverBudget ? "#ef4444" : "#22c55e",
                          fontSize: 15,
                          fontWeight: "700",
                          marginLeft: 4,
                        }}
                      >
                        {displayData.diffPctStr}
                      </Text>
                      <Text className="text-slate-500 text-sm ml-1.5">
                        {displayData.isOverBudget ? "over budget" : "under budget"}
                      </Text>
                    </>
                  )}
                </View>
              </>
            ) : (
              <>
                <Text className="text-slate-500 text-3xl font-bold">
                  No data
                </Text>
                <View style={{ minHeight: 18 }} />
              </>
            )}
          </View>

          <View className="h-[270px] -ml-2">
            <CartesianChart
              data={smoothData}
              xKey="x"
              yKeys={["amount", "pace"]}
              padding={{ left: 10, right: 10, top: 10, bottom: 30 }}
              domainPadding={{ left: 20, right: 20, top: 20, bottom: 20 }}
              domain={{ y: [0, maxValue] }}
              gestureLongPressDelay={100}
              xAxis={{
                font,
                tickValues: (() => {
                  if (timeFrame === "week") {
                    // All 7 days
                    return cumulativeData.map(
                      (_, i) => i * INTERPOLATION_STEPS,
                    );
                  } else if (timeFrame === "month") {
                    // All 5 week-start dates
                    return cumulativeData.map(
                      (_, i) => i * INTERPOLATION_STEPS,
                    );
                  } else {
                    // Year: show ~5 labels including first and last
                    const indices = [0, 2, 5, 8, 11].filter(
                      (i) => i < cumulativeData.length,
                    );
                    return indices.map((i) => i * INTERPOLATION_STEPS);
                  }
                })(),
                labelColor: "#94a3b8",
                formatXLabel: (v) => {
                  const idx = Math.round(Number(v) / INTERPOLATION_STEPS);
                  if (idx < 0 || idx >= cumulativeData.length) return "";
                  return cumulativeData[idx]?.label || "";
                },
              }}
              yAxis={[
                {
                  font,
                  tickCount: 2,
                  labelOffset: -8,
                  labelColor: "#94a3b8",
                  formatYLabel: (v) => `${currencySymbol}${Math.round(v)}`,
                },
              ]}
              chartPressState={state}
            >
              {({ points }) => {
                // Determine endpoint circle color
                const endpointColor =
                  totalBudget > 0
                    ? smoothData[smoothLastActualIndex]?.isOverBudget
                      ? "#ef4444"
                      : "#22c55e"
                    : "#6366f1";

                const endpointPixel =
                  smoothLastActualIndex >= 0
                    ? points.amount[smoothLastActualIndex]
                    : null;

                // Store endpoint pixel position and over-budget status for tooltip clamping
                if (endpointPixel) {
                  lastActualPixelX.value = endpointPixel.x;
                  lastActualPixelY.value = endpointPixel.y;
                }
                endpointIsOverBudget.value =
                  smoothData[smoothLastActualIndex]?.isOverBudget || false;

                const renderLines = () => (
                  <>
                    {/* White spending line */}
                    <Line
                      points={points.amount.filter(
                        (_, i) => i <= smoothLastActualIndex,
                      )}
                      color="#ffffff"
                      strokeWidth={3}
                      curveType="catmullRom"
                    />
                  </>
                );

                if (!hasSpendingData) return null;

                return (
                  <>
                    {/* Dimmed lines when scrubbing, full opacity otherwise */}
                    <Group opacity={dimmedOpacity}>{renderLines()}</Group>

                    {/* Highlighted section near tooltip at full opacity */}
                    <Group clip={highlightClip} opacity={highlightOpacity}>
                      {renderLines()}
                    </Group>

                    {/* Endpoint circle at cutoff - hidden when tooltip is active */}
                    {endpointPixel && (
                      <Group opacity={endpointOpacity}>
                        <Circle
                          cx={endpointPixel.x}
                          cy={endpointPixel.y}
                          r={5}
                          color={endpointColor}
                        />
                      </Group>
                    )}

                    {/* Tooltip indicator */}
                    <ToolTip
                      x={clampedX}
                      y={clampedY}
                      isActive={state.isActive}
                      isOverBudget={tooltipIsOverBudget}
                      hasBudget={totalBudget > 0}
                      overColor="#ef4444"
                      underColor="#22c55e"
                      defaultColor="#6366f1"
                    />
                  </>
                );
              }}
            </CartesianChart>
          </View>
        </View>
      </MotiView>
    </View>
  );
});
