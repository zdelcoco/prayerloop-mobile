import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack>
      <Stack.Screen
        name='intro'
        options={{ title: 'Intro', headerShown: false }}
      />
      <Stack.Screen
        name='login'
        options={{
          title: 'Login',
          headerShown: false,
          animation: 'fade_from_bottom',
        }}
      />
    </Stack>
  );
}
