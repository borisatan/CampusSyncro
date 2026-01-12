import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { AnimatedRollingNumber } from 'react-native-animated-rolling-numbers';
import { Easing } from 'react-native-reanimated';

interface SummaryProps {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  currencySymbol: string;
}

export const DashboardSummary = ({ totalBalance, totalIncome, totalExpenses, currencySymbol }: SummaryProps) => {
  return (
        <View className=" flex-col  mb-2">
            <View className="flex-1  rounded-2xl p-2 shadow-sm mb-1">
                <Text className="text-textDark text-2xl  font-semibold opacity-90">Total Balance</Text>
                <View className="flex-row items-center">
                  <Text
                    style={{
                      fontSize: 48,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                  >
                    {currencySymbol}
                  </Text>
                  <AnimatedRollingNumber
                    value={totalBalance}
                    spinningAnimationConfig={{ duration: 1200, easing: Easing.bounce }}
                    textStyle={{
                      fontSize: 48,
                      fontWeight: '700',
                      color: '#FFFFFF',
                    }}
                    toFixed={2}
                  />
                </View>
            </View>
        <View className="flex-row gap-4 mb-3">
          <View className="flex-1 bg-accentTeal rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
              <TrendingUp color="#fff" size={16} />
              <Text className="text-textDark text-lg font-medium opacity-90">Income</Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                {currencySymbol}
              </Text>
              <AnimatedRollingNumber
                value={totalIncome}
                spinningAnimationConfig={{ duration: 1200, easing: Easing.bounce }}
                textStyle={{
                  fontSize: 30,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
                toFixed={2}
              />
            </View>
          </View>

          <View className="flex-1 bg-accentRed rounded-2xl p-4 shadow-sm border border-borderDark">
            <View className="flex-row items-center gap-2 mb-2">
              <TrendingDown color="#fff" size={16} />
              <Text className="text-textDark text-lg font-medium opacity-90">Expenses</Text>
            </View>
            <View className="flex-row items-center">
              <Text
                style={{
                  fontSize: 30,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
              >
                {currencySymbol}
              </Text>
              <AnimatedRollingNumber
                value={Math.abs(totalExpenses)}
                spinningAnimationConfig={{ duration: 1200, easing: Easing.bounce}}
                textStyle={{
                  fontSize: 30,
                  fontWeight: '700',
                  color: '#FFFFFF',
                }}
                toFixed={2}
              />
            </View>
          </View>
        </View>
    </View>
  );
};