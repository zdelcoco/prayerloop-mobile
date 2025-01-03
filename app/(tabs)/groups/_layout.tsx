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
    </Stack>
  );
}
