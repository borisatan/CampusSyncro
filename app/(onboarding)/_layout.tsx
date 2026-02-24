import { Stack } from 'expo-router';
import "../globals.css";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 250,
        contentStyle: { backgroundColor: '#0A0F1F', flex: 1 },
      }}
    >
      {/* V3 Onboarding Screens */}
      <Stack.Screen
        name="outcome-preview"
        options={{ animation: 'fade' }}
      />
      <Stack.Screen name="monthly-target" />
      <Stack.Screen
        name="dashboard-generation"
        options={{
          animation: 'fade',
          gestureEnabled: false
        }}
      />
      <Stack.Screen name="category-confirmation" />
      <Stack.Screen name="account-name" />
      <Stack.Screen name="first-transaction" />
      <Stack.Screen
        name="transformation-moment"
        options={{ gestureEnabled: false }}
      />

      {/* Old V2 Screens (archived, kept for backwards compatibility) */}
      <Stack.Screen name="emotional-hook" />
      <Stack.Screen name="value-alignment" />
      <Stack.Screen name="category-selection" />
      <Stack.Screen name="budget-setting" />
      <Stack.Screen name="savings-potential" />
      <Stack.Screen name="intentionality-map" />
    </Stack>
  );
}
