// RJ-APP/app/(auth)/signin.tsx
import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { signInWithGoogle } from '@/lib/auth';

export default function SignIn() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const onGoogle = async () => {
    setBusy(true);
    const r = await signInWithGoogle();
    setBusy(false);
    if (!r.ok) {
      if (r.error !== 'Cancelled') Alert.alert('Sign in didn\'t complete', r.error ?? 'Try again');
      return;
    }
    // Bounce through the root router so returning users with completed
    // profiles skip referral and land on the right screen for their phase.
    router.replace('/' as never);
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => router.back()}>← Back</TextLink>
          <MonoLabel>Sign in</MonoLabel>
        </Row>

        <View style={{ alignItems: 'center', marginTop: 24 }}>
          <JulietPortrait width={140} height={170} rotate={-3} label="Juliet, no. 02" />
        </View>

        <View style={{ marginTop: 56, gap: 12, alignItems: 'center' }}>
          <Text style={{ fontFamily: f.serifI, fontSize: 24, color: c.ink, textAlign: 'center', maxWidth: 280, lineHeight: 32 }}>
            Welcome back.{'\n'}She has kept your seat.
          </Text>
        </View>

        <View style={{ marginTop: 32, marginBottom: 16 }}>
          <OrnamentDivider />
        </View>

        <Stack gap={12}>
          <PrimaryButton onPress={onGoogle}>
            {busy ? 'Opening…' : 'Continue with Google'}
          </PrimaryButton>
          <View style={{ alignItems: 'center' }}>
            <TextLink onPress={() => router.push('/(auth)/referral' as never)}>I have a referral code</TextLink>
          </View>
        </Stack>
      </View>
    </ScreenScroll>
  );
}
