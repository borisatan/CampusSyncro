import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import "../globals.css";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/Shared/LoadingSpinner";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { userId, isLoading } = useAuth();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'shift',
        
        sceneStyle: { backgroundColor: "#20283A", flex: 1 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#2563EB", // accentBlue
        tabBarInactiveTintColor: "#9CA3AF", // secondaryDark

        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "#20283A" }} />
        ),
        
        tabBarStyle: {
          backgroundColor: "#20283A", // background
          borderTopColor: "#0A0F1F",  // borderLight
          borderTopWidth: 1,
          position: "absolute",
          height: 60 + insets.bottom,   // adjust height with safe area
          paddingBottom: insets.bottom, // keep it above gesture bar
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={30} color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name="budgets"
          options={{
            title: "Budgets",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pie-chart-outline" size={30} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={30} color={color} />
          ),
        }}
      />
        <Tabs.Screen
          name="transaction-list"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={30} color={color} />
            ),
          }}
        />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={30} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{ href: null }} // hides from tab bar
      />
      <Tabs.Screen
        name="edit-transaction"
        options={{ href: null }} // hides from tab bar
      />
      <Tabs.Screen
        name="accounts"
        options={{ href: null }} // hides from tab bar
      />
    </Tabs>
  );
}

