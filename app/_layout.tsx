import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { ConversationProvider } from '@/contexts/ConversationContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ConversationProvider>
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: '#0f172a' },
            headerTintColor: '#f1f5f9',
            contentStyle: { backgroundColor: '#0f172a' },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="login"
            options={{ title: 'Sign In', headerShown: false }}
          />
        </Stack>
        <StatusBar style="light" />
      </ConversationProvider>
    </AuthProvider>
  );
}
