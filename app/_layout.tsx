import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ThemeProvider } from "./context/ThemeContext";
import "./globals.css";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: "#ffffff",
            height: 60,
            borderTopLeftRadius: 15,
            borderTopRightRadius: 15,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: -2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3,
          },
          tabBarActiveTintColor: "#007AFF",
          tabBarInactiveTintColor: "#8E8E93",
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}
