import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen
        name='PrayerModal'
        options={{
          headerShown: true,
          headerTitle: 'Add a Prayer Request',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
