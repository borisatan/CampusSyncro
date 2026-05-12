import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { persistOnboardingData } from '../services/onboardingService';
import { ensureUserProfile } from '../services/backendService';
import { useAccountsStore } from '../store/useAccountsStore';
import { useAppTourStore } from '../store/useAppTourStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { supabase } from '../utils/supabase';

const GUEST_MODE_KEY = '@monelo_guest_mode';

type AuthContextValue = {
  userId: string | null;
  isLoading: boolean;
  isGuest: boolean;
  enterGuestMode: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  isLoading: true,
  isGuest: false,
  enterGuestMode: async () => {},
  exitGuestMode: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  const enterGuestMode = async () => {
    await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  };

  const exitGuestMode = async () => {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  };

  useEffect(() => {
    let isMounted = true;
    let initialLoadComplete = false;

    const loadUser = async () => {
      try {
        const [{ data }, guestFlag] = await Promise.all([
          supabase.auth.getUser(),
          AsyncStorage.getItem(GUEST_MODE_KEY),
        ]);
        if (!isMounted) return;

        if (data.user?.id) {
          // Real auth always wins — clear any stale guest flag
          await AsyncStorage.removeItem(GUEST_MODE_KEY);
          setUserId(data.user.id);
          setIsGuest(false);
        } else if (guestFlag === 'true') {
          setIsGuest(true);
        }
      } catch (error: any) {
        if (error?.message?.includes('Refresh Token')) {
          await supabase.auth.signOut();
        }
        if (isMounted) setUserId(null);
      } finally {
        if (isMounted) {
          initialLoadComplete = true;
          setIsLoading(false);
        }
      }
    };

    loadUser();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (initialLoadComplete) {
        setUserId(session?.user?.id ?? null);
      }

      if (event === 'SIGNED_IN' && session?.user) {
        // Real sign-in always clears guest mode
        await AsyncStorage.removeItem(GUEST_MODE_KEY);
        setIsGuest(false);

        const store = useOnboardingStore.getState();
        if (store.hasCompletedOnboarding && !store.hasPersistedOnboardingData) {
          store.setOnboardingDataPersisted();
          try {
            await ensureUserProfile(session.user.id);
            await persistOnboardingData(session.user.id, store.newOnboardingData);
            await Promise.all([
              useCategoriesStore.getState().loadCategories(),
              useAccountsStore.getState().loadAccounts(),
              useIncomeStore.getState().loadIncomeSettings(),
              useCurrencyStore.getState().loadCurrency(),
            ]);
            useAppTourStore.getState().resetSeenPages();
          } catch (e: any) {
            console.error('[AuthContext] Failed to persist onboarding data:', e?.message);
          }
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ userId, isLoading, isGuest, enterGuestMode, exitGuestMode }),
    [userId, isLoading, isGuest]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
