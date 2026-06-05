// RJ-APP/app/(auth)/welcome.tsx
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PrimaryButton, SecondaryButton } from '@/components/primitives/Button';

const ENV_W = 280;
const ENV_H = 190;

export default function Welcome() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();

  // Entrance animations
  const envFade = useRef(new Animated.Value(0)).current;
  const envSlide = useRef(new Animated.Value(24)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const btnFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(envFade, { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(envSlide, { toValue: 0, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(textFade, { toValue: 1, duration: 500, delay: 300, useNativeDriver: true }),
      Animated.timing(btnFade, { toValue: 1, duration: 450, delay: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenScroll style={{ backgroundColor: c.bgAlt }}>
      <PaperNoise />
      <View style={[styles.frame, {
        paddingTop: d.pad + insets.top,
        paddingHorizontal: d.pad,
        paddingBottom: d.pad + insets.bottom,
      }]}>
        <Row justify="space-between">
          <MonoLabel>R&J</MonoLabel>
          <PostmarkStamp size={44} rotate={-9} />
        </Row>

        <Animated.View style={[styles.hero, { opacity: envFade, transform: [{ translateY: envSlide }] }]}>
          {/* Envelope */}
          <View style={styles.envelope}>
            <Svg width={ENV_W} height={ENV_H} viewBox={`0 0 ${ENV_W} ${ENV_H}`} style={StyleSheet.absoluteFill}>
              <Rect x={0} y={0} width={ENV_W} height={ENV_H} fill={c.bg} stroke={c.rule} strokeWidth={1} />
              <Path d={`M0 76 L${ENV_W / 2} ${ENV_H} L${ENV_W} 76 L${ENV_W} ${ENV_H} L0 ${ENV_H} Z`} fill={c.bgSunken} />
              <Path d={`M0 0 L${ENV_W} 0 L${ENV_W / 2} 167 Z`} fill={c.bgAlt} />
            </Svg>
            <View style={styles.seal}>
              <WaxSeal size={64} pulse />
            </View>
            <Text style={[styles.handwritten, { fontFamily: f.script, color: c.indigo }]}>
              For you,{'\n'}whenever you're ready.
            </Text>
          </View>
        </Animated.View>

        <Animated.View style={{ opacity: textFade, alignItems: 'center' }}>
          <Text style={[styles.subhead, { fontFamily: f.bodyI, color: c.ink }]}>
            A private introduction service.{'\n'}One letter at a time. By referral only.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: btnFade }}>
          <Stack gap={10}>
            <PrimaryButton onPress={() => router.push('/(auth)/referral' as never)}>
              Open the room
            </PrimaryButton>
            <SecondaryButton onPress={() => router.push('/(auth)/signin' as never)}>
              Sign in
            </SecondaryButton>
          </Stack>
        </Animated.View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, minHeight: 720, gap: 28 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  envelope: {
    width: ENV_W, height: ENV_H, position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.35, shadowOffset: { width: 0, height: 20 }, shadowRadius: 44,
    elevation: 8,
  },
  seal: {
    position: 'absolute', top: '38%', left: '50%',
    marginLeft: -32, marginTop: -32,
  },
  handwritten: {
    position: 'absolute', bottom: 20, left: 22,
    fontSize: 22, transform: [{ rotate: '-2deg' }],
  },
  subhead: { fontSize: 20, lineHeight: 30, textAlign: 'center', maxWidth: 280 },
});
