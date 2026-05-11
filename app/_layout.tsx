import './globals.css';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider, KeyboardToolbar } from "react-native-keyboard-controller";
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLockScreen from './components/Shared/AppLockScreen';
import CurrencyInitializer from './components/Shared/CurrencyInitializer';
import DataPreloader from './components/Shared/DataPreloader';
import NotificationInitializer from './components/Shared/NotificationInitializer';
import { OfflineBanner } from './components/Shared/OfflineBanner';
import { AuthProvider } from './context/AuthContext';
import { DataRefreshProvider, useDataRefresh } from './context/DataRefreshContext';
import { LockProvider } from './context/LockContext';
import { NetworkProvider } from './context/NetworkContext';
import { PostHogProvider } from './context/PostHogContext';
import { SubscriptionProvider } from './context/SubscriptionContext';
import { AppThemeProvider } from './context/ThemeContext';

function AppStateRefresher() {
  const { refreshDashboard, refreshAccounts, refreshTransactionList } = useDataRefresh();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        Promise.all([refreshDashboard(), refreshAccounts(), refreshTransactionList()]).catch(() => {});
      }
      appState.current = nextState;
    });
    return () => subscription.remove();
  }, []);

  return null;
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    'Inter': require('../assets/fonts/InterVariable.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

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
        <NetworkProvider>
        <AuthProvider>
          <SubscriptionProvider>
          <PostHogProvider>
            <LockProvider>
              <CurrencyInitializer />
              <DataPreloader />
              <NotificationInitializer />
              <DataRefreshProvider>
                <AppStateRefresher />
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
                        <Stack.Screen name="budget-help" />
                        <Stack.Screen name="recurring-transactions" />
                      </Stack>
                      <AppLockScreen />
                      <KeyboardToolbar />
                    </KeyboardProvider>
                  </AppThemeProvider>
                </ThemeProvider>
              </DataRefreshProvider>
            </LockProvider>
          </PostHogProvider>
          </SubscriptionProvider>
        </AuthProvider>
        <OfflineBanner />
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}