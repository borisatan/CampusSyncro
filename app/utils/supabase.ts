import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";

// Polyfill WebCrypto for React Native
if (!globalThis.crypto) {
  globalThis.crypto = {
    // @ts-ignore
    getRandomValues: (array: Uint8Array) => {
      return Crypto.getRandomValues(array);
    },
    // @ts-ignore
    subtle: {
      digest: async (algorithm: string, data: Uint8Array) => {
        const hash = await Crypto.digest(
          Crypto.CryptoDigestAlgorithm.SHA256,
          data
        );
        return hash;
      },
    },
    randomUUID: () => {
      return Crypto.randomUUID();
    },
  };
}

const supabaseUrl = "https://rrttwewkekyvwgjilrzo.supabase.co";
const supabaseAnonKey = "sb_publishable_RLCVhk8FEp51JwAopY2QdQ_q89rPqJ_";

const ExpoSqliteStorage = {
  getItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          const value = localStorage.getItem(key);
          return value;
        }
        return null;
      }
      const value = await AsyncStorage.getItem(key);
      return value;
    } catch (error) {
      console.error('[Storage] getItem error:', key, error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          localStorage.setItem(key, value);
        }
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('[Storage] setItem error:', key, error);
    }
  },
  removeItem: async (key: string) => {
    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          localStorage.removeItem(key);
        }
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[Storage] removeItem error:', key, error);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSqliteStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disabled in React Native — OAuth callbacks are handled manually via exchangeCodeForSession
    flowType: "pkce",
  },
});
