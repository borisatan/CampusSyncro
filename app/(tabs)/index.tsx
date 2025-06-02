import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center gap-4">
      <Text className="text-7xl font-bold text-secondary">Welcome.</Text>
      <Link href="./(onboarding)/onboarding-categories" className="text-primary text-lg">
        Setup Categories
      </Link>
      <Link href="./(onboarding)/onboarding-budget" className="text-primary text-lg">
        Setup Budget
      </Link>
      <Link href="./(onboarding)/onboarding-accounts" className="text-primary text-lg">
        Setup Accounts
      </Link>
      <View className="h-8" />
      <Link href="./pages/settings" className="text-primary">Settings</Link>
      <Link href="/dashboard" className="text-primary">Dashboard</Link>
      <Link href="/add-transaction" className="text-primary">Add Event</Link>
      <Link href="/transaction-list" className="text-primary">Transactions</Link>
    </View>
  );
}
