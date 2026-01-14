import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuth } from './AuthContext';

type LockContextValue = {
  isLocked: boolean;
  isAppLockEnabled: boolean;
  biometricAvailable: boolean;
  unlock: () => Promise<boolean>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
};

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  isAppLockEnabled: false,
  biometricAvailable: false,
  unlock: async () => false,
  setAppLockEnabled: async () => {},
});

const APP_LOCK_KEY = 'app_lock_enabled';

export const LockProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoading: authLoading } = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [isAppLockEnabled, setIsAppLockEnabledState] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
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
      setIsLocked(enabled && !!userId);
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
      // If no biometrics, just unlock (fallback)
      setIsLocked(false);
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Perfin',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [biometricAvailable]);

  // Enable/disable app lock
  const setAppLockEnabled = useCallback(async (enabled: boolean) => {
    // Update state immediately to prevent toggle glitch
    setIsAppLockEnabledState(enabled);
    if (!enabled) {
      setIsLocked(false);
    }
    // Then persist to storage
    await SecureStore.setItemAsync(APP_LOCK_KEY, enabled ? 'true' : 'false');
  }, []);

  const value = useMemo(() => ({
    isLocked: isInitialized && isAppLockEnabled && isLocked && !!userId,
    isAppLockEnabled,
    biometricAvailable,
    unlock,
    setAppLockEnabled,
  }), [isLocked, isAppLockEnabled, biometricAvailable, unlock, setAppLockEnabled, isInitialized, userId]);

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
};

export const useLock = () => useContext(LockContext);
