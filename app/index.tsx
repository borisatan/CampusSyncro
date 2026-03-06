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
      // Route to appropriate onboarding screen based on saved progress
      const routes = [
        '/(onboarding)/welcome',              // Step 1
        '/(onboarding)/category-autopilot',   // Step 2
        '/(onboarding)/monthly-income',       // Step 3
        '/(onboarding)/cost-of-inattention',  // Step 4
        '/(onboarding)/why-manual',           // Step 5
        '/(onboarding)/practice-entry',       // Step 6
        '/(onboarding)/subscription-trial',   // Step 7
      ];

      const targetRoute = routes[onboardingStep - 1] || routes[0];
      return <Redirect href={targetRoute} />;
    }
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}


