import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { NativeModules, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

const isRevenueCatAvailable = !!NativeModules.RNPurchases;

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const PREMIUM_ENTITLEMENT = 'premium';
// Users created before this date get free access when the paywall is enabled.
// Update this to the date you flip EXPO_PUBLIC_PAYWALL_ENABLED=true in production.
const GRANDFATHERED_BEFORE = new Date('2026-06-01T00:00:00Z');
const platformApiKey = Platform.OS === 'android' ? RC_ANDROID_KEY : RC_IOS_KEY;

interface SubscriptionContextType {
  customerInfo: CustomerInfo | null;
  isSubscribed: boolean;
  isLoading: boolean;
  refreshCustomerInfo: () => Promise<void>;
  linkUser: (userId: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  customerInfo: null,
  isSubscribed: false,
  isLoading: true,
  refreshCustomerInfo: async () => {},
  linkUser: async () => {},
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const customerInfoRef = useRef<CustomerInfo | null>(null);
  const [isGrandfathered, setIsGrandfathered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  // Keep ref in sync so async callbacks can read the latest customerInfo without stale closures
  useEffect(() => {
    customerInfoRef.current = customerInfo;
  }, [customerInfo]);

  useEffect(() => {
    if (!isRevenueCatAvailable || !platformApiKey) {
      setIsLoading(false);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey: platformApiKey });

    const fetchInitialInfo = async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        setCustomerInfo(info);
      } catch (e) {
        console.error('[SubscriptionContext] Failed to fetch customer info:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialInfo();

    const customerInfoListener = (info: CustomerInfo) => {
      setCustomerInfo(info);
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoListener);

    return () => {
      Purchases.removeCustomerInfoUpdateListener(customerInfoListener);
    };
  }, []);

  // Set isLinkingUser synchronously when userId appears to prevent a render
  // where subLoading=false but linking hasn't started yet (race → paywall flash).
  useLayoutEffect(() => {
    if (userId) setIsLinkingUser(true);
  }, [userId]);

  // Auto-link RC user and check grandfathered status whenever the authenticated user changes
  useEffect(() => {
    if (!userId) {
      setIsGrandfathered(false);
      setIsLinkingUser(false);
      return;
    }

    const initForUser = async () => {
      try {
        await Promise.all([
          // Link Supabase user ID to RevenueCat — converts anonymous customer → identified customer
          (async () => {
            if (!isRevenueCatAvailable || !platformApiKey) return;
            try {
              const { customerInfo: info } = await Purchases.logIn(userId);

              // If logIn returned a newly-created identified customer (created=true) or
              // the identified customer has no entitlement, invalidate the cache and
              // re-fetch. This handles the anonymous→identified merge case where the
              // entitlement lives on the anonymous customer and RC hasn't propagated it yet.
              const isNowActive = !!info.entitlements.active[PREMIUM_ENTITLEMENT];

              if (!isNowActive) {
                try {
                  await Purchases.invalidateCustomerInfoCache();
                  const fresh = await Purchases.getCustomerInfo();
                  setCustomerInfo(fresh);
                } catch (e) {
                  console.error('[SubscriptionContext] Post-logIn refresh failed:', e);
                  setCustomerInfo(info);
                }
              } else {
                setCustomerInfo(info);
              }
            } catch (e) {
              console.error('[SubscriptionContext] Failed to link user on auth change:', e);
            }
          })(),

          // Check grandfathered status — users created before GRANDFATHERED_BEFORE get free access.
          // Must complete before isLinkingUser=false so tabs layout has accurate isSubscribed state.
          (async () => {
            try {
              const { data } = await supabase
                .from('profiles')
                .select('created_at')
                .eq('id', userId)
                .single();
              if (data?.created_at && new Date(data.created_at) < GRANDFATHERED_BEFORE) {
                setIsGrandfathered(true);
              }
            } catch (e) {
              console.error('[SubscriptionContext] Grandfathered check failed:', e);
            }
          })(),
        ]);
      } finally {
        setIsLinkingUser(false);
      }
    };

    initForUser();
  }, [userId]);

  const refreshCustomerInfo = useCallback(async () => {
    if (!isRevenueCatAvailable || !platformApiKey) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.error('[SubscriptionContext] Failed to refresh customer info:', e);
    }
  }, []);

  const linkUser = useCallback(async (userId: string) => {
    if (!isRevenueCatAvailable || !platformApiKey) return;
    try {
      const { customerInfo: info } = await Purchases.logIn(userId);
      setCustomerInfo(info);
    } catch (e) {
      console.error('[SubscriptionContext] Failed to link user:', e);
    }
  }, []);

  const paywallEnabled = process.env.EXPO_PUBLIC_PAYWALL_ENABLED === 'true';
  const isSubscribed = !paywallEnabled || !platformApiKey || !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT] || isGrandfathered;

  return (
    <SubscriptionContext.Provider value={{ customerInfo, isSubscribed, isLoading: isLoading || isLinkingUser, refreshCustomerInfo, linkUser }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
