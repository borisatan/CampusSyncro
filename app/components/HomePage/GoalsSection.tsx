import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useAuth } from '../../context/AuthContext';
import { useAccountsStore } from '../../store/useAccountsStore';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Account } from '../../types/types';
import { CreateGoalModal } from '../GoalsPage/CreateGoalModal';
import { GoalDetailModal } from '../GoalsPage/GoalDetailModal';
import { GoalProgressCard } from '../GoalsPage/GoalProgressCard';

interface GoalsSectionProps {
  currencySymbol: string;
  accounts: Account[];
  onTransactionComplete?: () => void;
}

function AnimatedDot({ index, currentPage }: { index: number; currentPage: ReturnType<typeof useSharedValue<number>> }) {
  const active = useDerivedValue(() =>
    withTiming(currentPage.value === index ? 1 : 0, { duration: 200 })
  );
  const style = useAnimatedStyle(() => ({
    width: 6 + active.value * 10,
    backgroundColor: interpolateColor(active.value, [0, 1], ['#374151', '#a78bfa']),
  }));
  return <Animated.View style={[{ height: 6, borderRadius: 3 }, style]} />;
}

export function GoalsSection({ currencySymbol, accounts, onTransactionComplete }: GoalsSectionProps) {
  const { isGuest } = useAuth();
  const { goals, loadGoals } = useGoalsStore();
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 16; // 8px padding each side (dashboard px-2)

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const translateX = useSharedValue(0);
  const currentPage = useSharedValue(0);
  const goalCount = useSharedValue(goals.length);

  useEffect(() => {
    if (!isGuest) loadGoals();
  }, []);

  useEffect(() => {
    goalCount.value = goals.length;
    if (currentPage.value >= goals.length && goals.length > 0) {
      const newPage = goals.length - 1;
      currentPage.value = newPage;
      translateX.value = withSpring(-newPage * cardWidth, { damping: 22, stiffness: 180, mass: 0.5 });
    }
  }, [goals.length, cardWidth]);

  const panGesture = useMemo(() => Gesture.Pan()
    .activeOffsetX([-5, 5])
    .failOffsetY([-20, 20])
    .onUpdate((e) => {
      const base = -currentPage.value * cardWidth;
      const next = base + e.translationX;
      const min = -(goalCount.value - 1) * cardWidth;
      if (next > 0) {
        translateX.value = next * 0.2;
      } else if (next < min) {
        translateX.value = min + (next - min) * 0.2;
      } else {
        translateX.value = next;
      }
    })
    .onEnd((e) => {
      const vx = e.velocityX;
      let page = currentPage.value;
      if (vx < -200) {
        page = Math.min(page + 1, goalCount.value - 1);
      } else if (vx > 200) {
        page = Math.max(page - 1, 0);
      } else {
        const dragged = -translateX.value - currentPage.value * cardWidth;
        if (dragged > cardWidth * 0.25) page = Math.min(page + 1, goalCount.value - 1);
        else if (dragged < -cardWidth * 0.25) page = Math.max(page - 1, 0);
      }
      currentPage.value = page;
      translateX.value = withSpring(-page * cardWidth, { velocity: vx, damping: 26, stiffness: 260, mass: 0.4 });
    }), [cardWidth]);

  const carouselStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const selectedGoal = goals.find((g) => g.id === selectedGoalId) ?? null;

  return (
    <View className="mb-5">
      {/* Section header */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-white text-base font-bold">Savings Goals</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowCreateModal(true);
          }}
          className="flex-row items-center gap-1 px-3 py-1.5 rounded-lg bg-surfaceDark border border-borderDark"
          activeOpacity={0.7}
        >
          <Text className="text-white text-sm font-medium">New Goal</Text>
        </TouchableOpacity>
      </View>

      {goals.length === 0 ? (
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="rounded-2xl border border-borderDark bg-surfaceDark p-5 items-center"
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <Text className="text-purple-400 font-bold text-sm mb-1">Create your first goal</Text>
          <Text className="text-slateMuted text-xs font-semibold">Emergency fund, vacation, new car...</Text>
        </Pressable>
      ) : (
        <View style={{ overflow: 'hidden' }}>
          <View className="rounded-2xl overflow-hidden border border-borderDark bg-surfaceDark">
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[{ flexDirection: 'row', width: cardWidth * goals.length }, carouselStyle]}>
                {goals.map((goal) => (
                  <View key={goal.id} style={{ width: cardWidth }}>
                    <GoalProgressCard
                      goal={goal}
                      currencySymbol={currencySymbol}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedGoalId(goal.id);
                      }}
                      noBg
                    />
                  </View>
                ))}
              </Animated.View>
            </GestureDetector>
            {goals.length > 1 && (
              <View className="flex-row justify-center pb-3 gap-1.5">
                {goals.map((_, i) => (
                  <AnimatedDot key={i} index={i} currentPage={currentPage} />
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      <GoalDetailModal
        visible={selectedGoalId !== null}
        goal={selectedGoal}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onClose={() => setSelectedGoalId(null)}
        onTransactionComplete={() => {
          loadGoals();
          onTransactionComplete?.();
        }}
        onGoalUpdated={loadGoals}
      />

      <CreateGoalModal
        visible={showCreateModal}
        currencySymbol={currencySymbol}
        existingNames={goals.map((g) => g.name)}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={loadGoals}
      />
    </View>
  );
}
