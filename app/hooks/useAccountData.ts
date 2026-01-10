import { Building2, CreditCard, PiggyBank, TrendingUp } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export const TYPE_CONFIG: { [key: string]: { icon: string; color: string } } = {
  checking: { icon: 'credit-card', color: 'blue' },
  savings: { icon: 'piggy-bank', color: 'purple' },
  investment: { icon: 'trending-up', color: 'teal' },
  investments: { icon: 'trending-up', color: 'teal' },
  credit: { icon: 'credit-card', color: 'red' },
};

export const ICON_MAP: { [key: string]: any } = {
  'credit-card': CreditCard,
  'piggy-bank': PiggyBank,
  'trending-up': TrendingUp,
  'building': Building2,
};

export const COLOR_MAP: { [key: string]: string } = {
  blue: 'bg-accentBlue',
  teal: 'bg-accentTeal',
  red: 'bg-accentRed',
  purple: 'bg-accentPurple',
};

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