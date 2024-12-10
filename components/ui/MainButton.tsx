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
    backgroundColor: '#008000',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'InstrumentSans-SemiBold',
  },
});

export default MainButton;
