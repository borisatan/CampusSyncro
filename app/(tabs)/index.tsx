import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-7xl font-bold text-secondary">Welcome.</Text>
      <Link href="/settings" className="text-primary">Settings</Link>
      <Link href="/dashboard" className="text-primary">Dashboard</Link>
      <Link href="/add-transaction" className="text-primary">Add Event</Link>
      <Link href="/transaction-list" className="text-primary">Transactions</Link>
    </View>
  );
}
