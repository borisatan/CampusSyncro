import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom', animationDuration: 400, contentStyle: { backgroundColor: '#20283A' } }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)"  />
            </Stack>
          </ThemeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
} 