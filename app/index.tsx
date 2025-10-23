import { View, Text, StyleSheet } from 'react-native';

// Simple fallback screen - no navigation logic to prevent conflicts
export default function IndexScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashContent}>
        <Text style={styles.appName}>prayerloop</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#90C590',
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
    color: '#FFFFFF',
  },
});
