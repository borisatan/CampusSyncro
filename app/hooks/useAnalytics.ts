import { useCallback, useEffect, useRef } from 'react';
import { usePostHog } from '../context/PostHogContext';

export const useAnalytics = () => {
  const { posthog, isReady } = usePostHog();
  const queue = useRef<Array<{ eventName: string; properties?: Record<string, any> }>>([]);

  // Flush queued events once PostHog is ready
  useEffect(() => {
    if (isReady && posthog && queue.current.length > 0) {
      queue.current.forEach(({ eventName, properties }) => {
        posthog.capture(eventName, properties);
      });
      queue.current = [];
    }
  }, [isReady, posthog]);

  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, any>) => {
      if (!isReady || !posthog) {
        queue.current.push({ eventName, properties });
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
