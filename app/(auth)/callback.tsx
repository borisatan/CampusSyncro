import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAnalytics } from "../hooks/useAnalytics";
import { ensureUserProfile } from "../services/backendService";
import { useOnboardingStore } from "../store/useOnboardingStore";
import { supabase } from "../utils/supabase";
import { persistOnboardingData } from "./sign-up";

/**
 * OAuth Callback Route
 *
 * This route handles OAuth redirects when:
 * 1. User closes browser manually before WebBrowser captures the redirect
 * 2. App is killed/closed during OAuth authentication (cold start scenario)
 * 3. Deep link is triggered from external source
 *
 * Flow:
 * - Extract code/error from URL parameters
 * - Exchange authorization code for session with Supabase
 * - Create user profile if needed
 * - Navigate to dashboard on success
 * - Show error on failure
 */
export default function OAuthCallbackScreen() {
  const router = useRouter();
  const { trackEvent, identifyUser } = useAnalytics();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log("[OAuth Callback] Processing OAuth callback");

      // Get the current URL
      const url = await Linking.getInitialURL();
      console.log("[OAuth Callback] Initial URL:", url);

      if (!url) {
        throw new Error("No URL found in callback");
      }

      // Parse the URL to check for errors from OAuth provider
      const parsedUrl = Linking.parse(url);
      const params = parsedUrl.queryParams;

      console.log("[OAuth Callback] URL params:", params);

      // Check for OAuth errors
      if (params?.error) {
        const errorDescription = params.error_description || params.error;
        console.error("[OAuth Callback] OAuth error:", errorDescription);
        throw new Error(`Authentication failed: ${errorDescription}`);
      }

      // Check for authorization code
      if (!params?.code) {
        console.error("[OAuth Callback] No authorization code in URL");
        throw new Error("No authorization code received");
      }

      console.log("[OAuth Callback] Exchanging code for session");

      // Exchange the authorization code for a session
      const { data: sessionData, error: sessionError } =
        await supabase.auth.exchangeCodeForSession(url);

      if (sessionError) {
        console.error("[OAuth Callback] Session exchange error:", sessionError);
        throw sessionError;
      }

      if (!sessionData.session) {
        throw new Error("No session returned after code exchange");
      }

      console.log("[OAuth Callback] Session established successfully");
      console.log("[OAuth Callback] User ID:", sessionData.session.user.id);

      // Wait for session to be persisted
      await new Promise(resolve => setTimeout(resolve, 100));

      // Ensure user profile exists
      await ensureUserProfile(sessionData.user.id);

      // Persist onboarding data if not yet saved (fallback for OAuth cold-start)
      const store = useOnboardingStore.getState();
      if (store.hasCompletedOnboarding && !store.hasPersistedOnboardingData) {
        await persistOnboardingData(sessionData.user.id, store.newOnboardingData);
        store.setOnboardingDataPersisted();
      }

      // Track analytics
      if (sessionData.user) {
        identifyUser(sessionData.user.id, { email: sessionData.user.email });
      }

      trackEvent("user_authenticated", {
        method: "google",
        source: "callback_route"
      });

      console.log("[OAuth Callback] Redirecting to dashboard");

      // Navigate to dashboard
      router.replace("/(tabs)/dashboard");
    } catch (e: any) {
      console.error("[OAuth Callback] Error:", e);

      // Track failure
      trackEvent("user_auth_failed", {
        error_message: e?.message ?? "Unknown error",
        method: "google",
        source: "callback_route",
      });

      // Show error to user
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
