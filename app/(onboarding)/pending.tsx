// RJ-APP/app/(onboarding)/pending.tsx
import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { TextLink } from '@/components/primitives/Button';
import { useStatus } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';
import { registerForPushNotifications } from '@/lib/push';

export default function Pending() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase, loading } = useStatus(8000);

  useEffect(() => {
    // Register for push notifications while user waits
    registerForPushNotifications().catch(() => {});
  }, []);

  useEffect(() => {
    if (loading) return;
    if (phase === 'APPROVED' || phase === 'CHATTING') {
      router.replace('/(conversation)/voice' as never);
    } else if (phase === 'REJECTED') {
      router.replace('/(auth)/rejected');
    } else if (phase === 'PROFILE' || phase === 'REFERRAL') {
      router.replace('/');
    }
  }, [phase, loading]);

  const onSignOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* best-effort */ }
    router.replace('/');
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Stack gap={28} style={styles.center}>
          <MonoLabel>Under review</MonoLabel>
          <WaxSeal size={120} pulse />
          <Text style={{ fontFamily: f.serif, fontSize: 34, color: c.ink, textAlign: 'center', lineHeight: 40, maxWidth: 320 }}>
            Your letter is{' '}
            <Text style={{ fontStyle: 'italic', color: c.forest }}>in her hands now.</Text>
          </Text>
          <OrnamentDivider />
          <Text style={{ fontFamily: f.bodyI, fontSize: 17, color: c.inkMuted, textAlign: 'center', maxWidth: 300, lineHeight: 25 }}>
            Juliet reads slowly. We&rsquo;ll let you know the moment she&rsquo;s ready to meet.
          </Text>
        </Stack>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <TextLink onPress={onSignOut} color={c.inkMuted}>Sign out</TextLink>
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
