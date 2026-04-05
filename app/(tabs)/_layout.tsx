import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LoadingSpinner from "../components/Shared/LoadingSpinner";
import { useAuth } from "../context/AuthContext";
import { useSubscription } from "../context/SubscriptionContext";
import "../globals.css";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { userId, isLoading: authLoading } = useAuth();
  const { isSubscribed, isLoading: subLoading } = useSubscription();

  // Show loading while checking auth or subscription
  if (authLoading || subLoading) {
    return <LoadingSpinner />;
  }

  // Redirect to sign-in if not authenticated
  if (!userId) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  // Redirect to paywall if trial/subscription not active
  if (!isSubscribed && !__DEV__) {
    return <Redirect href="/(onboarding)/subscription-trial" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "#20283A", flex: 1 },
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarInactiveTintColor: "#9CA3AF",

        tabBarBackground: () => (
          <View style={{ flex: 1, backgroundColor: "#20283A" }} />
        ),

        tabBarStyle: {
          backgroundColor: "#20283A",
          borderTopColor: "#0A0F1F",
          borderTopWidth: 1,
          position: "absolute",
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom + 7,
          paddingTop: 7,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          marginTop: 2,
        },

        animation: Platform.OS === "android" ? "shift" : "none",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={24}
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
              size={24}
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
              size={26}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transaction-list"
        options={{
          title: "History",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "list" : "list-outline"}
              size={24}
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
              size={24}
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
