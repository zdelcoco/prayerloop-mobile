import { LinearGradient } from 'expo-linear-gradient';
import { View, Text, StyleSheet } from 'react-native';

// This will serve as a fallback/loading screen
export default function IndexScreen() {
  return (
    <LinearGradient
      colors={['#90c590', '#ffffff']}
      style={styles.splashContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
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
    fontSize: 36,
    fontFamily: 'InstrumentSans-Bold',
    color: '#333',
    marginBottom: 8,
  },
});
