// RJ-APP/components/effects/RosePetals.tsx
// Pure Reanimated 3 worklet rose petal particle system.
// Call startPetals() to trigger a shower of petals.
import { useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const COUNT = 12;
const COLORS = ['#B89766', '#B89766', '#8B3A3A', '#B89766', '#8B3A3A', '#B89766'];

function petalPath(w: number, h: number) {
  return `M${w / 2},0 C${w * 0.9},0 ${w},${h * 0.35} ${w / 2},${h} C0,${h * 0.35} 0,0 ${w / 2},0 Z`;
}

type PetalConfig = {
  x: number;
  startY: number;
  endX: number;
  endY: number;
  rot: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
};

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function makePetals(): PetalConfig[] {
  return Array.from({ length: COUNT }, (_, i) => ({
    x: randomBetween(SW * 0.05, SW * 0.95),
    startY: -20,
    endX: randomBetween(-60, 60),
    endY: SH + 40,
    rot: randomBetween(-360, 360),
    color: COLORS[i % COLORS.length],
    delay: i * 80 + randomBetween(0, 120),
    duration: randomBetween(2200, 3800),
    size: randomBetween(10, 18),
  }));
}

type PetalProps = PetalConfig & {
  active: boolean;
};

function Petal({ x, startY, endX, endY, rot, color, delay, duration, size, active }: PetalProps) {
  const translateY = useSharedValue(startY);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);
  const started = useRef(false);

  useEffect(() => {
    if (!active || started.current) return;
    started.current = true;

    opacity.value = withDelay(delay, withTiming(0.85, { duration: 400 }));
    translateY.value = withDelay(delay, withTiming(endY, { duration, easing: Easing.inOut(Easing.ease) }));
    translateX.value = withDelay(delay, withTiming(endX, { duration, easing: Easing.inOut(Easing.ease) }));
    rotate.value = withDelay(delay, withTiming(rot, { duration, easing: Easing.linear }));

    const fadeDelay = delay + duration * 0.75;
    opacity.value = withDelay(fadeDelay, withTiming(0, { duration: duration * 0.3 }));
  }, [active]);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: x,
    top: 0,
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[style, { pointerEvents: 'none' }]}>
      <Svg width={size} height={size * 1.5} viewBox={`0 0 ${size} ${size * 1.5}`}>
        <Path d={petalPath(size, size * 1.5)} fill={color} fillOpacity={0.82} />
      </Svg>
    </Animated.View>
  );
}

type Props = {
  running: boolean;
};

export function RosePetals({ running }: Props) {
  const petals = useRef<PetalConfig[]>(makePetals());

  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
      {petals.current.map((p, i) => (
        <Petal key={i} {...p} active={running} />
      ))}
    </View>
  );
}
