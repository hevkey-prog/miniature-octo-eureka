import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ChatListScreen from "./src/screens/ChatListScreen";
import ChatRoomScreen from "./src/screens/ChatRoomScreen";
import OnboardingScreen from "./src/screens/OnboardingScreen";
import ProfileScreen from "./src/screens/ProfileScreen";
import { getProfile } from "./src/storage/db";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    getProfile().then((p) => setInitialRoute(p ? "ChatList" : "Onboarding"));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#4D96FF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ChatList"
            component={ChatListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ChatRoom" component={ChatRoomScreen} options={{ headerBackTitle: "แชท" }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "โปรไฟล์ของฉัน" }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
