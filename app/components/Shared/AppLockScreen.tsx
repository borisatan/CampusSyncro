import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useLock } from '../../context/LockContext';

type AuthMethod = 'biometric' | 'pin' | 'password';

export default function AppLockScreen() {
  const {
    isLocked,
    unlock,
    unlockWithPin,
    unlockWithCredentials,
    biometricAvailable,
    hasPinSet
  } = useLock();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('biometric');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Load saved email for convenience
  useEffect(() => {
    const loadEmail = async () => {
      const storedEmail = await SecureStore.getItemAsync('email');
      if (storedEmail) setEmail(storedEmail);
    };
    loadEmail();
  }, []);

  // Auto-prompt for biometrics when lock screen appears
  useEffect(() => {
    if (isLocked && biometricAvailable && authMethod === 'biometric') {
      const timer = setTimeout(() => {
        unlock();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLocked, biometricAvailable, authMethod, unlock]);

  // Set default auth method based on availability
  useEffect(() => {
    if (biometricAvailable) {
      setAuthMethod('biometric');
    } else if (hasPinSet) {
      setAuthMethod('pin');
    } else {
      setAuthMethod('password');
    }
  }, [biometricAvailable, hasPinSet]);

  const handlePinSubmit = async () => {
    if (pin.length < 4) {
      setPinError(true);
      return;
    }
    setIsSubmitting(true);
    setPinError(false);
    const success = await unlockWithPin(pin);
    if (!success) {
      setPinError(true);
      setPin('');
    }
    setIsSubmitting(false);
  };

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

  const handlePinChange = (value: string) => {
    // Only allow numbers and max 6 digits
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 6);
    setPin(cleaned);
    setPinError(false);
  };

  if (!isLocked) {
    return null;
  }

  return (
    <View
      className="absolute inset-0 bg-backgroundDark z-50"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}
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
          {biometricAvailable && (
            <TouchableOpacity
              onPress={() => setAuthMethod('biometric')}
              className={`flex-1 py-3 rounded-xl ${authMethod === 'biometric' ? 'bg-accentBlue' : ''}`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="finger-print"
                  size={18}
                  color={authMethod === 'biometric' ? '#fff' : '#94a3b8'}
                />
                <Text className={authMethod === 'biometric' ? 'text-white font-medium' : 'text-slate-400'}>
                  Biometric
                </Text>
              </View>
            </TouchableOpacity>
          )}
          {hasPinSet && (
            <TouchableOpacity
              onPress={() => setAuthMethod('pin')}
              className={`flex-1 py-3 rounded-xl ${authMethod === 'pin' ? 'bg-accentBlue' : ''}`}
            >
              <View className="flex-row items-center justify-center gap-2">
                <Ionicons
                  name="keypad"
                  size={18}
                  color={authMethod === 'pin' ? '#fff' : '#94a3b8'}
                />
                <Text className={authMethod === 'pin' ? 'text-white font-medium' : 'text-slate-400'}>
                  PIN
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

        {/* Biometric Auth */}
        {authMethod === 'biometric' && (
          <View className="w-full items-center">
            <Pressable
              onPress={unlock}
              className="bg-accentBlue px-8 py-4 rounded-2xl flex-row items-center gap-3"
            >
              <Ionicons name="finger-print" size={24} color="white" />
              <Text className="text-white font-semibold text-lg">
                Unlock with Biometrics
              </Text>
            </Pressable>
            <Text className="text-secondaryDark text-sm mt-4 text-center">
              Tap to authenticate with fingerprint or Face ID
            </Text>
          </View>
        )}

        {/* PIN Auth */}
        {authMethod === 'pin' && (
          <View className="w-full">
            <Text className="text-white mb-2">Enter your PIN</Text>
            <TextInput
              value={pin}
              onChangeText={handlePinChange}
              placeholder="Enter PIN"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              className={`bg-slate-800 text-white text-center text-2xl tracking-widest px-4 py-4 rounded-xl border ${
                pinError ? 'border-red-500' : 'border-slate-700'
              }`}
            />
            {pinError && (
              <Text className="text-red-500 text-sm mt-2 text-center">
                Incorrect PIN. Please try again.
              </Text>
            )}
            <Pressable
              onPress={handlePinSubmit}
              disabled={isSubmitting || pin.length < 4}
              className={`mt-4 py-4 rounded-xl items-center ${
                isSubmitting || pin.length < 4 ? 'bg-slate-700' : 'bg-accentBlue'
              }`}
            >
              <Text className="text-white font-semibold">
                {isSubmitting ? 'Verifying...' : 'Unlock'}
              </Text>
            </Pressable>
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
    </View>
  );
}
