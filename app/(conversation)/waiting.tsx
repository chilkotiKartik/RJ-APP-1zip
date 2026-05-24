import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { useStatus } from '@/lib/hooks';

export default function Waiting() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase } = useStatus(10000);

  useEffect(() => {
    if (phase === 'LETTER_READY') {
      router.replace('/(letter)/envelope' as never);
    }
  }, [phase]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom }}>
      <PaperNoise />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack gap={24} style={styles.center}>
          <MonoLabel>Romeo is reading</MonoLabel>
          <JulietPortrait width={180} height={220} rotate={-3} label="Juliet, no. 02" />
          <Text style={{ fontFamily: f.serif, fontSize: 32, color: c.ink, textAlign: 'center', lineHeight: 38, maxWidth: 320 }}>
            She&rsquo;s passed your letter{'\n'}to Romeo now.
          </Text>
          <OrnamentDivider />
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, textAlign: 'center', maxWidth: 300, lineHeight: 23 }}>
            He reads at his own pace. Your envelope will arrive when it arrives — usually within a few days.
          </Text>
        </Stack>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
