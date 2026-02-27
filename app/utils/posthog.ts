import { PostHog } from 'posthog-react-native';

let posthogClient: PostHog | null = null;

export const initPostHog = async (): Promise<PostHog> => {
  if (posthogClient) {
    return posthogClient;
  }

  const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
  const host = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('PostHog API key not found. Analytics will be disabled.');
    return null as any;
  }

  posthogClient = new PostHog(apiKey, {
    host,
    captureApplicationLifecycleEvents: true,
    captureDeepLinks: true,
  });

  return posthogClient;
};

export const getPostHog = (): PostHog | null => {
  return posthogClient;
};
