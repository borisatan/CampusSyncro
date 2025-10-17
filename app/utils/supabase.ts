
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
// import 'react-native-url-polyfill/auto'

export const supabase = createClient(
  // process.env.EXPO_PUBLIC_SUPABASE_URL!,
  // process.env.EXPO_PUBLIC_SUPABASE_KEY!,
  'https://rrttwewkekyvwgjilrzo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJydHR3ZXdrZWt5dndnamlscnpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NjA3ODcsImV4cCI6MjA3MDEzNjc4N30.Mewfkzk4-eEYFu49bSIqgAuPAxnFIfsoZlwScX46pGw',
        
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  })