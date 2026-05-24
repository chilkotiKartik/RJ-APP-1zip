// RJ-APP/app/(auth)/referral.tsx
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { redeemReferral } from '@/lib/api';

export default function Referral() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (code.trim().length < 4) return;
    setBusy(true);
    const r = await redeemReferral(code.trim().toUpperCase());
    setBusy(false);
    if (!r.ok) {
      Alert.alert('That code did not open the door.', r.error ?? 'Try another.');
      return;
    }
    // Profile screen is Phase 2; for v1 this 404s gracefully.
    router.push('/(onboarding)/profile' as never);
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => router.back()}>← Back</TextLink>
          <MonoLabel>Step 1 of 4</MonoLabel>
        </Row>

        <View style={{ marginTop: 40, gap: 16 }}>
          <MonoLabel>By referral only</MonoLabel>
          <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.05 }}>
            Who sent you here?
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 17, color: c.inkMuted, lineHeight: 25, marginTop: 4 }}>
            Romeo and Juliet only meet people brought by friends. Enter the code you were given.
          </Text>
        </View>

        <View style={{ marginTop: 32, marginBottom: 16 }}>
          <OrnamentDivider />
        </View>

        <Stack gap={10} style={{ marginTop: 4 }}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="LAUNCH-001"
            placeholderTextColor={c.inkMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, {
              borderColor: c.rule, color: c.ink,
              fontFamily: f.mono, backgroundColor: c.bgCard,
            }]}
          />
          <PrimaryButton onPress={submit}>
            {busy ? 'Checking…' : 'Continue'}
          </PrimaryButton>
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <TextLink onPress={() => router.push('/(auth)/signin' as never)}>I already have an account</TextLink>
          </View>
        </Stack>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1, padding: 18, fontSize: 18, letterSpacing: 4,
    textAlign: 'center',
  },
});
