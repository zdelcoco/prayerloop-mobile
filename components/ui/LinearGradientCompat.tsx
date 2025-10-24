import { ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface LinearGradientCompatProps {
  colors: readonly [string, string, ...string[]];
  style?: ViewStyle;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  children?: React.ReactNode;
}

export function LinearGradientCompat({ colors, style, start, end, children }: LinearGradientCompatProps) {
  return (
    <LinearGradient
      colors={colors}
      style={style}
      start={start}
      end={end}
    >
      {children}
    </LinearGradient>
  );
}