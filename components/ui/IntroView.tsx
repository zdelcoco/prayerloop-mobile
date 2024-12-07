import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function IntroView({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{x: 1, y: .6
        }}
      >
        <Text style={styles.text}>prayerloop.</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 48,
    marginBottom: 20,    
    fontFamily: 'InstrumentSans-SemiBold',
  }
});

export default IntroView;