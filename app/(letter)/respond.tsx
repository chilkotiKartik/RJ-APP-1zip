// RJ-APP/app/(letter)/respond.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, SecondaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { supabase } from '@/lib/supabase';
import { useStatus, useMatches } from '@/lib/hooks';

export default function Respond() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useStatus(0);
  const { matches } = useMatches(userId);

  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const selectChoice = (c_: 'yes' | 'no') => {
    Haptics.selectionAsync();
    setChoice(c_);
  };

  const send = async () => {
    if (!choice) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Your answer', 'Please choose yes or no first.');
      return;
    }
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const match = matches[0];
        if (match) {
          const column = match.user_a === user.id ? 'a_response' : 'b_response';
          await supabase
            .from('matches')
            .update({ [column]: JSON.stringify({ choice, note, ts: new Date().toISOString() }) })
            .eq('id', match.id);
        }
        // Also store on profile as fallback
        await supabase.from('profiles').update({
          questionnaire_answers: {
            last_response: { choice, note, ts: new Date().toISOString() },
          },
        }).eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('Response save error:', e);
    } finally {
      setBusy(false);
      router.replace('/(letter)/sent' as never);
    }
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{
        padding: d.pad,
        paddingTop: d.pad + insets.top,
        paddingBottom: d.pad + insets.bottom,
        flex: 1,
      }}>
        {/* Header */}
        <Row justify="space-between">
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>Your reply</MonoLabel>
        </Row>

        {/* Title */}
        <Stack gap={10} style={{ marginTop: 28 }}>
          <MonoLabel color={c.gold}>Romeo is waiting</MonoLabel>
          <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.05 }}>
            What shall I{'\n'}tell him?
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted, lineHeight: 24 }}>
            One word will do. A note is welcome if you have one.
          </Text>
        </Stack>

        <View style={{ marginTop: 22, marginBottom: 18 }}>
          <OrnamentDivider />
        </View>

        {/* Yes / No choice */}
        <Row gap={12}>
          <Pressable
            onPress={() => selectChoice('yes')}
            style={[
              styles.choiceCard,
              {
                borderColor: choice === 'yes' ? c.forest : c.rule,
                backgroundColor: choice === 'yes' ? `${c.forest}12` : c.bgCard,
                flex: 1,
              },
            ]}
          >
            <Text style={[styles.choiceEmoji]}>✦</Text>
            <Text style={[styles.choiceLabel, { fontFamily: f.serif, color: choice === 'yes' ? c.forest : c.ink }]}>
              Yes
            </Text>
            {choice === 'yes' && (
              <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.forest, marginTop: 4, textAlign: 'center' }}>
                I&rsquo;d like to meet
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => selectChoice('no')}
            style={[
              styles.choiceCard,
              {
                borderColor: choice === 'no' ? c.wax : c.rule,
                backgroundColor: choice === 'no' ? `${c.wax}10` : c.bgCard,
                flex: 1,
              },
            ]}
          >
            <Text style={[styles.choiceEmoji]}>◇</Text>
            <Text style={[styles.choiceLabel, { fontFamily: f.serif, color: choice === 'no' ? c.wax : c.ink }]}>
              Not this time
            </Text>
            {choice === 'no' && (
              <Text style={{ fontFamily: f.bodyI, fontSize: 12, color: c.wax, marginTop: 4, textAlign: 'center' }}>
                Perhaps someone else
              </Text>
            )}
          </Pressable>
        </Row>

        {/* Optional note */}
        <View style={{ marginTop: 24 }}>
          <Row gap={6} style={{ marginBottom: 8 }}>
            <MonoLabel>A note to Romeo</MonoLabel>
            <MonoLabel color={c.inkMuted}>· optional</MonoLabel>
          </Row>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="One sentence, perhaps."
            placeholderTextColor={c.inkMuted as string}
            multiline
            style={[styles.noteInput, {
              borderColor: c.rule,
              backgroundColor: c.bgCard,
              color: c.ink,
              fontFamily: f.serif,
            }]}
            textAlignVertical="top"
          />
        </View>

        {/* Send */}
        <View style={{ marginTop: 28, gap: 10 }}>
          <PrimaryButton onPress={send}>
            {busy ? 'Sending…' : 'Send to Romeo'}
          </PrimaryButton>
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  choiceCard: {
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  choiceEmoji: {
    fontSize: 22,
    color: '#B89766',
  },
  choiceLabel: {
    fontSize: 24,
    lineHeight: 28,
    textAlign: 'center',
  },
  noteInput: {
    borderWidth: 1,
    padding: 16,
    fontSize: 18,
    lineHeight: 27,
    minHeight: 110,
  },
});
