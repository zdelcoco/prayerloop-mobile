import { Stack } from 'expo-router';

export default function GroupsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupPrayers" 
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupModal"
        options={{
          title: "Create a new group",
          headerShown: true,
          headerTransparent: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 18,
            fontFamily: 'InstrumentSans-Bold',
          },
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name='PrayerModal'
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitleAlign: 'left',
          headerTitleStyle: {
            fontSize: 18,
            fontFamily: 'InstrumentSans-Bold',
          },
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name='UsersModal'
        options={{
          title: 'Group Members',
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
      <Stack.Screen
        name='UsersModalSimple'
        options={{
          title: 'Group Members (Simple)',
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />
    </Stack>
  );
}
