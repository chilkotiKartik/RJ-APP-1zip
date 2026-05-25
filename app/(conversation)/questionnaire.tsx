import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { TextLink, PrimaryButton } from '@/components/primitives/Button';
import { JulietAvatarImg } from '@/components/voice/JulietAvatarImg';
import { supabase } from '@/lib/supabase';

type Q =
  | { id: string; section: string; prompt: string; type: 'text'; placeholder?: string }
  | { id: string; section: string; prompt: string; type: 'pills'; options: string[] };

const QUESTIONS: Q[] = [
  { id: 'dob',         section: 'Basic',        prompt: 'When were you born?',                type: 'text', placeholder: '01 / 01 / 1996' },
  { id: 'city',        section: 'Basic',        prompt: 'And which city do you keep these days?', type: 'text', placeholder: 'London' },
  { id: 'work',        section: 'Basic',        prompt: 'What occupies your hours?',           type: 'text', placeholder: 'Architect, writer, etc.' },
  { id: 'relstatus',   section: 'Relationship', prompt: 'How would you describe yourself just now?', type: 'pills', options: ['Single', 'Dating gently', 'Recently unattached', 'Other'] },
  { id: 'looking',     section: 'Relationship', prompt: 'And what are you looking for?',       type: 'pills', options: ['Something serious', 'A slow burn', 'Open to anything', 'Marriage eventually'] },
  { id: 'children',    section: 'Family',       prompt: 'Children — do you imagine them?',    type: 'pills', options: ['Yes', 'No', 'One day, perhaps'] },
  { id: 'parents',     section: 'Family',       prompt: 'Tell her about your parents in a sentence.', type: 'text', placeholder: 'Two architects, still together…' },
];

type Msg = { role: 'juliet' | 'user'; text: string };

export default function Questionnaire() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [idx, setIdx] = useState(0);
  const [typing, setTyping] = useState(true);
  const [input, setInput] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const cur = QUESTIONS[idx];
  const done = idx >= QUESTIONS.length;

  // When advancing, simulate Juliet typing then post her message
  useEffect(() => {
    if (done) return;
    setTyping(true);
    const t = setTimeout(() => {
      setMsgs(m => [...m, { role: 'juliet', text: cur.prompt }]);
      setTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 900);
    return () => clearTimeout(t);
  }, [idx, done]);

  const answer = (value: string) => {
    if (!value.trim()) return;
    setMsgs(m => [...m, { role: 'user', text: value.trim() }]);
    setAnswers(a => ({ ...a, [cur.id]: value.trim() }));
    setInput('');
    setIdx(i => i + 1);
  };

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ questionnaire_answers: answers, phase: 'QUESTIONNAIRE_DONE' })
        .eq('user_id', user.id);
    }
    router.replace('/(conversation)/archetype' as never);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={20}>
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
        <PaperNoise />
        <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>{cur?.section ?? 'Done'}</MonoLabel>
        </Row>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: d.pad, paddingBottom: 20, gap: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {msgs.map((m, i) => m.role === 'juliet' ? (
            <View key={i} style={styles.julietRow}>
              <JulietAvatarImg size={28} />
              <View style={[styles.julietBubble, { backgroundColor: c.bgSunken, borderColor: c.rule }]}>
                <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.ink, lineHeight: 25 }}>{m.text}</Text>
              </View>
            </View>
          ) : (
            <View key={i} style={[styles.userBubble, { backgroundColor: c.forest }]}>
              <Text style={{ fontFamily: f.serif, fontSize: 18, color: c.bg, lineHeight: 25 }}>{m.text}</Text>
            </View>
          ))}
          {typing && !done && (
            <View style={styles.julietRow}>
              <JulietAvatarImg size={28} />
              <View style={[styles.julietBubble, { backgroundColor: c.bgSunken, borderColor: c.rule, paddingVertical: 14 }]}>
                <Text style={{ fontFamily: f.mono, fontSize: 18, color: c.inkMuted, letterSpacing: 4 }}>· · ·</Text>
              </View>
            </View>
          )}
          {done && (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <PrimaryButton onPress={submit}>Send to Juliet</PrimaryButton>
            </View>
          )}
        </ScrollView>

        {!done && !typing && (
          <View style={[styles.composer, { borderTopColor: c.rule, backgroundColor: c.bg, paddingBottom: insets.bottom + 12, paddingTop: 10 }]}>
            {cur.type === 'pills' ? (
              <View style={styles.pillRow}>
                {cur.options.map(opt => (
                  <Pressable key={opt} onPress={() => answer(opt)} style={[styles.pill, { borderColor: c.forest }]}>
                    <Text style={{ fontFamily: f.mono, fontSize: 12, color: c.forest, letterSpacing: 1.5, textTransform: 'uppercase' }}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Row gap={10} style={{ paddingHorizontal: d.pad }}>
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder={cur.placeholder}
                  placeholderTextColor={c.inkMuted as string}
                  onSubmitEditing={() => answer(input)}
                  returnKeyType="send"
                  style={[styles.input, { borderColor: c.rule, color: c.ink, fontFamily: f.serif }]}
                />
                <Pressable onPress={() => answer(input)} style={[styles.send, { backgroundColor: c.indigo }]}>
                  <Text style={{ color: c.bg, fontFamily: f.mono, fontSize: 11, letterSpacing: 2 }}>SEND</Text>
                </Pressable>
              </Row>
            )}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  julietRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '88%' },
  julietBubble: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, flex: 1 },
  userBubble: { paddingHorizontal: 14, paddingVertical: 10, alignSelf: 'flex-end', maxWidth: '80%' },
  composer: { borderTopWidth: 1 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16 },
  pill: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  input: { flex: 1, borderWidth: 1, padding: 12, fontSize: 18 },
  send: { paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
});
