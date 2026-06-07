// RJ-APP/lib/shadow.ts
// Cross-platform shadow helper.
// Returns boxShadow on web (no deprecation warning) and shadow* on native.
import { Platform, ViewStyle } from 'react-native';

export function makeShadow(
  color: string,
  y: number,
  blur: number,
  opacity: number,
  elevation = 4,
): ViewStyle {
  if (Platform.OS === 'web') {
    // Parse hex color — fall back to black
    const hex = color.startsWith('#') ? color : '#000000';
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return { boxShadow: `0px ${y}px ${blur}px rgba(${r},${g},${b},${opacity})` } as ViewStyle;
  }
  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}
