import { Link } from "expo-router";
import { Text, View } from "react-native";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-7xl font-bold text-secondary">Welcome.</Text>
      <Link href="./pages/sign-in" className="text-primary">Sign In</Link>
      <Link href="./pages/sign-up" className="text-primary">Sign Up</Link>
      <Link href="./pages/dashboard" className="text-primary">Dashboard</Link>
      <Link href="./pages/add-event" className="text-primary">Add Event</Link>
    </View>
  );
}
