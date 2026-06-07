// RJ-APP/components/letter/EnvelopeOpening.tsx
import { useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing, runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { WaxSeal } from '@/components/primitives/WaxSeal';

const W = 300;
const H = 200;
const SEAL = 76;

export function EnvelopeOpening({ onComplete }: { onComplete?: () => void }) {
  const { c } = useRJTheme();
  const sealRot = useSharedValue(0);
  const sealScale = useSharedValue(1);
  const sealOpacity = useSharedValue(1);
  const sealX = useSharedValue(0);
  const sealY = useSharedValue(0);
  const flapRot = useSharedValue(0);
  const letterY = useSharedValue(20);
  const letterOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const started = useSharedValue(0);

  const tap = () => {
    if (started.value) return;
    started.value = 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Phase 1 — wax cracks (800ms) + screen flash
    sealRot.value = withSequence(
      withTiming(-3, { duration: 200 }),
      withTiming(2,  { duration: 250 }),
      withTiming(-18,{ duration: 350 }),
    );
    sealScale.value = withSequence(
      withTiming(1.06, { duration: 200 }),
      withTiming(0.94, { duration: 250 }),
      withTiming(0.9,  { duration: 350 }),
    );
    sealX.value = withTiming(-22, { duration: 800 });
    sealY.value = withTiming(28,  { duration: 800 });
    sealOpacity.value = withTiming(0, { duration: 800 });

    // Flash on crack (at 450ms in)
    flashOpacity.value = withDelay(450, withSequence(
      withTiming(0.55, { duration: 40 }),
      withTiming(0, { duration: 80 }),
    ));

    // Phase 2 — flap unfolds (700ms after 800ms)
    flapRot.value = withDelay(800, withTiming(180, { duration: 700, easing: Easing.inOut(Easing.cubic) }));

    // Phase 3 — letter rises (1200ms after 1500ms) — slower for more drama
    letterY.value = withDelay(1500, withTiming(-180, { duration: 1200, easing: Easing.out(Easing.cubic) }));
    letterOpacity.value = withDelay(1500, withTiming(1, { duration: 700 }, () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onComplete) runOnJS(onComplete)();
    }));
  };

  useEffect(() => {
    const id = setTimeout(tap, 600);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sealStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sealX.value },
      { translateY: sealY.value },
      { rotate: `${sealRot.value}deg` },
      { scale: sealScale.value },
    ],
    opacity: sealOpacity.value,
  }));
  const flapStyle = useAnimatedStyle(() => ({
    transform: [{ perspective: 800 }, { rotateX: `${flapRot.value}deg` }],
  }));
  const letterStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: letterY.value }],
    opacity: letterOpacity.value,
  }));
  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Pressable onPress={tap}>
      <View style={{ width: W, height: H + 200, alignItems: 'center', justifyContent: 'flex-end' }}>
        {/* Letter (rises from inside) */}
        <Animated.View style={[styles.letter, { width: W * 0.84, backgroundColor: c.bg, borderColor: c.rule }, letterStyle]}>
          <View style={{ height: 12, backgroundColor: c.bgSunken, marginBottom: 8 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '70%', marginBottom: 6 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '85%', marginBottom: 6 }} />
          <View style={{ height: 6, backgroundColor: c.bgSunken, width: '60%' }} />
        </Animated.View>

        {/* Envelope body */}
        <View style={{ position: 'absolute', bottom: 0, width: W, height: H }}>
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={StyleSheet.absoluteFill}>
            <Rect x={0} y={0} width={W} height={H} fill={c.bg} stroke={c.rule} strokeWidth={1} />
            <Path d={`M0 80 L${W/2} ${H} L${W} 80 L${W} ${H} L0 ${H} Z`} fill={c.bgSunken} />
          </Svg>
          {/* Flap */}
          <Animated.View style={[{ position: 'absolute', top: 0, left: 0, width: W, height: H * 0.85, transformOrigin: 'top center' }, flapStyle]}>
            <Svg width={W} height={H * 0.85} viewBox={`0 0 ${W} ${H * 0.85}`}>
              <Path d={`M0 0 L${W} 0 L${W/2} ${H * 0.85} Z`} fill={c.bgAlt} stroke={c.rule} strokeWidth={1} />
            </Svg>
          </Animated.View>
          {/* Seal */}
          <Animated.View style={[{ position: 'absolute', top: H * 0.32, left: W / 2 - SEAL / 2 }, sealStyle]}>
            <WaxSeal size={SEAL} />
          </Animated.View>
        </View>

        {/* Flash overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { backgroundColor: 'white', borderRadius: 4, pointerEvents: 'none' }, flashStyle]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  letter: {
    borderWidth: 1, padding: 16,
    marginBottom: 30,
    elevation: 6,
    ...Platform.select({
      web: { boxShadow: '0px 12px 24px rgba(0,0,0,0.18)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 24 },
    }),
  },
});
