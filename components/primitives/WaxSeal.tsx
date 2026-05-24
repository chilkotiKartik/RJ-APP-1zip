// RJ-APP/components/primitives/WaxSeal.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Path, Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { useRJTheme } from '@/theme/useRJTheme';

const SEAL_PATH =
  'M50,0 L65,8 L78,4 L88,18 L96,30 L100,50 L96,70 L88,82 L78,96 L65,92 L50,100 L35,92 L22,96 L12,82 L4,70 L0,50 L4,30 L12,18 L22,4 L35,8 Z';

export function WaxSeal({ size = 64, pulse = false }: { size?: number; pulse?: boolean }) {
  const { c, f } = useRJTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.9);

  useEffect(() => {
    if (pulse) {
      scale.value = withRepeat(withTiming(1.04, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
      opacity.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      scale.value = 1;
      opacity.value = 1;
    }
  }, [pulse, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, animStyle]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <RadialGradient id="waxGrad" cx="32%" cy="28%" r="80%">
            <Stop offset="0%" stopColor={c.wax} />
            <Stop offset="70%" stopColor={c.waxDeep} />
          </RadialGradient>
        </Defs>
        <Path d={SEAL_PATH} fill="url(#waxGrad)" />
        <Circle cx="50" cy="50" r="34" fill="none" stroke={c.goldLight} strokeOpacity={0.3} strokeWidth={1} />
      </Svg>
      <View style={styles.monogram} pointerEvents="none">
        <Text style={{
          fontFamily: f.serifI, fontSize: size * 0.42, color: c.goldLight,
        }}>R<Text style={{ fontSize: size * 0.22, opacity: 0.7 }}>&</Text>J</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  monogram: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
});
