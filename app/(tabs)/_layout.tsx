import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import "../globals.css";

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
        animation: "shift",

        sceneStyle: { backgroundColor: "#20283A", flex: 1 },
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#2563EB", // accentBlue
        tabBarInactiveTintColor: "#9CA3AF", // secondaryDark

        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "#20283A" }} />
        ),

        tabBarStyle: {
          backgroundColor: "#20283A", // background
          borderTopColor: "#0A0F1F", // borderLight
          borderTopWidth: 1,
          position: "absolute",
          height: 60 + insets.bottom, // adjust height with safe area
          paddingBottom: insets.bottom + 7, // keep it above gesture bar
          paddingTop: 7,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={29}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: "Budgets",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "pie-chart" : "pie-chart-outline"}
              size={29}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transaction"
        options={{
          title: "Add",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction-list"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={30}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={29}
              color={color}
            />
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
