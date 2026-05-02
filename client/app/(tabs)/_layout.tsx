import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, Heart, User } from 'lucide-react-native';

export default function TabLayout() {
  const PRIMARY_COLOR = '#E50914';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#050505',
          borderTopWidth: 1,
          borderTopColor: '#1a1a1a',
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: '#444',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Search size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color }) => <Heart size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
