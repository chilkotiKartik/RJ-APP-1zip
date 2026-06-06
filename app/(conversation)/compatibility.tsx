// RJ-APP/app/(conversation)/compatibility.tsx
// Radial compatibility wheel — shows which archetypes harmonise with the user's.
import { useEffect, useState } from 'react';
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PrimaryButton } from '@/components/primitives/Button';
import { Row } from '@/components/primitives/layout';
import { ARCHETYPES, ArchetypeId, ARCHETYPE_LIST } from '@/lib/archetypes';
import { supabase } from '@/lib/supabase';

const HARMONISE: Record<ArchetypeId, ArchetypeId[]> = {
  curious:      ['intellectual', 'playful', 'magnetic'],
  grounded:     ['romantic', 'slow', 'curious'],
  intellectual: ['curious', 'grounded', 'slow'],
  magnetic:     ['romantic', 'playful', 'curious'],
  playful:      ['magnetic', 'curious', 'grounded'],
  romantic:     ['grounded', 'magnetic', 'slow'],
  slow:         ['grounded', 'intellectual', 'romantic'],
};

const { width: SW } = Dimensions.get('window');
const RADIUS = Math.min(SW * 0.35, 140);
const CENTER_SIZE = 80;
const OUTER_SIZE = 52;
const OUTER_IDS = ARCHETYPE_LIST.map(a => a.id);

type WheelItemProps = {
  archId: ArchetypeId;
  angle: number;
  isCompatible: boolean;
  index: number;
};

function WheelItem({ archId, angle, isCompatible, index }: WheelItemProps) {
  const arch = ARCHETYPES[archId];
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.4);

  const targetX = Math.cos((angle * Math.PI) / 180) * RADIUS;
  const targetY = Math.sin((angle * Math.PI) / 180) * RADIUS;

  useEffect(() => {
    const delay = index * 80 + 300;
    translateX.value = withDelay(delay, withTiming(targetX, { duration: 500, easing: Easing.out(Easing.back(1.4)) }));
    translateY.value = withDelay(delay, withTiming(targetY, { duration: 500, easing: Easing.out(Easing.back(1.4)) }));
    opacity.value = withDelay(delay, withTiming(isCompatible ? 1 : 0.38, { duration: 300 }));
    scale.value = withDelay(delay, withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.4)) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  const { c } = useRJTheme();

  return (
    <Animated.View style={[styles.outerItem, {
      width: OUTER_SIZE, height: OUTER_SIZE,
      borderWidth: isCompatible ? 2 : 1,
      borderColor: isCompatible ? c.gold : c.ruleSoft,
      backgroundColor: c.bgCard,
    }, style]}>
      <Image
        source={arch.image}
        style={{ width: OUTER_SIZE - 4, height: OUTER_SIZE - 4 }}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </Animated.View>
  );
}

export default function Compatibility() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [myArchetype, setMyArchetype] = useState<ArchetypeId>('curious');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('archetype').eq('user_id', user.id).maybeSingle();
      const arch = (data as { archetype?: string } | null)?.archetype;
      if (arch && arch in ARCHETYPES) setMyArchetype(arch as ArchetypeId);
    })();
  }, []);

  const compatible = HARMONISE[myArchetype] ?? [];
  const others = OUTER_IDS.filter(id => id !== myArchetype);
  const myArch = ARCHETYPES[myArchetype];
  const centerOpacity = useSharedValue(0);
  const centerScale = useSharedValue(0.6);

  useEffect(() => {
    centerOpacity.value = withTiming(1, { duration: 400 });
    centerScale.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.2)) });
  }, []);

  const centerStyle = useAnimatedStyle(() => ({
    opacity: centerOpacity.value,
    transform: [{ scale: centerScale.value }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />
      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <Pressable onPress={() => router.back()}>
          <MonoLabel>← Back</MonoLabel>
        </Pressable>
        <MonoLabel>Compatibility</MonoLabel>
      </Row>

      <View style={{ paddingHorizontal: d.pad }}>
        <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink, lineHeight: 34 }}>
          Who you harmonise with
        </Text>
        <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, marginTop: 6 }}>
          Gold rings show your strongest matches.
        </Text>
      </View>

      {/* Wheel */}
      <View style={styles.wheelContainer}>
        {others.map((id, i) => {
          const angle = (i / others.length) * 360 - 90;
          return (
            <WheelItem
              key={id}
              archId={id}
              angle={angle}
              isCompatible={compatible.includes(id)}
              index={i}
            />
          );
        })}

        {/* Center — user's archetype */}
        <Animated.View style={[styles.centerItem, {
          width: CENTER_SIZE, height: CENTER_SIZE,
          borderWidth: 2, borderColor: c.gold,
          backgroundColor: c.bgCard,
        }, centerStyle]}>
          <Image
            source={myArch.image}
            style={{ width: CENTER_SIZE - 4, height: CENTER_SIZE - 4 }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </Animated.View>
      </View>

      <View style={{ paddingHorizontal: d.pad, marginTop: 8 }}>
        <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.forest, textAlign: 'center', marginBottom: 6 }}>
          {myArch.name}
        </Text>
        <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, textAlign: 'center' }}>
          harmonises with {compatible.map(id => ARCHETYPES[id].name).join(', ')}
        </Text>
      </View>

      <View style={{ padding: d.pad, paddingBottom: insets.bottom + 14, marginTop: 'auto' }}>
        <PrimaryButton onPress={() => router.replace('/(conversation)/waiting' as never)}>
          Continue
        </PrimaryButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: RADIUS * 2 + CENTER_SIZE + 40,
    marginTop: 20,
  },
  outerItem: {
    position: 'absolute',
    borderRadius: 4,
    overflow: 'hidden',
  },
  centerItem: {
    borderRadius: 6,
    overflow: 'hidden',
  },
});
