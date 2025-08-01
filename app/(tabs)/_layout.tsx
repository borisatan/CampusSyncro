import { Tabs } from "expo-router";
import "../globals.css";

export default function TabLayout() {

  return (
      <Tabs screenOptions={{ tabBarActiveTintColor: 'blue', headerShown: false, 
        tabBarStyle: {
          backgroundColor: 'transparent',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 0, // for Android shadow
          shadowOpacity: 0, // for iOS shadow
          borderTopWidth: 0, // remove the top border
        

      }}}  >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
          }}
        />
      </Tabs>
  );
}
