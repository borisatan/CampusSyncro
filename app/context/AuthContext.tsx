import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { persistOnboardingData } from '../(auth)/sign-up';
import { ensureUserProfile } from '../services/backendService';
import { useAccountsStore } from '../store/useAccountsStore';
import { useAppTourStore } from '../store/useAppTourStore';
import { useCategoriesStore } from '../store/useCategoriesStore';
import { useCurrencyStore } from '../store/useCurrencyStore';
import { useIncomeStore } from '../store/useIncomeStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import { supabase } from '../utils/supabase';

type AuthContextValue = {
  userId: string | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ userId: null, isLoading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let initialLoadComplete = false;

    const loadUser = async () => {
      try {
        // getUser() validates with the server, unlike cached session data
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUserId(data.user?.id ?? null);
      } catch (error: any) {
        // Stale/revoked refresh token — clear the session and treat as signed out
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
      // Only trust auth state changes AFTER initial server validation completes
      // This prevents flash from stale/cached sessions
      if (initialLoadComplete) {
        setUserId(session?.user?.id ?? null);
      }

      // Persist onboarding data for new users on first sign-in.
      // This covers the email-verification path where no session exists at sign-up time.
      if (event === 'SIGNED_IN' && session?.user) {
        const store = useOnboardingStore.getState();
        if (store.hasCompletedOnboarding && !store.hasPersistedOnboardingData) {
          // Claim the flag immediately (before awaiting) to prevent the sign-up
          // handler from also running persistOnboardingData concurrently.
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

  const value = useMemo(() => ({ userId, isLoading }), [userId, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);


