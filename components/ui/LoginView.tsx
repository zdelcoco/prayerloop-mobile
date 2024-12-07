import { Button, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';

function LoginView({ onPress }: { onPress: () => void }) {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl;
  console.log('apiUrl:', apiUrl);

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <LinearGradient
        colors={['#90C590', '#F6EDD9']}
        style={styles.gradient}
        end={{x: 1, y: .6}}
      >
         <Text style={styles.text}>Login Screen</Text>
         <Text>{apiUrl}</Text>
         <Button title="Login" onPress={onPress} />
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
    fontSize: 28,
    marginBottom: 20,    
    fontFamily: 'InstrumentSans-SemiBold',
  }
});

export default LoginView;
