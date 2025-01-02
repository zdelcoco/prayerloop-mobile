import React from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  PressableProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface AddButtonProps extends PressableProps {
  onPress: () => void;
  buttonStyle?: ViewStyle;
  accessibilityLabel?: string;
}

function AddButton({
  onPress,
  buttonStyle,
  accessibilityLabel,
  ...pressableProps
}: AddButtonProps) {
  return (
    <Pressable
      style={[styles.button, buttonStyle]}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      {...pressableProps}
    >
      <FontAwesome name="plus" color="white" size={24} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#008000', // Green background
    padding: 15,
    borderRadius: 30, // Makes it circular
    height: 60,
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute', // Makes it float
    bottom: 20, // Distance from the bottom of the screen
    right: 20, // Distance from the right edge of the screen
    shadowColor: '#000', // Adds shadow for better visibility
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5, // For Android shadow
  },
});

export default AddButton;
