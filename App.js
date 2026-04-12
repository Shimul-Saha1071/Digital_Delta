import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import DashboardScreen from "./screens/DashboardScreen";
import MapScreen from "./screens/MapScreen";
import AuthScreen from "./screens/AuthScreen";
import SyncScreen from "./screens/SyncScreen";
import { COLORS } from "./lib/config";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={COLORS.background} />
      <Tab.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: COLORS.background,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: COLORS.text,
          headerTitleStyle: { fontWeight: "700", letterSpacing: 1 },
          tabBarStyle: {
            backgroundColor: COLORS.surface,
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: "700" },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
                📊
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Map & Routes"
          component={MapScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
                🗺️
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="Auth"
          component={AuthScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
                🔐
              </Text>
            ),
          }}
        />
        <Tab.Screen
          name="CRDT Sync"
          component={SyncScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.4 }}>
                🔄
              </Text>
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
