// components/CustomTabBar.tsx
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

const tabs = [
  { key: 'Home', icon: 'home', href: '/(tabs)/index' },
  { key: 'Calendar', icon: 'calendar', href: '/(tabs)/calendar' },
  { key: 'Add', icon: 'add-circle', href: '/(tabs)/add' },
  { key: 'Settings', icon: 'settings', href: '/(tabs)/settings' },
];

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state }) => {
  const pathname = usePathname();

  return (
    <View className="flex-row bg-white rounded-full mx-6 mb-4 py-2 justify-between items-center shadow-lg absolute bottom-0 left-0 right-0">
      {tabs.map((tab) => {
        // Determine if this tab is active
        const isActive = pathname === tab.href || (tab.href === '/(tabs)/index' && pathname === '/');

        return (
          <Link
            key={tab.key}
            href={tab.href as any}
            className="flex-1 items-center py-1"
            asChild
          >
            <View className="items-center">
              <Ionicons
                name={isActive ? tab.icon : `${tab.icon}-outline` as any}
                size={26}
                color={isActive ? '#2323FF' : '#A0A0B2'}
              />
              <Text className={`text-xs mt-1 ${isActive ? 'text-blue-500' : 'text-gray-500'}`}>
                  {tab.key}
              </Text>
            </View>
          </Link>
        );
      })}
    </View>
  );
};

export default CustomTabBar;