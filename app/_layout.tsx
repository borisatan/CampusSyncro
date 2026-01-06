import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { AppThemeProvider } from './context/ThemeContext';
import { DataRefreshProvider } from './context/DataRefreshContext';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import CurrencyInitializer from './components/Shared/CurrencyInitializer';

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
          <CurrencyInitializer />
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
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </KeyboardProvider>
            </AppThemeProvider>
          </ThemeProvider>
          </DataRefreshProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}