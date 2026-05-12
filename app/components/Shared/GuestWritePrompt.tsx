import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingStore } from '../../store/useOnboardingStore';

interface GuestWritePromptProps {
  visible: boolean;
  onDismiss: () => void;
}

export const GuestWritePrompt = ({ visible, onDismiss }: GuestWritePromptProps) => {
  const router = useRouter();
  const { exitGuestMode } = useAuth();

  const handleCreateAccount = async () => {
    onDismiss();
    await exitGuestMode();
    const { hasCompletedOnboarding, hasPersistedOnboardingData } = useOnboardingStore.getState();
    if (hasCompletedOnboarding && !hasPersistedOnboardingData) {
      router.replace('/(auth)/sign-up?from=onboarding' as any);
    } else {
      router.replace('/(onboarding)/welcome');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <Pressable
        className="flex-1 justify-end"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onPress={onDismiss}
      >
        <Pressable onPress={(e) => e.stopPropagation()}>
          <View
            className="rounded-t-3xl px-6 pt-6 pb-10"
            style={{ backgroundColor: '#20283A' }}
          >
            <View className="items-center mb-5">
              <View
                className="w-14 h-14 rounded-full items-center justify-center mb-4"
                style={{ backgroundColor: '#2A3450' }}
              >
                <Ionicons name="lock-closed" size={26} color="#4F8EF7" />
              </View>
              <Text className="text-textDark text-xl font-bold mb-2">
                Sign up to save your data
              </Text>
              <Text className="text-secondaryDark text-sm text-center leading-5">
                Changes won't be saved in guest mode. Create a free account to keep everything.
              </Text>
            </View>

            <Pressable
              onPress={handleCreateAccount}
              className="rounded-2xl py-4 items-center mb-3 active:opacity-80"
              style={{ backgroundColor: '#4F8EF7' }}
            >
              <Text className="text-white font-semibold text-base">Create Account</Text>
            </Pressable>

            <Pressable
              onPress={onDismiss}
              className="rounded-2xl py-4 items-center active:opacity-60"
            >
              <Text className="text-secondaryDark text-base">Maybe later</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
