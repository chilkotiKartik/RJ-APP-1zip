// RJ-APP/app/(auth)/rejected.tsx
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { SecondaryButton } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { supabase } from '@/lib/supabase';

export default function Rejected() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();

  const onSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort; user wanted out
    }
    router.replace('/');
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{
        padding: d.pad,
        paddingTop: d.pad + insets.top,
        paddingBottom: d.pad + insets.bottom,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <Stack gap={28} style={styles.center}>
          <MonoLabel color={c.inkMuted}>With our regrets</MonoLabel>
          <View style={{ opacity: 0.5 }}>
            <JulietPortrait width={140} height={170} rotate={-2} label="" />
          </View>
          <Text style={{
            fontFamily: f.serifI,
            fontSize: 26,
            color: c.ink,
            textAlign: 'center',
            lineHeight: 34,
            maxWidth: 300,
          }}>
            The room isn&rsquo;t open to you{'\n'}at this time.
          </Text>
          <OrnamentDivider />
          <Text style={{
            fontFamily: f.bodyI,
            fontSize: 15,
            color: c.inkMuted,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 22,
          }}>
            With our regrets — Romeo &amp; Juliet
          </Text>
          <View style={{ width: 220, marginTop: 12 }}>
            <SecondaryButton onPress={onSignOut}>Sign out</SecondaryButton>
          </View>
        </Stack>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
