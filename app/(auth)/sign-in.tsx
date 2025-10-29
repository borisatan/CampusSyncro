import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }
    try {
      setIsSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        Alert.alert('Sign in failed', error.message);
        return;
      }
      router.replace('/(tabs)/dashboard');
    } catch (e: any) {
      Alert.alert('Sign in failed', e?.message ?? 'Unknown error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className={isDarkMode ? 'flex-1 bg-surfaceDark px-6 py-10' : 'flex-1 bg-white px-6 py-10'}>
      <View className="mt-8">
        <Text className={isDarkMode ? 'text-2xl font-bold text-white' : 'text-2xl font-bold text-black'}>
          Welcome back
        </Text>
        <Text className={isDarkMode ? 'text-secondaryDark mt-1' : 'text-secondaryLight mt-1'}>
          Sign in to continue
        </Text>
      </View>

      <View className="mt-8 gap-5">
        <View>
          <Text className={isDarkMode ? 'text-white mb-2' : 'text-black mb-2'}>Email</Text>
          <TextInput
            className={isDarkMode ? 'bg-inputDark text-white px-4 py-3 rounded-xl border border-borderDark' : 'bg-background text-black px-4 py-3 rounded-xl border border-borderLight'}
            placeholder="you@example.com"
            placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View>
          <Text className={isDarkMode ? 'text-white mb-2' : 'text-black mb-2'}>Password</Text>
          <TextInput
            className={isDarkMode ? 'bg-inputDark text-white px-4 py-3 rounded-xl border border-borderDark' : 'bg-background text-black px-4 py-3 rounded-xl border border-borderLight'}
            placeholder="••••••••"
            placeholderTextColor={isDarkMode ? '#AAAAAA' : '#888888'}
            secureTextEntry
            autoCapitalize="none"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <Pressable
          onPress={handleSignIn}
          disabled={isSubmitting}
          className={isDarkMode ? 'bg-accentBlue rounded-xl py-4 items-center mt-2' : 'bg-accentBlue rounded-xl py-4 items-center mt-2'}>
          <Text className="text-white font-semibold">{isSubmitting ? 'Signing in…' : 'Sign In'}</Text>
        </Pressable>

        <View className="flex-row justify-center mt-2">
          <Text className={isDarkMode ? 'text-secondaryDark' : 'text-secondaryLight'}>Don’t have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable>
              <Text className="text-accentTeal font-semibold">Sign Up</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}


