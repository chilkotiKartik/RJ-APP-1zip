import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, SecondaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { supabase } from '@/lib/supabase';

export default function Respond() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!choice) return Alert.alert('Choose yes or no first.');
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Mark response on the active match — exact schema depends on /api/match/respond.
      // For now, store as a placeholder note on the profile.
      await supabase.from('profiles').update({
        questionnaire_answers: { ...(({} as Record<string, unknown>)), last_response: { choice, note, ts: new Date().toISOString() } },
      }).eq('user_id', user.id);
    }
    setBusy(false);
    router.replace('/(letter)/sent' as never);
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>Your reply</MonoLabel>
        </Row>

        <Stack gap={12} style={{ marginTop: 28 }}>
          <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.05 }}>
            What shall I tell{'\n'}him?
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, lineHeight: 23 }}>
            One word will do. A note is welcome if you have one.
          </Text>
        </Stack>

        <View style={{ marginTop: 22, marginBottom: 14 }}>
          <OrnamentDivider />
        </View>

        <Row gap={10}>
          <View style={{ flex: 1 }}>
            <PrimaryButton onPress={() => setChoice('yes')} style={choice === 'yes' ? undefined : { opacity: 0.6 } as never}>Yes</PrimaryButton>
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton onPress={() => setChoice('no')} style={choice === 'no' ? undefined : { opacity: 0.6 } as never}>No</SecondaryButton>
          </View>
        </Row>

        <View style={{ marginTop: 22 }}>
          <MonoLabel>Note · optional</MonoLabel>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="One sentence, perhaps."
            placeholderTextColor={c.inkMuted as string}
            multiline
            style={{
              borderWidth: 1, borderColor: c.rule, marginTop: 6,
              padding: 14, fontFamily: f.serif, fontSize: 17, color: c.ink,
              minHeight: 120, textAlignVertical: 'top',
            }}
          />
        </View>

        <View style={{ marginTop: 24 }}>
          <PrimaryButton onPress={send}>{busy ? 'Sending…' : 'Send to Romeo'}</PrimaryButton>
        </View>
      </View>
    </ScreenScroll>
  );
}
