import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppLockScreen from './components/Shared/AppLockScreen';
import CurrencyInitializer from './components/Shared/CurrencyInitializer';
import DataPreloader from './components/Shared/DataPreloader';
import { AuthProvider } from './context/AuthContext';
import { DataRefreshProvider } from './context/DataRefreshContext';
import { LockProvider } from './context/LockContext';
import { AppThemeProvider } from './context/ThemeContext';

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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LockProvider>
            <CurrencyInitializer />
            <DataPreloader />
            <DataRefreshProvider>
              <ThemeProvider value={MyTheme}>
                <AppThemeProvider>
                  <KeyboardProvider preload={false}>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: 'fade_from_bottom',
                        animationDuration: 400,
                        contentStyle: { backgroundColor: "#20283A", flex: 1 },
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
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}