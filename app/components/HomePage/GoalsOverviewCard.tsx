import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useDataRefresh } from '../../context/DataRefreshContext';
import { useGoalsStore } from '../../store/useGoalsStore';
import { Account, Goal } from '../../types/types';
import { CreateGoalModal } from '../GoalsPage/CreateGoalModal';
import { EditGoalModal } from '../GoalsPage/EditGoalModal';
import { GoalProgressCard } from '../GoalsPage/GoalProgressCard';

interface GoalsOverviewCardProps {
  currencySymbol: string;
  accounts: Account[];
}

export function GoalsOverviewCard({ currencySymbol, accounts }: GoalsOverviewCardProps) {
  const { goals, loadGoals, isLoading } = useGoalsStore();
  const { registerGoalsRefresh } = useDataRefresh();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const handleGoalPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowEditModal(true);
  };

  useEffect(() => {
    loadGoals();
    registerGoalsRefresh(loadGoals);
  }, []);

  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Calculate overall progress
  const totalTarget = goals.reduce((sum, g) => sum + g.target_amount, 0);
  const totalCurrent = goals.reduce((sum, g) => sum + g.current_amount, 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  // Separate active and completed goals
  const activeGoals = goals.filter((g) => g.current_amount < g.target_amount);
  const completedGoals = goals.filter((g) => g.current_amount >= g.target_amount);

  if (goals.length === 0) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setShowCreateModal(true)}
          className="bg-surfaceDark rounded-2xl p-4 mb-4 border border-slate-700/50"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
                <Ionicons name="flag-outline" size={20} color="#a78bfa" />
              </View>
              <View>
                <Text className="text-white font-semibold">Savings Goals</Text>
                <Text className="text-secondaryDark text-sm">Tap to create your first goal</Text>
              </View>
            </View>
            <Ionicons name="add-circle-outline" size={24} color="#a78bfa" />
          </View>
        </TouchableOpacity>

        <CreateGoalModal
          visible={showCreateModal}
          accounts={accounts}
          currencySymbol={currencySymbol}
          onClose={() => setShowCreateModal(false)}
          onGoalCreated={loadGoals}
        />
      </>
    );
  }

  return (
    <>
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300 }}
        className="bg-surfaceDark rounded-2xl p-4 mb-4 border border-slate-700/50"
      >
        {/* Header */}
        <TouchableOpacity
          onPress={() => setIsExpanded(!isExpanded)}
          className="flex-row items-center justify-between mb-3"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-purple-500/20 items-center justify-center mr-3">
              <Ionicons name="flag" size={20} color="#a78bfa" />
            </View>
            <View>
              <Text className="text-white font-semibold">Savings Goals</Text>
              <Text className="text-secondaryDark text-sm">
                {formatCurrency(totalCurrent)} of {formatCurrency(totalTarget)}
              </Text>
            </View>
          </View>
          <View className="flex-row items-center">
            <Text className="text-purple-400 font-semibold mr-2">
              {Math.round(overallProgress)}%
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#64748B"
            />
          </View>
        </TouchableOpacity>

        {/* Overall progress bar */}
        <View className="h-2 bg-gray-700 rounded-full overflow-hidden mb-3">
          <View
            className="h-full rounded-full bg-purple-500"
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </View>

        {/* Expanded content */}
        {isExpanded && (
          <MotiView
            from={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ type: 'timing', duration: 200 }}
          >
            {/* Active Goals */}
            {activeGoals.length > 0 && (
              <View className="mt-2">
                <Text className="text-secondaryDark text-xs uppercase mb-2">
                  Active ({activeGoals.length})
                </Text>
                {activeGoals.map((goal) => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    currencySymbol={currencySymbol}
                    onPress={() => handleGoalPress(goal)}
                    compact
                  />
                ))}
              </View>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
              <View className="mt-3">
                <Text className="text-secondaryDark text-xs uppercase mb-2">
                  Completed ({completedGoals.length})
                </Text>
                {completedGoals.map((goal) => (
                  <GoalProgressCard
                    key={goal.id}
                    goal={goal}
                    currencySymbol={currencySymbol}
                    onPress={() => handleGoalPress(goal)}
                    compact
                  />
                ))}
              </View>
            )}

            {/* Add Goal Button */}
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              className="flex-row items-center justify-center py-3 mt-3 border border-dashed border-purple-500/30 rounded-xl"
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color="#a78bfa" />
              <Text className="text-purple-400 ml-2">Add New Goal</Text>
            </TouchableOpacity>
          </MotiView>
        )}
      </MotiView>

      <CreateGoalModal
        visible={showCreateModal}
        accounts={accounts}
        currencySymbol={currencySymbol}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={loadGoals}
      />

      <EditGoalModal
        visible={showEditModal}
        goal={selectedGoal}
        currencySymbol={currencySymbol}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGoal(null);
        }}
        onGoalUpdated={loadGoals}
      />
    </>
  );
}
