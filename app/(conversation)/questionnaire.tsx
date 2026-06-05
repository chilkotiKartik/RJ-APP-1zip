// RJ-APP/app/(conversation)/questionnaire.tsx
// Native multi-step questionnaire — replaces the old WebView delegate.
// After submission, shows the "Romeo is reading" waiting state.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Animated, Easing as RNEasing, Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { QUESTIONS, Question } from '@/lib/questionnaire';
import { supabase } from '@/lib/supabase';
import { useStatus } from '@/lib/hooks';

// ─── Waiting screen ────────────────────────────────────────────────────────

function WaitingScreen() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase } = useStatus(10000);

  useEffect(() => {
    if (phase === 'LETTER_READY') {
      router.replace('/(letter)/envelope' as never);
    }
  }, [phase]);

  return (
    <View style={[styles.waitRoot, { backgroundColor: c.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <PaperNoise />
      <View style={styles.waitCenter}>
        <MonoLabel>Romeo is reading</MonoLabel>

        <View style={{ marginTop: 28, marginBottom: 28 }}>
          <JulietPortrait width={180} height={220} rotate={-2} label="Juliet, no. 02" />
        </View>

        <Text style={[styles.waitTitle, { fontFamily: f.serif, color: c.ink }]}>
          She&rsquo;s passed your letter{'\n'}
          <Text style={{ fontStyle: 'italic', color: c.forest }}>to Romeo now.</Text>
        </Text>

        <View style={{ marginTop: 20, marginBottom: 20 }}>
          <OrnamentDivider />
        </View>

        <Text style={[styles.waitBody, { fontFamily: f.bodyI, color: c.inkMuted }]}>
          Romeo reads at his own pace. Your envelope will arrive when it arrives — usually within a few days.
        </Text>
      </View>
    </View>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────

function ProgressBar({ current, total }: { current: number; total: number }) {
  const { c } = useRJTheme();
  const pct = ((current + 1) / total) * 100;
  return (
    <View style={[styles.progressTrack, { backgroundColor: c.ruleSoft }]}>
      <View style={[styles.progressFill, { backgroundColor: c.gold, width: `${pct}%` as any }]} />
    </View>
  );
}

// ─── Choice question ───────────────────────────────────────────────────────

function ChoiceQuestion({
  question, value, onChange,
}: { question: Question; value: string; onChange: (v: string) => void }) {
  const { c, f } = useRJTheme();
  return (
    <View style={styles.choiceGrid}>
      {question.choices!.map((choice, i) => {
        const selected = value === choice;
        return (
          <Pressable
            key={i}
            onPress={() => { Haptics.selectionAsync(); onChange(choice); }}
            style={[
              styles.choiceBtn,
              {
                borderColor: selected ? c.forest : c.rule,
                backgroundColor: selected ? `${c.forest}15` : c.bgCard,
              },
            ]}
          >
            <Text style={[
              styles.choiceText,
              { fontFamily: f.body, color: selected ? c.forest : c.ink },
            ]}>
              {choice}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Text question ─────────────────────────────────────────────────────────

function TextQuestion({
  question, value, onChange,
}: { question: Question; value: string; onChange: (v: string) => void }) {
  const { c, f } = useRJTheme();
  return (
    <TextInput
      value={value}
      onChangeText={onChange}
      placeholder={question.placeholder ?? 'Your answer…'}
      placeholderTextColor={c.inkMuted as string}
      multiline
      autoCorrect
      style={[styles.textArea, {
        borderColor: c.rule,
        backgroundColor: c.bgCard,
        color: c.ink,
        fontFamily: f.serif,
      }]}
      textAlignVertical="top"
    />
  );
}

// ─── Main questionnaire ────────────────────────────────────────────────────

export default function Questionnaire() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useStatus(0);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // If profile already has questionnaire answers → skip to waiting
  useEffect(() => {
    if (profile?.questionnaire_answers && Object.keys(profile.questionnaire_answers).length > 0) {
      setDone(true);
    }
  }, [profile]);

  // Slide animation between steps
  const slideX = useRef(new Animated.Value(0)).current;
  const fadeQ = useRef(new Animated.Value(1)).current;

  const animateToNext = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: -30, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeQ, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideX.setValue(30);
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true, easing: RNEasing.out(RNEasing.cubic) }),
        Animated.timing(fadeQ, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }, [slideX, fadeQ]);

  const animateToPrev = useCallback((cb: () => void) => {
    Animated.parallel([
      Animated.timing(slideX, { toValue: 30, duration: 180, useNativeDriver: true }),
      Animated.timing(fadeQ, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideX.setValue(-30);
      Animated.parallel([
        Animated.timing(slideX, { toValue: 0, duration: 220, useNativeDriver: true, easing: RNEasing.out(RNEasing.cubic) }),
        Animated.timing(fadeQ, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  }, [slideX, fadeQ]);

  const currentQ = QUESTIONS[step];
  const currentAnswer = answers[currentQ?.id] ?? '';
  const isLast = step === QUESTIONS.length - 1;
  const canAdvance = currentQ?.type === 'text'
    ? (currentQ.id === 'romeo_note' || currentAnswer.trim().length > 0)
    : currentAnswer.length > 0;

  const goNext = () => {
    if (!canAdvance && currentQ.id !== 'romeo_note') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    if (isLast) {
      submit();
      return;
    }
    Haptics.selectionAsync();
    animateToNext(() => setStep(s => s + 1));
  };

  const goPrev = () => {
    if (step === 0) return;
    Haptics.selectionAsync();
    animateToPrev(() => setStep(s => s - 1));
  };

  const setAnswer = (val: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: val }));
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Build payload
        const payload: Record<string, string> = {};
        QUESTIONS.forEach(q => {
          if (answers[q.id]) payload[q.id] = answers[q.id];
        });

        // Save answers and advance phase
        await supabase.from('profiles').update({
          questionnaire_answers: payload,
          phase: 'WAITING',
        }).eq('user_id', user.id);
      }
    } catch (e) {
      console.warn('Questionnaire save error:', e);
    } finally {
      setSubmitting(false);
      setDone(true);
    }
  };

  if (done) return <WaitingScreen />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <PaperNoise />

      {/* Header */}
      <View style={[styles.qHeader, { paddingTop: insets.top + 12, paddingHorizontal: d.pad }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <MonoLabel size={8}>Step 4 of 4</MonoLabel>
          <MonoLabel size={8} color={c.inkMuted}>
            {step + 1} of {QUESTIONS.length}
          </MonoLabel>
        </View>
        <View style={{ marginTop: 10 }}>
          <ProgressBar current={step} total={QUESTIONS.length} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: d.pad, paddingBottom: 20 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{
          opacity: fadeQ,
          transform: [{ translateX: slideX }],
        }}>
          {/* Question prompt */}
          <View style={styles.promptArea}>
            <MonoLabel size={7.5} color={c.gold}>Juliet asks</MonoLabel>
            <Text style={[styles.promptText, { fontFamily: f.serif, color: c.ink }]}>
              {currentQ.prompt}
            </Text>
            {currentQ.sub && (
              <Text style={[styles.subText, { fontFamily: f.bodyI, color: c.inkMuted }]}>
                {currentQ.sub}
              </Text>
            )}
          </View>

          <View style={{ marginVertical: 18 }}>
            <OrnamentDivider width={50} />
          </View>

          {/* Answer input */}
          {currentQ.type === 'choice' ? (
            <ChoiceQuestion question={currentQ} value={currentAnswer} onChange={setAnswer} />
          ) : (
            <TextQuestion question={currentQ} value={currentAnswer} onChange={setAnswer} />
          )}
        </Animated.View>
      </ScrollView>

      {/* Footer nav */}
      <View style={[styles.qFooter, {
        paddingHorizontal: d.pad,
        paddingBottom: insets.bottom + 16,
        borderTopColor: c.ruleSoft,
      }]}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
          {step > 0 && (
            <Pressable onPress={goPrev} style={[styles.backBtn, { borderColor: c.rule }]}>
              <Text style={{ fontFamily: f.mono, fontSize: 10, letterSpacing: 2, color: c.inkMuted, textTransform: 'uppercase' }}>
                ←
              </Text>
            </Pressable>
          )}
          <View style={{ flex: 1 }}>
            <PrimaryButton onPress={goNext}>
              {submitting ? 'Sending…' : isLast ? 'Send to Romeo' : 'Continue'}
            </PrimaryButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  waitRoot: { flex: 1 },
  waitCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  waitTitle: { fontSize: 32, lineHeight: 40, textAlign: 'center', maxWidth: 320 },
  waitBody: { fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 300 },

  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: 2, borderRadius: 1 },

  qHeader: { paddingBottom: 4 },
  promptArea: { gap: 10, marginTop: 8 },
  promptText: { fontSize: 30, lineHeight: 36 },
  subText: { fontSize: 15, lineHeight: 22 },

  choiceGrid: { gap: 10 },
  choiceBtn: {
    borderWidth: 1,
    padding: 16,
  },
  choiceText: { fontSize: 16, lineHeight: 22 },

  textArea: {
    borderWidth: 1,
    padding: 16,
    fontSize: 19,
    lineHeight: 28,
    minHeight: 140,
  },

  qFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    borderWidth: 1,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
