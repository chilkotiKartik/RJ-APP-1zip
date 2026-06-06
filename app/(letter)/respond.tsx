// RJ-APP/app/(letter)/respond.tsx
// Full-screen paper composer with stamp-style Yes/No and wax seal send animation.
import { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, Pressable, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue, useAnimatedStyle, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus, useMatches, otherUserName } from '@/lib/hooks';
import { respondToMatch } from '@/lib/api';

const MAX_NOTE = 500;

export default function Respond() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useStatus(0);
  const { matches } = useMatches(userId);

  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const sealScale = useSharedValue(1);
  const sealAnim = useAnimatedStyle(() => ({ transform: [{ scale: sealScale.value }] }));

  const match = matches[0];
  const matchName = match ? otherUserName(match, userId) : 'Romeo';

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

    // Wax seal press animation
    sealScale.value = withSequence(
      withTiming(0.95, { duration: 100, easing: Easing.out(Easing.ease) }),
      withTiming(1.05, { duration: 150, easing: Easing.out(Easing.back(2)) }),
      withTiming(1.0, { duration: 150 }),
    );

    setBusy(true);
    try {
      if (match) {
        await respondToMatch(match.id, choice, note.trim() || undefined);
      }
    } catch (e) {
      console.warn('Response save error:', e);
    } finally {
      setBusy(false);
      setTimeout(() => router.replace('/(letter)/sent' as never), 400);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperNoise />
      <ScrollView
        contentContainerStyle={{
          padding: d.pad,
          paddingTop: d.pad + insets.top,
          paddingBottom: d.pad + insets.bottom + 80,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Row justify="space-between" style={{ marginBottom: 28 }}>
          <Pressable onPress={() => safeBack()}>
            <MonoLabel>← Back</MonoLabel>
          </Pressable>
          <MonoLabel>Your reply</MonoLabel>
        </Row>

        {/* Title */}
        <Stack gap={6}>
          <MonoLabel color={c.gold}>Romeo is waiting</MonoLabel>
          <Text style={{ fontFamily: f.serifI, fontSize: 28, color: c.ink, lineHeight: 34, maxWidth: 280 }}>
            Your reply to {matchName}
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, lineHeight: 22 }}>
            One word will do. A note is welcome if you have one.
          </Text>
        </Stack>

        <View style={{ marginVertical: 22 }}>
          <OrnamentDivider />
        </View>

        {/* Stamp-style Yes / No */}
        <Row gap={12} style={{ marginBottom: 28 }}>
          <Pressable
            onPress={() => selectChoice('yes')}
            style={[styles.stamp, {
              borderColor: choice === 'yes' ? c.forest : c.rule,
              backgroundColor: choice === 'yes' ? `${c.forest}10` : c.bgCard,
              flex: 1,
            }]}
          >
            <View style={[styles.stampInner, { borderColor: choice === 'yes' ? c.forest : c.ruleSoft }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 9, color: choice === 'yes' ? c.forest : c.inkMuted, letterSpacing: 2, textTransform: 'uppercase' }}>
                Approved
              </Text>
              <Text style={{ fontFamily: f.serifI, fontSize: 26, color: choice === 'yes' ? c.forest : c.ink, marginTop: 4 }}>
                Yes
              </Text>
            </View>
          </Pressable>

          <Pressable
            onPress={() => selectChoice('no')}
            style={[styles.stamp, {
              borderColor: choice === 'no' ? c.wax : c.rule,
              backgroundColor: choice === 'no' ? `${c.wax}10` : c.bgCard,
              flex: 1,
            }]}
          >
            <View style={[styles.stampInner, { borderColor: choice === 'no' ? c.wax : c.ruleSoft }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 9, color: choice === 'no' ? c.wax : c.inkMuted, letterSpacing: 2, textTransform: 'uppercase' }}>
                Declined
              </Text>
              <Text style={{ fontFamily: f.serifI, fontSize: 26, color: choice === 'no' ? c.wax : c.ink, marginTop: 4 }}>
                Not this time
              </Text>
            </View>
          </Pressable>
        </Row>

        {/* Full-screen paper note input */}
        <View style={{ marginBottom: 8 }}>
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <MonoLabel>A note to Romeo · optional</MonoLabel>
          </Row>
          <TextInput
            value={note}
            onChangeText={t => setNote(t.slice(0, MAX_NOTE))}
            placeholder="Write freely..."
            placeholderTextColor={c.inkMuted as string}
            multiline
            style={[styles.noteInput, {
              backgroundColor: c.bg,
              color: c.ink,
              fontFamily: f.script,
              fontSize: 18,
              lineHeight: 28,
            }]}
            textAlignVertical="top"
          />
          <Text style={{
            textAlign: 'right',
            fontFamily: f.mono,
            fontSize: 9,
            letterSpacing: 2,
            color: c.inkMuted,
            textTransform: 'uppercase',
            marginTop: 6,
          }}>
            {note.length} / {MAX_NOTE}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Seal & Send button */}
      <View style={[styles.footer, {
        backgroundColor: c.bg,
        borderTopColor: c.rule,
        paddingBottom: insets.bottom + 12,
      }]}>
        <Pressable
          onPress={send}
          disabled={busy}
          style={[styles.sendBtn, { backgroundColor: busy ? c.bgSunken : c.ink }]}
        >
          <Row gap={12} style={{ alignItems: 'center' }}>
            <Animated.View style={sealAnim}>
              <WaxSeal size={28} />
            </Animated.View>
            <Text style={{
              fontFamily: f.mono,
              fontSize: 10,
              letterSpacing: 2.5,
              color: c.bg,
              textTransform: 'uppercase',
            }}>
              {busy ? 'Sending…' : 'Seal & Send'}
            </Text>
          </Row>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: {
    borderWidth: 2,
    padding: 3,
    alignItems: 'center',
  },
  stampInner: {
    width: '100%',
    borderWidth: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  noteInput: {
    minHeight: 200,
    padding: 0,
    borderWidth: 0,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sendBtn: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
