import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet } from 'react-native';

// Simple fallback screen - no navigation logic to prevent conflicts
export default function IndexScreen() {
  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={styles.splashContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0.6 }}
    >
      <View style={styles.splashContent}>
        <Text style={styles.appName}>prayerloop</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  appName: {
    fontSize: 48,
    marginBottom: 20,    
    fontFamily: 'InstrumentSans-SemiBold',
  },
});
