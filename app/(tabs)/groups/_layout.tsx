import { Stack } from 'expo-router';

export default function GroupsLayout() {

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CircleDetail"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ContactDetail"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditCircle"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="GroupPrayers"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupModal"
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="JoinGroupModal"
        options={{
          headerShown: false,
          presentation: 'modal',
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
      <Stack.Screen
        name='UsersModal'
        options={{
          title: 'Circle Members',
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name='EditPrayerCardModal'
        options={{
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
