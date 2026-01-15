import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../utils/supabase';
import { useAuth } from './AuthContext';

type LockContextValue = {
  isLocked: boolean;
  isUnlocked: boolean; // True once user has authenticated (or app lock disabled)
  isAppLockEnabled: boolean;
  biometricAvailable: boolean;
  hasPinSet: boolean;
  unlock: () => Promise<boolean>;
  unlockWithPin: (pin: string) => Promise<boolean>;
  unlockWithCredentials: (email: string, password: string) => Promise<boolean>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
  setPin: (pin: string) => Promise<void>;
  removePin: () => Promise<void>;
};

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  isUnlocked: false,
  isAppLockEnabled: false,
  biometricAvailable: false,
  hasPinSet: false,
  unlock: async () => false,
  unlockWithPin: async () => false,
  unlockWithCredentials: async () => false,
  setAppLockEnabled: async () => {},
  setPin: async () => {},
  removePin: async () => {},
});

const APP_LOCK_KEY = 'app_lock_enabled';
const PIN_KEY = 'app_pin';

export const LockProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoading: authLoading } = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false); // Tracks if user has authenticated this session
  const [isAppLockEnabled, setIsAppLockEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef(AppState.currentState);

  // Check biometric availability and load settings
  useEffect(() => {
    const initialize = async () => {
      // Check biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supported = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const available = hasHardware && enrolled && supported.length > 0;
      setBiometricAvailable(available);

      // Check if PIN is set
      const storedPin = await SecureStore.getItemAsync(PIN_KEY);
      setHasPinSet(!!storedPin);

      // Load app lock preference (default to ON if not set)
      const storedPref = await SecureStore.getItemAsync(APP_LOCK_KEY);
      const enabled = storedPref === null ? true : storedPref === 'true';
      setIsAppLockEnabledState(enabled);

      // Save default preference if not set
      if (storedPref === null) {
        await SecureStore.setItemAsync(APP_LOCK_KEY, 'true');
      }

      // If app lock is enabled and user is authenticated, start locked
      // If app lock is disabled, start unlocked
      const shouldBeLocked = enabled && !!userId;
      setIsLocked(shouldBeLocked);
      // If not locked (app lock disabled), mark as unlocked immediately
      if (!shouldBeLocked) {
        setIsUnlocked(true);
      }
      setIsInitialized(true);
    };

    if (!authLoading) {
      initialize();
    }
  }, [authLoading, userId]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      // Lock when app goes to background and comes back
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        // App is going to background - lock if enabled
        if (isAppLockEnabled && userId) {
          setIsLocked(true);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isAppLockEnabled, userId]);

  // Unlock using biometrics
  const unlock = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable) {
      // If no biometrics available, don't auto-unlock - user must use PIN or credentials
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Perfin',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      setIsLocked(false);
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [biometricAvailable]);

  // Unlock using PIN
  const unlockWithPin = useCallback(async (pin: string): Promise<boolean> => {
    const storedPin = await SecureStore.getItemAsync(PIN_KEY);
    if (storedPin && storedPin === pin) {
      setIsLocked(false);
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, []);

  // Unlock using email/password (re-authenticate with Supabase)
  const unlockWithCredentials = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        setIsLocked(false);
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Set a new PIN
  const setPin = useCallback(async (pin: string): Promise<void> => {
    await SecureStore.setItemAsync(PIN_KEY, pin);
    setHasPinSet(true);
  }, []);

  // Remove PIN
  const removePin = useCallback(async (): Promise<void> => {
    await SecureStore.deleteItemAsync(PIN_KEY);
    setHasPinSet(false);
  }, []);

  // Enable/disable app lock
  const setAppLockEnabled = useCallback(async (enabled: boolean) => {
    // Update state immediately to prevent toggle glitch
    setIsAppLockEnabledState(enabled);
    if (!enabled) {
      setIsLocked(false);
      setIsUnlocked(true);
    }
    // Then persist to storage
    await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
  }, []);

  const value = useMemo(() => ({
    isLocked: isInitialized && isAppLockEnabled && isLocked && !!userId,
    isUnlocked,
    isAppLockEnabled,
    biometricAvailable,
    hasPinSet,
    unlock,
    unlockWithPin,
    unlockWithCredentials,
    setAppLockEnabled,
    setPin,
    removePin,
  }), [isLocked, isUnlocked, isAppLockEnabled, biometricAvailable, hasPinSet, unlock, unlockWithPin, unlockWithCredentials, setAppLockEnabled, setPin, removePin, isInitialized, userId]);

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
};

export const useLock = () => useContext(LockContext);
