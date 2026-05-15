import { Stack } from 'expo-router';
import "../globals.css";

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationTypeForReplace: 'pop',
        animationDuration: 250,
        contentStyle: { backgroundColor: '#08090F', flex: 1 },
      }}
    >
      {/* Intro */}
      <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
      <Stack.Screen name="problem-framing" />
      <Stack.Screen name="solution-act-of-intent" />
      {/* About You */}
      <Stack.Screen name="use-case" />
      <Stack.Screen name="category-preselection" />
      <Stack.Screen name="monthly-income" />
      <Stack.Screen name="cost-of-inattention" />
      <Stack.Screen name="savings-goal" />
      {/* Aha Moment */}
      <Stack.Screen name="aha-moment" />
      {/* Climax */}
      <Stack.Screen name="practice-entry" />
      {/* Conclusion */}
      <Stack.Screen name="journey-summary" />
      <Stack.Screen name="personalizing" options={{ gestureEnabled: false }} />
      {/* Post sign-up: subscription then budget config */}
      <Stack.Screen name="subscription-trial" options={{ gestureEnabled: false }} />
      <Stack.Screen name="budget-setup-choice" />
      <Stack.Screen name="ai-budget-setup" />
      <Stack.Screen name="manual-budget-setup" />
      <Stack.Screen name="why-manual" />
      <Stack.Screen name="founding-access" />
      <Stack.Screen name="notification-reminders" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
