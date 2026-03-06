import { Stack } from 'expo-router';
import "../globals.css";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        contentStyle: { backgroundColor: '#08090F', flex: 1 },
      }}
    >
      {/* New 7-step onboarding flow */}
      <Stack.Screen
        name="welcome"
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="category-autopilot" />
      <Stack.Screen name="monthly-income" />
      <Stack.Screen name="cost-of-inattention" />
      <Stack.Screen name="why-manual" />
      <Stack.Screen name="practice-entry" />
      <Stack.Screen
        name="subscription-trial"
        options={{ gestureEnabled: false }}
      />
    </Stack>
  );
}
