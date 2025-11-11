import { View } from 'react-native';
import { Redirect } from 'expo-router';
import { useSelector } from 'react-redux';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';

// Root index redirects immediately based on auth state
// Renders gradient background to match login screen during transition
export default function IndexScreen() {
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);

  // Match login screen gradient to prevent flash
  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={{ flex: 1 }}
      end={{ x: 1, y: 0.6 }}
    >
      {isAuthenticated ? (
        <Redirect href="/(tabs)/cards" />
      ) : (
        <Redirect href="/(auth)/login" />
      )}
    </LinearGradient>
  );
}
