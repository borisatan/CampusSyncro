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
  deviceAuthAvailable: boolean;
  unlock: () => Promise<boolean>;
  unlockWithCredentials: (email: string, password: string) => Promise<boolean>;
  setAppLockEnabled: (enabled: boolean) => Promise<void>;
};

const LockContext = createContext<LockContextValue>({
  isLocked: false,
  isUnlocked: false,
  isAppLockEnabled: false,
  deviceAuthAvailable: false,
  unlock: async () => false,
  unlockWithCredentials: async () => false,
  setAppLockEnabled: async () => {},
});

const APP_LOCK_KEY = 'app_lock_enabled';

export const LockProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoading: authLoading } = useAuth();
  const [isLocked, setIsLocked] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false); // Tracks if user has authenticated this session
  const [isAppLockEnabled, setIsAppLockEnabledState] = useState(false);
  const [deviceAuthAvailable, setDeviceAuthAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const appState = useRef(AppState.currentState);

  // Check device authentication availability and load settings
  useEffect(() => {
    const initialize = async () => {
      // Check if device has any authentication method available (biometrics or passcode)
      const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();
      // SECURITY_LEVEL_NONE = 0, SECURITY_LEVEL_SECRET = 1 (PIN/pattern), SECURITY_LEVEL_BIOMETRIC = 2
      const available = securityLevel > 0;
      setDeviceAuthAvailable(available);

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

  // Unlock using device authentication (biometrics or device PIN/passcode)
  const unlock = useCallback(async (): Promise<boolean> => {
    if (!deviceAuthAvailable) {
      // If no device auth available, user must use password
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Monelo',
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow device PIN/passcode as fallback
    });

    if (result.success) {
      setIsLocked(false);
      setIsUnlocked(true);
      return true;
    }
    return false;
  }, [deviceAuthAvailable]);

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
    deviceAuthAvailable,
    unlock,
    unlockWithCredentials,
    setAppLockEnabled,
  }), [isLocked, isUnlocked, isAppLockEnabled, deviceAuthAvailable, unlock, unlockWithCredentials, setAppLockEnabled, isInitialized, userId]);

  return <LockContext.Provider value={value}>{children}</LockContext.Provider>;
};

export const useLock = () => useContext(LockContext);
