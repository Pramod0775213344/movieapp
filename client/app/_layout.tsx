import React, { useEffect, useContext } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

import { AuthProvider, AuthContext } from '@/context/AuthContext';

function RootLayoutNav() {
  const { user, loading } = useContext(AuthContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'movie' || segments[0] === 'player';

    if (!user && inAuthGroup) {
      router.replace('/login');
    } else if (user && (segments[0] === 'login' || segments[0] === 'register')) {
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="movie/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="player/[id]" options={{ presentation: 'fullScreenModal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DarkTheme}>
        <RootLayoutNav />
        <StatusBar style="light" />
      </ThemeProvider>
    </AuthProvider>
  );
}
