import { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/Shared/LoadingSpinner';
import { useOnboardingStore } from './store/useOnboardingStore';
import { supabase } from './utils/supabase';

export default function RootIndex() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { hasCompletedOnboarding, onboardingStep, isHydrated } = useOnboardingStore();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session);
      setIsLoading(false);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Wait for both auth and onboarding store to be ready
  if (isLoading || !isHydrated) return <LoadingSpinner />;

  if (session?.user) {
    // Check if user has completed onboarding
    if (!hasCompletedOnboarding) {
      // Route to appropriate V3 onboarding screen based on saved progress
      if (onboardingStep === 0 || onboardingStep === 1) {
        return <Redirect href="/(onboarding)/outcome-preview" />;
      } else if (onboardingStep === 2) {
        return <Redirect href="/(onboarding)/monthly-target" />;
      } else if (onboardingStep === 3) {
        return <Redirect href="/(onboarding)/category-confirmation" />;
      } else if (onboardingStep === 4) {
        return <Redirect href="/(onboarding)/account-name" />;
      } else if (onboardingStep === 5) {
        return <Redirect href="/(onboarding)/first-transaction" />;
      } else if (onboardingStep === 6) {
        return <Redirect href="/(onboarding)/transformation-moment" />;
      }
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}


