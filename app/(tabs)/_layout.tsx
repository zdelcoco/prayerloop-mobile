import { Tabs } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAppDispatch } from '@/hooks/redux';
import { logout } from '@/store/authSlice';

import Colors from '@/constants/Colors';

export default function TabsLayout() {
  const dispatch = useAppDispatch();

  const logoutHandler = () => {
    dispatch(logout());
  };

  function ms(size: number): number {
    const scale = 1.2; // Example scale factor
    return Math.round(size * scale);
  }

  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <FontAwesome
            name='sign-out'
            size={ms(24)}
            color={Colors.light.tabIconDefault}
            onPress={logoutHandler}
            style={{ marginRight: 16 }}
          />
        ),
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        tabBarActiveTintColor: Colors.light.tabIconSelected,
      }}
    >
      <Tabs.Screen
        name='cards'
        options={{
          title: 'Prayer Cards',
          tabBarLabel: 'Cards',
          tabBarIcon: ({ focused, color, size}) => (
            <FontAwesome
              name='vcard'
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='userProfile'
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color, size}) => (
            <FontAwesome
              name='home'
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name='groups'
        options={{
          title: 'Groups',
          tabBarIcon: ({ focused, color, size}) => (
            <FontAwesome
              name='users'
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
