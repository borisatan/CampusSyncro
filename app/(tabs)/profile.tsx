import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

export default function ProfileScreen() {
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
    })();
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert('Sign out failed', error.message);
        return;
      }
      router.replace('/(auth)/sign-in');
    } catch (e: any) {
      Alert.alert('Sign out failed', e?.message ?? 'Unknown error');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView className={isDarkMode ? 'flex-1 bg-backgroundDark px-6 py-6' : 'flex-1 bg-background px-6 py-6'}>
      <View className="mt-2 mb-8 items-center">
        <Text className={isDarkMode ? 'text-3xl font-bold text-white' : 'text-3xl font-bold text-black'}>
          Profile
        </Text>
        <Text className={isDarkMode ? 'text-secondaryDark mt-2' : 'text-secondaryLight mt-2'}>
          Manage your account
        </Text>
      </View>

      <View className={isDarkMode ? 'bg-surfaceDark rounded-2xl p-5 mb-6 border border-borderDark' : 'bg-white rounded-2xl p-5 mb-6 border border-borderLight'}>
        <Text className={isDarkMode ? 'text-secondaryDark text-xs' : 'text-secondaryLight text-xs'}>
          Email
        </Text>
        <Text className={isDarkMode ? 'text-white text-lg mt-1' : 'text-black text-lg mt-1'}>
          {email ?? '—'}
        </Text>
      </View>

      <Pressable onPress={handleSignOut} disabled={isSigningOut} className="bg-accentRed rounded-xl py-4 items-center">
        <Text className="text-white font-semibold">{isSigningOut ? 'Signing out…' : 'Sign Out'}</Text>
      </Pressable>
    </SafeAreaView>
  );
}


