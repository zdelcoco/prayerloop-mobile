import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen
        name='ContactDetail'
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name='PrayerModal'
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name='AddPrayerCardModal'
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
