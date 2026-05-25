// RJ-APP/app/(auth)/signin.tsx
import { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { signInWithGoogle } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Mode = 'signin' | 'signup';

export default function SignIn() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const onGoogle = async () => {
    setBusy(true);
    setInfo(null);
    const r = await signInWithGoogle();
    setBusy(false);
    if (!r.ok) {
      if (r.error !== 'Cancelled') Alert.alert("Sign in didn't complete", r.error ?? 'Try again');
      return;
    }
    router.replace('/' as never);
  };

  const onEmail = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check your details', 'Email and a password of at least 6 characters.');
      return;
    }
    setBusy(true);
    setInfo(null);

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (error) {
        Alert.alert('Could not apply', error.message);
        return;
      }
      if (data.session) {
        router.replace('/' as never);
      } else {
        // Email confirmation required.
        setInfo('A note has been sent to your inbox. Open it to confirm.');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setBusy(false);
      if (error) {
        Alert.alert('Could not sign in', error.message);
        return;
      }
      router.replace('/' as never);
    }
  };

  const isSignUp = mode === 'signup';

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>{isSignUp ? 'Application' : 'Return correspondent'}</MonoLabel>
        </Row>

        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <JulietPortrait width={120} height={150} rotate={-3} label="Juliet, no. 02" />
        </View>

        <View style={{ marginTop: 36, alignItems: 'center' }}>
          <Text style={{
            fontFamily: f.serif, fontSize: 30, color: c.ink,
            textAlign: 'center', maxWidth: 320, lineHeight: 36,
          }}>
            {isSignUp ? (
              <>Begin <Text style={{ fontStyle: 'italic', color: c.forest }}>your conversation.</Text></>
            ) : (
              <>Welcome <Text style={{ fontStyle: 'italic', color: c.forest }}>back.</Text></>
            )}
          </Text>
          <Text style={{
            fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted,
            textAlign: 'center', maxWidth: 300, marginTop: 12, lineHeight: 22,
          }}>
            {isSignUp
              ? 'A short introduction. Your name, your photographs, a few honest words. Juliet will listen.'
              : 'Sign in to continue your conversation. Juliet is ready when you are.'}
          </Text>
        </View>

        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <PrimaryButton onPress={onGoogle}>
            {busy ? 'Opening…' : 'Continue with Google'}
          </PrimaryButton>
        </View>

        <Row gap={10} style={{ marginVertical: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
          <MonoLabel size={7.5} color={c.inkMuted}>or by post</MonoLabel>
          <View style={{ flex: 1, height: 1, backgroundColor: c.rule }} />
        </Row>

        <Stack gap={14}>
          <View>
            <MonoLabel size={8}>Your email</MonoLabel>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@somewhere.com"
              placeholderTextColor={c.inkMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="emailAddress"
              style={[styles.input, {
                borderBottomColor: c.rule,
                color: c.ink,
                fontFamily: f.serif,
              }]}
            />
          </View>
          <View>
            <MonoLabel size={8}>Your password</MonoLabel>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={c.inkMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              textContentType={isSignUp ? 'newPassword' : 'password'}
              style={[styles.input, {
                borderBottomColor: c.rule,
                color: c.ink,
                fontFamily: f.serif,
                letterSpacing: 4,
              }]}
            />
          </View>

          {info && (
            <View style={{
              padding: 12,
              borderLeftWidth: 2,
              borderLeftColor: c.gold,
              backgroundColor: 'rgba(184,151,102,0.08)',
            }}>
              <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.ink, lineHeight: 20 }}>
                {info}
              </Text>
            </View>
          )}

          <PrimaryButton onPress={onEmail}>
            {busy ? 'One moment…' : isSignUp ? 'Send my application' : 'Continue'}
          </PrimaryButton>
        </Stack>

        <View style={{
          marginTop: 28, paddingTop: 16,
          borderTopWidth: 1, borderTopColor: c.ruleSoft, borderStyle: 'dashed',
          alignItems: 'center',
        }}>
          <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.ink, opacity: 0.85 }}>
            {isSignUp ? 'Already a correspondent? ' : 'New to Juliet? '}
            <Text
              onPress={() => { setMode(isSignUp ? 'signin' : 'signup'); setInfo(null); }}
              style={{ color: c.forest, textDecorationLine: 'underline' }}
            >
              {isSignUp ? 'Sign in here' : 'Apply for access'}
            </Text>
          </Text>
        </View>

        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <TextLink onPress={() => router.push('/(auth)/referral' as never)}>I have a referral code</TextLink>
        </View>
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    fontSize: 22,
    paddingVertical: 8,
    marginTop: 6,
  },
});
