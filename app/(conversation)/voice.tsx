import { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { MicCircle, MicState } from '@/components/voice/MicCircle';

// Voice with Juliet via @elevenlabs/react-native is wired in the EAS dev-client phase
// (the SDK depends on LiveKit native modules that aren't supported in Expo Go).
// This screen ships the full UX with a simulated session so the flow is demoable now.
const TOTAL_QUESTIONS = 12;

export default function Voice() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<MicState>('idle');
  const [q, setQ] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const press = () => {
    if (state === 'idle') {
      setState('connecting');
      setTimeout(() => {
        setState('connected');
        timer.current = setInterval(() => {
          setQ(prev => Math.min(prev + 1, TOTAL_QUESTIONS));
        }, 4500);
      }, 1200);
    } else {
      if (timer.current) clearInterval(timer.current);
      setState('idle');
    }
  };

  const canFinish = q >= 8;
  const status =
    state === 'idle'        ? 'Press to begin'
    : state === 'connecting' ? 'Connecting…'
    : q % 2 === 0           ? 'She’s listening to you…'
    :                          'Juliet is speaking…';

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>Speak to Juliet</MonoLabel>
        </Row>

        <View style={{ alignItems: 'center', marginTop: 14 }}>
          <JulietPortrait width={120} height={150} rotate={-2} label={undefined as never} />
        </View>

        <Stack gap={10} style={{ marginTop: 28 }}>
          <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.ink, textAlign: 'center', lineHeight: 30 }}>
            Dear friend,
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, textAlign: 'center', lineHeight: 24 }}>
            {state === 'idle' ? 'Press the seal to speak. Juliet will reply when you pause.' : status}
          </Text>
        </Stack>

        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <MicCircle state={state} onPress={press} size={120} />
        </View>

        <View style={{ marginTop: 22, alignItems: 'center' }}>
          <MonoLabel>Question {q} of {TOTAL_QUESTIONS}</MonoLabel>
          <View style={[styles.progressTrack, { backgroundColor: c.ruleSoft, marginTop: 8 }]}>
            <View style={[styles.progressFill, { backgroundColor: c.forest, width: `${(q / TOTAL_QUESTIONS) * 100}%` }]} />
          </View>
        </View>

        <View style={{ marginTop: 'auto', paddingTop: 28 }}>
          <PrimaryButton onPress={() => router.replace('/(conversation)/questionnaire' as never)}>
            {canFinish ? 'Finish & continue' : 'Continue when ready'}
          </PrimaryButton>
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  progressTrack: { width: 220, height: 2, overflow: 'hidden' },
  progressFill: { height: '100%' },
});
