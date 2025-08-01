import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

const tabs = [
  { key: 'Home', icon: 'home', href: '/' },
  { key: 'Calendar', icon: 'calendar', href: '/dashboard' },
  { key: 'Add', icon: 'add-circle', href: '/add-transaction' },
  { key: 'Settings', icon: 'settings', href: '/settings' },
];

const BottomNavigation: React.FC = () => {
  const pathname = usePathname();
  return (
    <View className="flex-row bg-white rounded-full mx-6 mb-4 py-2 justify-between items-center shadow-lg">
      {tabs.map(tab => {
        // Determine if this tab is active
        const isActive = pathname === tab.href || (tab.href === '/' && pathname === '/index');
        return (
          <Link
            key={tab.key}
            href={tab.href as any}
            className="flex-1 items-center py-1"
            asChild
          >
            <View>
              <Ionicons
                name={tab.icon as any}
                size={26}
                color={isActive ? '#2323FF' : '#A0A0B2'}
              />
            </View>
          </Link>
        );
      })}
    </View>
  );
};

export default BottomNavigation; 