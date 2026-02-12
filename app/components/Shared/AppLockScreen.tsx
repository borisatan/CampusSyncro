import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLock } from '../../context/LockContext';

type AuthMethod = 'device' | 'password';

export default function AppLockScreen() {
  const {
    isLocked,
    unlock,
    unlockWithCredentials,
    deviceAuthAvailable,
  } = useLock();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('device');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved email for convenience
  useEffect(() => {
    const loadEmail = async () => {
      const storedEmail = await SecureStore.getItemAsync('email');
      if (storedEmail) setEmail(storedEmail);
    };
    loadEmail();
  }, []);

  // Auto-prompt for device authentication when lock screen appears
  useEffect(() => {
    if (isLocked && deviceAuthAvailable && authMethod === 'device') {
      const timer = setTimeout(() => {
        unlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, deviceAuthAvailable, authMethod, unlock]);

  // Set default auth method based on availability
  useEffect(() => {
    if (deviceAuthAvailable) {
      setAuthMethod('device');
    } else {
      setAuthMethod('password');
    }
  }, [deviceAuthAvailable]);

  const handlePasswordSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter email and password.');
      return;
    }
    setIsSubmitting(true);
    const success = await unlockWithCredentials(email, password);
    if (!success) {
      Alert.alert('Authentication Failed', 'Invalid email or password.');
    }
    setIsSubmitting(false);
  };

  if (!isLocked) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 bg-backgroundDark z-50"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
        {/* App Icon/Logo */}
        <View className="w-24 h-24 bg-accentBlue/20 rounded-3xl items-center justify-center mb-6">
          <Ionicons name="wallet" size={48} color="#4A90D9" />
        </View>

        {/* App Name */}
        <Text className="text-white text-3xl font-bold mb-2">Perfin</Text>
        <Text className="text-secondaryDark text-base mb-8">Your finances are locked</Text>

        {/* Auth Method Tabs */}
        <View className="flex-row bg-slate-800 rounded-2xl p-1 mb-6 w-full">
          {deviceAuthAvailable && (
            <TouchableOpacity
              onPress={() => setAuthMethod('device')}
              className={`flex-1 py-3 rounded-xl ${authMethod === 'device' ? 'bg-accentBlue' : ''}`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="finger-print"
                  size={18}
                  color={authMethod === 'device' ? '#fff' : '#94a3b8'}
                />
                <Text className={authMethod === 'device' ? 'text-white font-medium' : 'text-slate-400'}>
                  Biometric
                </Text>
              </View>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => setAuthMethod('password')}
            className={`flex-1 py-3 rounded-xl ${authMethod === 'password' ? 'bg-accentBlue' : ''}`}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Ionicons
                name="mail"
                size={18}
                color={authMethod === 'password' ? '#fff' : '#94a3b8'}
              />
              <Text className={authMethod === 'password' ? 'text-white font-medium' : 'text-slate-400'}>
                Password
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Device Auth (biometrics with device PIN fallback) */}
        {authMethod === 'device' && (
          <View className="w-full items-center">
            <Pressable
              onPress={unlock}
              className="bg-accentBlue px-8 py-4 rounded-2xl flex-row items-center gap-3"
            >
              <Ionicons name="finger-print" size={24} color="white" />
              <Text className="text-white font-semibold text-lg">
                Unlock
              </Text>
            </Pressable>
            <Text className="text-secondaryDark text-sm mt-4 text-center">
              Authenticate with fingerprint, Face ID, or your device PIN
            </Text>
          </View>
        )}

        {/* Password Auth */}
        {authMethod === 'password' && (
          <View className="w-full">
            <Text className="text-white mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 mb-4"
            />

            <Text className="text-white mb-2">Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              secureTextEntry
              autoCapitalize="none"
              className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700"
            />

            <Pressable
              onPress={handlePasswordSubmit}
              disabled={isSubmitting}
              className={`mt-4 py-4 rounded-xl items-center ${
                isSubmitting ? 'bg-slate-700' : 'bg-accentBlue'
              }`}
            >
              <Text className="text-white font-semibold">
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Text>
            </Pressable>
          </View>
        )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
