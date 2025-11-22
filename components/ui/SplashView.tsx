import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradientCompat as LinearGradient } from './LinearGradientCompat';

export default function SplashView() {
  return (
    <LinearGradient
      colors={['#90C590', '#F6EDD9']}
      style={styles.container}
      end={{ x: 1, y: 0.6 }}
    >
      <View style={styles.content}>
        <Text style={styles.title}>prayerloop</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 48,
    fontFamily: 'InstrumentSans-Bold',
    color: '#2D5F2E',
    letterSpacing: 1,
  },
});
