import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import Purchases, { CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { NativeModules } from 'react-native';

const isRevenueCatAvailable = !!NativeModules.RNPurchases;

const RC_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const PREMIUM_ENTITLEMENT = 'premium';

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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isRevenueCatAvailable) {
      setIsLoading(false);
      return;
    }

    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey: RC_IOS_KEY });

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

  const isSubscribed = !!customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT];

  return (
    <SubscriptionContext.Provider value={{ customerInfo, isSubscribed, isLoading, refreshCustomerInfo, linkUser }}>
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
