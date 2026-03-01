import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLockScreen from './components/Shared/AppLockScreen';
import CurrencyInitializer from './components/Shared/CurrencyInitializer';
import DataPreloader from './components/Shared/DataPreloader';
import NotificationInitializer from './components/Shared/NotificationInitializer';
import { AuthProvider } from './context/AuthContext';
import { DataRefreshProvider } from './context/DataRefreshContext';
import { LockProvider } from './context/LockContext';
import { PostHogProvider } from './context/PostHogContext';
import { AppThemeProvider } from './context/ThemeContext';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const MyTheme = {
    ...(colorScheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: { 
      ...(colorScheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: '#000000', 
    },
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaProvider>
        <AuthProvider>
          <PostHogProvider>
            <LockProvider>
              <CurrencyInitializer />
              <DataPreloader />
              <NotificationInitializer />
              <DataRefreshProvider>
                <ThemeProvider value={MyTheme}>
                  <AppThemeProvider>
                    <KeyboardProvider preload={false}>
                      <Stack
                        screenOptions={{
                          headerShown: false,
                          animation: 'fade_from_bottom',
                          animationDuration: 400,
                          contentStyle: { backgroundColor: "#20283A", flex: 1 }, // Using hex for React Navigation compatibility
                        }}
                      >
                        <Stack.Screen name="index" />
                        <Stack.Screen name="(auth)" />
                        <Stack.Screen name="(onboarding)" />
                        <Stack.Screen name="(tabs)" />
                        <Stack.Screen name="budgets" />
                        <Stack.Screen name="budget-help" />
                      </Stack>
                      <AppLockScreen />
                    </KeyboardProvider>
                  </AppThemeProvider>
                </ThemeProvider>
              </DataRefreshProvider>
            </LockProvider>
          </PostHogProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}