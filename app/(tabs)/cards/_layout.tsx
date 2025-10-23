import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';
import { Stack } from 'expo-router';

export default function CardsLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
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
    </Stack>
  );
}
