import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';

const MUTED_GREEN = '#ccf0ccff';
const ACTIVE_GREEN = '#2E7D32';

interface ProfileButtonProps {
  firstName: string;
  lastName: string;
  onPress: () => void;
  size?: number;
}

export default function ProfileButton({
  firstName,
  lastName,
  onPress,
  size = 36,
}: ProfileButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const initials = `${firstName?.[0]?.toUpperCase() || ''}${lastName?.[0]?.toUpperCase() || ''}`;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const dynamicStyles = {
    button: {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    text: {
      fontSize: size * 0.4,
    },
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.button,
          dynamicStyles.button,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={[styles.text, dynamicStyles.text]}>{initials}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: MUTED_GREEN,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 1,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  text: {
    color: ACTIVE_GREEN,
    fontFamily: 'InstrumentSans-Bold',
    fontWeight: '700',
  },
});
