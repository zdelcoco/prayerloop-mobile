import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, PressableProps } from 'react-native';

interface ButtonProps extends PressableProps {
  title: string;
  onPress: () => void;
  buttonStyle?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

function MainButton({
  title,
  onPress,
  buttonStyle,
  textStyle,
  accessibilityLabel,
  ...pressableProps
}: ButtonProps) {
  return (
    <Pressable
      style={[styles.button, buttonStyle]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel || title}
      {...pressableProps}
    >
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: '#008000',
    borderRadius: 8,
    padding: 15,
  },
  text: {
    color: '#fff',
    fontFamily: 'InstrumentSans-SemiBold',
    fontSize: 16,
  },
});

export default MainButton;
