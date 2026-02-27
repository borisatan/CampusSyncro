import { useCallback } from 'react';
import { usePostHog } from '../context/PostHogContext';

export const useAnalytics = () => {
  const { posthog, isReady } = usePostHog();

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      if (!isReady || !posthog) {
        console.warn('PostHog is not ready yet');
        return;
      }
      posthog.capture(eventName, properties);
    },
    [posthog, isReady]
  );

  const identifyUser = useCallback(
    (userId: string, properties?: Record<string, any>) => {
      if (!isReady || !posthog) {
        console.warn('PostHog is not ready yet');
        return;
      }
      posthog.identify(userId, properties);
    },
    [posthog, isReady]
  );

  const resetUser = useCallback(() => {
    if (!isReady || !posthog) {
      console.warn('PostHog is not ready yet');
      return;
    }
    posthog.reset();
  }, [posthog, isReady]);

  const setUserProperties = useCallback(
    (properties: Record<string, any>) => {
      if (!isReady || !posthog) {
        console.warn('PostHog is not ready yet');
        return;
      }
      posthog.group('user', properties);
    },
    [posthog, isReady]
  );

  const trackScreen = useCallback(
    (screenName: string, properties?: Record<string, any>) => {
      if (!isReady || !posthog) {
        console.warn('PostHog is not ready yet');
        return;
      }
      posthog.screen(screenName, properties);
    },
    [posthog, isReady]
  );

  return {
    trackEvent,
    identifyUser,
    resetUser,
    setUserProperties,
    trackScreen,
    isReady,
  };
};
