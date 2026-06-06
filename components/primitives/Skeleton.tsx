// RJ-APP/components/primitives/Skeleton.tsx
// Pulsing animated placeholder using Reanimated interpolation.
import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRJTheme } from '@/theme/useRJTheme';

function usePulse() {
  const opacity = useSharedValue(0.4);
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.9, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}

export function SkeletonLine({ width, style }: { width: number | string; style?: object }) {
  const { c } = useRJTheme();
  const pulse = usePulse();
  return (
    <Animated.View
      style={[{ height: 14, backgroundColor: c.bgAlt, borderRadius: 3, width }, pulse, style]}
    />
  );
}

export function SkeletonBlock({ height, style }: { height: number; style?: object }) {
  const { c } = useRJTheme();
  const pulse = usePulse();
  return (
    <Animated.View
      style={[{ width: '100%', backgroundColor: c.bgAlt, borderRadius: 3, height }, pulse, style]}
    />
  );
}
