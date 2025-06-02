import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="onboarding-categories" />
      <Stack.Screen name="onboarding-budget" />
      <Stack.Screen name="onboarding-accounts" />
    </Stack>
  );
} 