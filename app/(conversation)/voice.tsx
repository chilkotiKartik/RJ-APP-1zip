// RJ-APP/app/(conversation)/voice.tsx
// Native ElevenLabs voice conversation with Juliet.
// Uses @elevenlabs/react-native v1.2.3 ConversationProvider + useConversation.
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing as RNEasing, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ConversationProvider,
  useConversation,
  type ConversationStatus,
} from '@elevenlabs/react-native';
import { useRJTheme } from '@/theme/useRJTheme';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { MicCircle, MicState } from '@/components/voice/MicCircle';
import { JulietAvatarImg } from '@/components/voice/JulietAvatarImg';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { TextLink } from '@/components/primitives/Button';

const AGENT_ID = process.env.EXPO_PUBLIC_ELEVENLABS_AGENT_ID ?? '';

const IDLE_PROMPTS = [
  'She is waiting to hear from you.',
  'Take your time. She will be here.',
  'No script required.',
  'Say whatever comes to mind.',
];

// ── Inner screen — must be inside ConversationProvider ───────────────────────

function VoiceInner() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const promptIndex = useRef(Math.floor(Math.random() * IDLE_PROMPTS.length));
  const didEnd = useRef(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(8)).current;

  const showTranscript = useCallback((text: string) => {
    setTranscript(text);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true, easing: RNEasing.out(RNEasing.cubic) }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const hideTranscript = useCallback(() => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setTranscript('');
      slideAnim.setValue(8);
    });
  }, [fadeAnim, slideAnim]);

  const { startSession, endSession, status, isSpeaking } = useConversation({
    agentId: AGENT_ID,
    onConnect: () => {
      timerRef.current = setInterval(() => setDuration(s => s + 1), 1000);
    },
    onDisconnect: () => {
      if (timerRef.current) clearInterval(timerRef.current);
      hideTranscript();
      if (!didEnd.current) {
        didEnd.current = true;
        setTimeout(() => {
          router.replace('/(conversation)/archetype' as never);
        }, 800);
      }
    },
    onMessage: ({ message, role }: { message: string; role: string }) => {
      if (role === 'agent' && message) showTranscript(message);
    },
    onError: (errMessage: string) => {
      console.warn('ElevenLabs error:', errMessage);
      if (timerRef.current) clearInterval(timerRef.current);
      // Prevent onDisconnect from navigating away after an error —
      // we stay on this screen so the user can try again.
      didEnd.current = true;
      Alert.alert('The connection dropped', "Juliet couldn't connect just now. Please try again.", [
        { text: 'OK', onPress: () => { didEnd.current = false; } },
      ]);
    },
  });

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const micState: MicState =
    status === 'connecting' ? 'connecting' :
    status === 'connected' ? 'connected' :
    'idle';

  const onMicPress = async () => {
    if (status === 'disconnected' || status === 'error') {
      if (!AGENT_ID) { Alert.alert('Not configured', 'ElevenLabs agent ID is missing.'); return; }
      setDuration(0);
      try {
        await startSession({ agentId: AGENT_ID });
      } catch (e) {
        Alert.alert('Could not connect', 'Please check your internet connection and try again.');
      }
    } else if (status === 'connected') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      try {
        didEnd.current = true;
        await endSession();
        setTimeout(() => router.replace('/(conversation)/archetype' as never), 800);
      } catch {
        router.replace('/(conversation)/archetype' as never);
      }
    }
  };

  const skip = () => {
    router.replace('/(conversation)/questionnaire' as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <PaperNoise />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16, paddingHorizontal: d.pad }]}>
        <MonoLabel size={8}>Step 3 of 4</MonoLabel>
        <MonoLabel size={8} color={c.gold}>
          {status === 'connected' ? formatDuration(duration) : 'Your conversation'}
        </MonoLabel>
      </View>

      {/* Title */}
      <View style={{ paddingHorizontal: d.pad, marginTop: 10 }}>
        <Text style={[styles.title, { fontFamily: f.serifI, color: c.ink }]}>
          {status === 'disconnected' || status === 'error'
            ? 'Juliet is\nlistening.'
            : status === 'connecting'
              ? 'Connecting\nto Juliet…'
              : isSpeaking ? 'Juliet\nspeaks.' : 'Speak\nfreely.'}
        </Text>
      </View>

      <View style={{ paddingHorizontal: d.pad, marginTop: 4 }}>
        <OrnamentDivider width={40} />
      </View>

      {/* Avatar + transcript area */}
      <View style={styles.avatarArea}>
        <View style={[styles.portraitRing, {
          borderColor: status === 'connected' ? (isSpeaking ? c.gold : c.forest) : c.rule,
        }]}>
          <JulietAvatarImg size={110} style={styles.portrait} />
        </View>

        {transcript ? (
          <Animated.View style={[
            styles.bubble,
            {
              backgroundColor: c.bgCard,
              borderColor: c.rule,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}>
            <Text style={[styles.bubbleText, { fontFamily: f.serifI, color: c.ink }]}>
              &ldquo;{transcript}&rdquo;
            </Text>
          </Animated.View>
        ) : (
          <View style={[styles.bubble, { borderColor: 'transparent' }]}>
            <Text style={[styles.idleText, { fontFamily: f.bodyI, color: c.inkMuted }]}>
              {status === 'disconnected' || status === 'error'
                ? IDLE_PROMPTS[promptIndex.current]
                : status === 'connecting'
                  ? 'Reaching Juliet…'
                  : 'She\'s hearing you.'}
            </Text>
          </View>
        )}
      </View>

      {/* Mic area */}
      <View style={styles.micArea}>
        <MicCircle state={micState} onPress={onMicPress} size={100} />
        <MonoLabel
          size={8}
          color={status === 'connected' ? c.forest : c.inkMuted}
          style={{ marginTop: 12 }}
        >
          {status === 'disconnected' || status === 'error'
            ? 'Tap to begin'
            : status === 'connecting'
              ? 'One moment…'
              : 'Tap to finish'}
        </MonoLabel>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, paddingHorizontal: d.pad }]}>
        {(status === 'disconnected' || status === 'error') && (
          <TextLink onPress={skip} color={c.inkMuted}>
            Skip · go to questionnaire
          </TextLink>
        )}
        {status === 'connected' && (
          <TextLink onPress={onMicPress} color={c.inkMuted}>
            End conversation
          </TextLink>
        )}
      </View>
    </View>
  );
}

// ── Exported default — wraps inner screen with provider ──────────────────────

export default function Voice() {
  return (
    <ConversationProvider>
      <VoiceInner />
    </ConversationProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 38, lineHeight: 42 },
  avatarArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22, paddingHorizontal: 24,
  },
  portraitRing: {
    width: 126, height: 126, borderRadius: 63, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.18, shadowOffset: { width: 0, height: 8 }, shadowRadius: 20, elevation: 6,
  },
  portrait: { borderRadius: 55 },
  bubble: {
    maxWidth: 300, padding: 16, borderWidth: 1, minHeight: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  bubbleText: { fontSize: 17, lineHeight: 25, textAlign: 'center' },
  idleText: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  micArea: { alignItems: 'center', paddingBottom: 8 },
  footer: { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
});
