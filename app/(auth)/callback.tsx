import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAnalytics } from "../hooks/useAnalytics";
import { ensureUserProfile } from "../services/backendService";
import { useSubscription } from "../context/SubscriptionContext";
import { useAccountsStore } from "../store/useAccountsStore";
import { useAppTourStore } from "../store/useAppTourStore";
import { useCategoriesStore } from "../store/useCategoriesStore";
import { useIncomeStore } from "../store/useIncomeStore";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { useCurrencyStore } from "../store/useCurrencyStore";
import { supabase } from "../utils/supabase";
import { persistOnboardingData } from "./sign-up";

/**
 * OAuth Callback Route
 *
 * Handles the OAuth redirect deep link for two scenarios:
 * 1. Android warm-start: Chrome Custom Tab fires deep link intent while app is running.
 *    openAuthSessionAsync returns 'cancel'; this route handles the exchange.
 * 2. Cold-start: App was killed and opened by the deep link URL.
 *
 * On iOS, ASWebAuthenticationSession intercepts the redirect internally so this
 * route is never reached — sign-up.tsx / sign-in.tsx handle the success result.
 *
 * Uses useLocalSearchParams() (Expo Router) instead of Linking.getInitialURL() so
 * that URL params are available in both warm-start and cold-start scenarios.
 */
export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const { linkUser } = useSubscription();
  const params = useLocalSearchParams<Record<string, string>>();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Check for OAuth errors from the provider
      if (params.error) {
        const errorDescription = params.error_description || params.error;
        console.error("[OAuth Callback] OAuth error:", errorDescription);
        throw new Error(`Authentication failed: ${errorDescription}`);
      }

      // Ensure we have an authorization code
      if (!params.code) {
        console.error("[OAuth Callback] No authorization code in URL params");
        throw new Error("No authorization code received");
      }

      // Reconstruct the full callback URL from router params so that Supabase
      // can extract the code and any other required query params (e.g. state).
      const callbackUrl = Linking.createURL("auth/callback", { queryParams: params });

      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(callbackUrl);

      if (sessionError) {
        console.error("[OAuth Callback] Session exchange error:", sessionError);
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error("No session returned after code exchange");
      }

      // Wait for session to be persisted to storage
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure user profile exists
      await ensureUserProfile(sessionData.user.id);

      const store = useOnboardingStore.getState();

      // Detect mid-onboarding sign-up: user completed practice entry (step >= 10)
      // but hasn't finished onboarding yet (paywall + notification prefs still pending).
      const isMidOnboardingSignUp = !store.hasCompletedOnboarding && store.onboardingStep >= 10;

      if (isMidOnboardingSignUp) {
        // Mid-onboarding: link RevenueCat before paywall but defer data persistence
        // to notification-reminders where notification frequency will also be set.
        await linkUser(sessionData.user.id);
        if (sessionData.user) {
          identifyUser(sessionData.user.id, { email: sessionData.user.email });
        }
        trackEvent("user_authenticated", { method: "google", source: "callback_route" });
        router.replace("/(onboarding)/subscription-trial");
      } else {
        // Normal sign-up or returning user path.
        // Persist onboarding data for new users who completed the full onboarding first.
        if (store.hasCompletedOnboarding && !store.hasPersistedOnboardingData) {
          store.setOnboardingDataPersisted();
          await persistOnboardingData(sessionData.user.id, store.newOnboardingData);
          if (store.newOnboardingData.foundingMemberEmail) {
            supabase.functions.invoke('notify-founding-claim', {
              body: { email: store.newOnboardingData.foundingMemberEmail, userId: sessionData.user.id },
            }).catch((e) => console.error('[OAuthCallback] notify-founding-claim error:', e));
          }
          await Promise.all([
            useCategoriesStore.getState().loadCategories(),
            useAccountsStore.getState().loadAccounts(),
            useIncomeStore.getState().loadIncomeSettings(),
            useCurrencyStore.getState().loadCurrency(),
          ]);
          useAppTourStore.getState().resetSeenPages();
        }

        if (sessionData.user) {
          identifyUser(sessionData.user.id, { email: sessionData.user.email });
        }
        trackEvent("user_authenticated", { method: "google", source: "callback_route" });

        if (store.hasCompletedOnboarding) {
          router.replace("/(tabs)/profile");
        } else {
          router.replace("/(tabs)/dashboard");
        }
      }
    } catch (e: any) {
      console.error("[OAuth Callback] Error:", e);

      trackEvent("user_auth_failed", {
        error_message: e?.message ?? "Unknown error",
        method: "google",
        source: "callback_route",
      });

      setError(e?.message ?? "An error occurred during authentication");
      setIsProcessing(false);

      // Redirect back to sign-in after 3 seconds
      setTimeout(() => {
        router.replace("/(auth)/sign-in");
      }, 3000);
    }
  };

  if (error) {
    return (
      <View className="flex-1 bg-backgroundDark items-center justify-center px-6">
        <Text className="text-red-500 text-lg font-semibold mb-2">
          Authentication Failed
        </Text>
        <Text className="text-secondaryDark text-center mb-4">
          {error}
        </Text>
        <Text className="text-secondaryDark text-sm text-center">
          Redirecting to sign-in...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgroundDark items-center justify-center">
      <ActivityIndicator size="large" color="#6366F1" />
      <Text className="text-textDark mt-4 text-base">
        {isProcessing ? "Completing authentication..." : ""}
      </Text>
    </View>
  );
}
