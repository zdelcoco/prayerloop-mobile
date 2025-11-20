import { Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradientCompat as LinearGradient } from '@/components/ui/LinearGradientCompat';

function IntroView({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{x: 1, y: .6
        }}
      >
        <Text style={styles.text}>prayerloop</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 48,    
    marginBottom: 20,
  }
});

export default IntroView;