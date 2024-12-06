import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="cards" options={{ title: 'Cards' }} />
      <Tabs.Screen name="userProfile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups' }} />
    </Tabs>
  );
}
