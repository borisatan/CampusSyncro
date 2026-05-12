import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import LoadingSpinner from './components/Shared/LoadingSpinner';
import { supabase } from './utils/supabase';

export default function RootIndex() {
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      const [{ data }, guestFlag] = await Promise.all([
        supabase.auth.getSession(),
        AsyncStorage.getItem('@monelo_guest_mode'),
      ]);
      if (!isMounted) return;
      setSession(data.session);
      if (!data.session?.user && guestFlag === 'true') {
        setIsGuest(true);
      }
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

  if (isLoading) return <LoadingSpinner />;

  if (session?.user || isGuest) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/(auth)/sign-in" />;
}
