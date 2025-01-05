import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddPrayer" 
        options={{ headerShown: false, presentation: 'modal' }}
      />
    </Stack>
  );
}
