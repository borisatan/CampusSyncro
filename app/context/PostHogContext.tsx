import React, { createContext, useContext, useEffect, useState } from 'react';
import { PostHog } from 'posthog-react-native';
import { initPostHog } from '../utils/posthog';

interface PostHogContextType {
  posthog: PostHog | null;
  isReady: boolean;
}

const PostHogContext = createContext<PostHogContextType>({
  posthog: null,
  isReady: false,
});

export const PostHogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [posthog, setPostHog] = useState<PostHog | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupPostHog = async () => {
      try {
        const client = await initPostHog();
        setPostHog(client);
      } catch (error) {
        console.error('Failed to initialize PostHog:', error);
      } finally {
        setIsReady(true);
      }
    };

    setupPostHog();
  }, []);

  return (
    <PostHogContext.Provider value={{ posthog, isReady }}>
      {children}
    </PostHogContext.Provider>
  );
};

export const usePostHog = () => {
  const context = useContext(PostHogContext);
  if (!context) {
    throw new Error('usePostHog must be used within a PostHogProvider');
  }
  return context;
};
