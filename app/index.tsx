import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';

export default function IntroScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Welcome to the App!</Text>
    </View>
  );
}
