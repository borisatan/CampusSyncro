import { Stack } from 'expo-router';
import "../globals.css";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        animationDuration: 100,
        contentStyle: { backgroundColor: '#0A0F1F', flex: 1 },
      }}
    >
      <Stack.Screen name="emotional-hook" />
      <Stack.Screen name="value-alignment" />
      <Stack.Screen name="category-selection" />
      <Stack.Screen name="budget-setting" />
      <Stack.Screen name="savings-potential" />
      <Stack.Screen name="intentionality-map" />
    </Stack>
  );
}
