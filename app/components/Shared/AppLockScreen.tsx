import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLock } from '../../context/LockContext';

export default function AppLockScreen() {
  const { isLocked, unlock, biometricAvailable } = useLock();

  // Auto-prompt for biometrics when lock screen appears
  useEffect(() => {
    if (isLocked && biometricAvailable) {
      // Small delay to ensure the screen is rendered
      const timer = setTimeout(() => {
        unlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, biometricAvailable, unlock]);

  if (!isLocked) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 bg-backgroundDark z-50 items-center justify-center"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <View className="items-center">
        {/* App Icon/Logo */}
        <View className="w-24 h-24 bg-accentBlue/20 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="wallet" size={48} color="#4A90D9" />
        </View>

        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-2">Perfin</Text>
        <Text className="text-secondaryDark text-base mb-12">Your finances are locked</Text>

        {/* Unlock Button */}
        <Pressable
          onPress={unlock}
          className="bg-accentBlue px-8 py-4 rounded-2xl flex-row items-center gap-3"
        >
          <Ionicons
            name={biometricAvailable ? "finger-print" : "lock-open"}
            size={24}
            color="white"
          />
          <Text className="text-white font-semibold text-lg">
            {biometricAvailable ? 'Unlock with Biometrics' : 'Unlock'}
          </Text>
        </Pressable>

        {/* Hint */}
        <Text className="text-secondaryDark text-sm mt-8 text-center px-8">
          Tap to authenticate with {biometricAvailable ? 'fingerprint or Face ID' : 'your device passcode'}
        </Text>
      </View>
    </View>
  );
}
