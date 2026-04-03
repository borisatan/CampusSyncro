import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { NativeModules, Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { supabase } from '../utils/supabase';

const isRevenueCatAvailable = !!NativeModules.RNPurchases;

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';
const PREMIUM_ENTITLEMENT = 'premium';

interface SubscriptionContextType {
  customerInfo: CustomerInfo | null;
  isSubscribed: boolean;
  isFoundingMember: boolean;
  isLoading: boolean;
  refreshCustomerInfo: () => Promise<void>;
  linkUser: (userId: string) => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  customerInfo: null,
  isSubscribed: false,
  isFoundingMember: false,
  isLoading: true,
  refreshCustomerInfo: async () => {},
  linkUser: async () => {},
});

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userId } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const customerInfoRef = useRef<CustomerInfo | null>(null);
  const [isFoundingMember, setIsFoundingMember] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLinkingUser, setIsLinkingUser] = useState(false);

  // Keep ref in sync so async callbacks can read the latest customerInfo without stale closures
  useEffect(() => {
    customerInfoRef.current = customerInfo;
  }, [customerInfo]);

  useEffect(() => {
    if (!isRevenueCatAvailable) {
      setIsLoading(false);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    const apiKey = Platform.OS === 'android' ? RC_ANDROID_KEY : RC_IOS_KEY;
    Purchases.configure({ apiKey });

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

  // Auto-link RC user and check founding member status whenever the authenticated user changes
  useEffect(() => {
    if (!userId) {
      setIsFoundingMember(false);
      return;
    }

    const initForUser = async () => {
      setIsLinkingUser(true);
      try {
        await Promise.all([
          // Link Supabase user ID to RevenueCat — converts anonymous customer → identified customer
          (async () => {
            if (!isRevenueCatAvailable) return;
            try {
              const { customerInfo: info } = await Purchases.logIn(userId);

              // logIn can return stale data when RevenueCat hasn't finished propagating
              // the anonymous→identified customer merge (e.g. after a free trial is started
              // before account creation). Refresh synchronously so the tabs layout sees
              // accurate subscription state before rendering.
              const wasActive = !!customerInfoRef.current?.entitlements.active[PREMIUM_ENTITLEMENT];
              const isNowActive = !!info.entitlements.active[PREMIUM_ENTITLEMENT];

              if (wasActive && !isNowActive) {
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

          // Check founding member flag — must complete before isLinkingUser=false so
          // the tabs layout has accurate isSubscribed state before it renders.
          (async () => {
            try {
              const { data } = await supabase
                .from('Profiles')
                .select('is_founding_member')
                .eq('id', userId)
                .single();
              if (data?.is_founding_member) setIsFoundingMember(true);
            } catch (e) {
              console.error('[SubscriptionContext] Founding member check failed:', e);
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
    if (!isRevenueCatAvailable) return;
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (e) {
      console.error('[SubscriptionContext] Failed to refresh customer info:', e);
    }
  }, []);

  const linkUser = useCallback(async (userId: string) => {
    if (!isRevenueCatAvailable) return;
    try {
      const { customerInfo: info } = await Purchases.logIn(userId);
      setCustomerInfo(info);
    } catch (e) {
      console.error('[SubscriptionContext] Failed to link user:', e);
    }
  }, []);

  const isSubscribed = !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT] || isFoundingMember;

  return (
    <SubscriptionContext.Provider value={{ customerInfo, isSubscribed, isFoundingMember, isLoading: isLoading || isLinkingUser, refreshCustomerInfo, linkUser }}>
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
