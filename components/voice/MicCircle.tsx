import { useEffect } from 'react';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';

export type MicState = 'idle' | 'connecting' | 'connected';

export function MicCircle({
  state, onPress, size = 120,
}: { state: MicState; onPress: () => void; size?: number }) {
  const { c } = useRJTheme();
  const press = useSharedValue(1);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const ring3 = useSharedValue(0);

  useEffect(() => {
    if (state === 'connecting' || state === 'connected') {
      ring1.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }), -1, false);
      ring2.value = withRepeat(withSequence(
        withTiming(0, { duration: 800 }),
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
      ), -1, false);
      ring3.value = withRepeat(withSequence(
        withTiming(0, { duration: 1600 }),
        withTiming(1, { duration: 2400, easing: Easing.out(Easing.ease) }),
      ), -1, false);
    } else {
      ring1.value = 0; ring2.value = 0; ring3.value = 0;
    }
  }, [state]);

  const ring = (sv: Animated.SharedValue<number>) => useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + sv.value * 1.3 }],
    opacity: 0.7 * (1 - sv.value),
  }));

  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: press.value }] }));

  return (
    <View style={{ width: size * 2.4, height: size * 2.4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ring(ring1)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ring(ring2)]} />
      <Animated.View style={[styles.ring, { width: size, height: size, borderColor: c.forest }, ring(ring3)]} />

      <Pressable
        onPressIn={() => { press.value = withTiming(0.94, { duration: 120 }); Haptics.selectionAsync(); }}
        onPressOut={() => { press.value = withTiming(1, { duration: 200 }); }}
        onPress={onPress}
        style={{ position: 'absolute' }}
      >
        <Animated.View style={[styles.btn, {
          width: size, height: size, borderRadius: size / 2,
          backgroundColor: state === 'connected' ? c.forest : c.bgCard,
          borderColor: c.forest,
        }, pressStyle]}>
          <Svg width={size * 0.36} height={size * 0.36} viewBox="0 0 24 24" fill="none">
            <Path d="M9 3h6v12a3 3 0 0 1-6 0V3z" stroke={state === 'connected' ? c.bg : c.forest} strokeWidth={1.4} strokeLinecap="round" />
            <Path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke={state === 'connected' ? c.bg : c.forest} strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  btn: {
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.15)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    }),
  },
});
