import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.dim,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Сегодня',
          tabBarIcon: ({ color }) => <MaterialIcons name="today" size={24} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: 'План',
          tabBarIcon: ({ color }) => <MaterialIcons name="date-range" size={24} color={String(color)} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Упражнения',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="fitness-center" size={24} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'История',
          tabBarIcon: ({ color }) => <MaterialIcons name="insights" size={24} color={String(color)} />,
        }}
      />
    </Tabs>
  );
}
