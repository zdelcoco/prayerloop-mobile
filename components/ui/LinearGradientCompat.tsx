import React from 'react';
import { View, ViewStyle } from 'react-native';

interface LinearGradientCompatProps {
  colors: string[];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

// Temporary compatibility wrapper for LinearGradient
// Uses the first color as solid background until SDK 53 gradient issues are resolved
export function LinearGradientCompat({ colors, style, children }: LinearGradientCompatProps) {
  return (
    <View style={[style, { backgroundColor: colors[0] || '#90C590' }]}>
      {children}
    </View>
  );
}