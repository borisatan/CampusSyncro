import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { Account } from '../types/types';

export const TYPE_CONFIG: { [key: string]: { icon: string } } = {
  checking: { icon: 'card-outline' },
  savings: { icon: 'wallet-outline' },
  investment: { icon: 'trending-up-outline' },
  investments: { icon: 'trending-up-outline' },
  credit: { icon: 'card-outline' },
};

export const TYPE_DEFAULT_COLORS: { [key: string]: string } = {
  checking: '#3B7EFF',
  savings: '#8A00C2',
  investment: '#1DB8A3',
  investments: '#1DB8A3',
  credit: '#F2514A',
};

export const getAccountColor = (account: Account): string =>
  account.color ?? TYPE_DEFAULT_COLORS[account.type?.toLowerCase().trim()] ?? '#3B7EFF';

export const FadeInView = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      delay: delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, delay]);

};
