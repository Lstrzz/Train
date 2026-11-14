import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { colors } from '@/constants/theme';
import { StoreProvider } from '@/lib/store';

export default function RootLayout() {
  return (
    <StoreProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ title: 'Данные' }} />
        <Stack.Screen name="exercise/[id]" options={{ title: 'Упражнение' }} />
        <Stack.Screen name="workout/[id]" options={{ title: 'Тренировка' }} />
        <Stack.Screen
          name="workout/run/[id]"
          options={{ headerShown: false, presentation: 'fullScreenModal' }}
        />
      </Stack>
    </StoreProvider>
  );
}
