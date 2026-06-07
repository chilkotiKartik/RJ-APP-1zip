// RJ-APP/app/(main)/settings.tsx
import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import * as Haptics from 'expo-haptics';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PaperHeader } from '@/components/primitives/PaperHeader';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack, IconArrow } from '@/components/primitives/Icons';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { useStatus } from '@/lib/hooks';
import { usePreferences } from '@/theme/preferences';
import { supabase } from '@/lib/supabase';
import { ARCHETYPES, ArchetypeId } from '@/lib/archetypes';
import { isBiometricAvailable } from '@/lib/biometric';
import type { DensityKey } from '@/theme/tokens';

const APP_STORE_URL = 'https://apps.apple.com/app/romeo-juliet/id0000000000';

function memberNoFromUserId(userId: string | null): string {
  if (!userId) return '0000';
  let sum = 0;
  for (let i = 0; i < userId.length; i++) sum = (sum + userId.charCodeAt(i) * 7) % 99991;
  return String(sum % 9999).padStart(4, '0');
}

function referralCodeFromName(name: string | null): string {
  const base = (name ?? 'GUEST').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 9);
  let sum = 0;
  for (let i = 0; i < base.length; i++) sum = (sum + base.charCodeAt(i) * 3) % 97;
  return `${base || 'GUEST'}-${String(sum).padStart(2, '0')}`;
}

function SettingsToggle({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) {
  const { c, f } = useRJTheme();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: 12, borderTopWidth: 1, borderTopColor: c.ruleSoft,
    }}>
      <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={v => { Haptics.selectionAsync(); onValueChange(v); }}
        trackColor={{ false: c.ruleSoft, true: c.gold }}
        thumbColor={value ? c.goldLight : c.bg}
      />
    </View>
  );
}

function SettingsRow({ label, value, danger, onPress }: {
  label: string; value?: string; danger?: boolean; onPress?: () => void;
}) {
  const { c, f } = useRJTheme();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.ruleSoft,
      }}
    >
      <Text style={{ fontFamily: f.serif, fontSize: 16, color: danger ? c.wax : c.ink }}>{label}</Text>
      {value ? (
        <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>{value}</Text>
      ) : onPress ? (
        <IconArrow color={danger ? c.wax : c.inkMuted} size={14} />
      ) : null}
    </Pressable>
  );
}

export default function Settings() {
  const { c, f, d } = useRJTheme();
  const { profile, userId } = useStatus(0);
  const { prefs, update } = usePreferences();
  const [email, setEmail] = useState<string | null>(null);
  const [densityOpen, setDensityOpen] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Notification prefs — persisted via usePreferences
  const notifLetter = prefs.notifLetter;
  const notifMatch  = prefs.notifMatch;

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    }).catch(() => {});
    isBiometricAvailable().then(v => { if (!cancelled) setBiometricAvailable(v); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const archetype = profile?.archetype && profile.archetype in ARCHETYPES
    ? ARCHETYPES[profile.archetype as ArchetypeId]
    : null;

  const onSignOut = async () => {
    try { await supabase.auth.signOut(); } catch { /* best-effort */ }
    router.replace('/');
  };

  const onDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account, profile, and all correspondence. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                await supabase.from('profiles').delete().eq('user_id', user.id);
                await supabase.auth.signOut();
              }
            } catch { /* best-effort */ }
            router.replace('/');
          },
        },
      ],
    );
  };

  const truncatedEmail = email
    ? (email.length > 20 ? `${email.slice(0, 8)}…` : email)
    : '—';

  const version = (Constants.expoConfig?.version as string | undefined) ?? '1.0';

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={
          <IconBtn onPress={() => safeBack('/(main)/home')} testID="settings-back-btn">
            <IconBack />
          </IconBtn>
        }
        center="Settings"
        sub="Your account"
      />
      <ScreenScroll>
        <PaperNoise />
        <View style={{ padding: d.pad, paddingBottom: 32 }}>
          {archetype && (
            <View style={{
              flexDirection: 'row', gap: 14, alignItems: 'center', padding: 14,
              borderWidth: 1, borderColor: c.rule, marginBottom: 22, backgroundColor: c.bgCard,
            }}>
              <ArchetypeStamp archetype={archetype} height={70} color={c.gold} />
              <Stack gap={2}>
                <MonoLabel size={7.5} color={c.gold}>Juliet sees you as</MonoLabel>
                <Text style={{ fontFamily: f.serifI, fontSize: 22, color: c.forest, lineHeight: 22, marginTop: 4 }}>
                  {archetype.name}
                </Text>
                <Text style={{
                  fontFamily: f.mono, fontSize: 7.5, letterSpacing: 7.5 * 0.22,
                  color: c.inkMuted, textTransform: 'uppercase', marginTop: 6,
                }}>
                  {profile?.first_name ?? 'Friend'} · Member no. {memberNoFromUserId(userId)}
                </Text>
              </Stack>
            </View>
          )}

          {/* Display */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>Display</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <SettingsToggle label="Dark mode" value={prefs.dark} onValueChange={v => update({ dark: v })} />
              <Pressable
                testID="settings-density-row"
                onPress={() => { Haptics.selectionAsync(); setDensityOpen(o => !o); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.ruleSoft,
                  borderBottomWidth: densityOpen ? 0 : 1, borderBottomColor: c.ruleSoft,
                }}
              >
                <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>Density</Text>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>
                  {prefs.density.charAt(0).toUpperCase() + prefs.density.slice(1)}
                </Text>
              </Pressable>
              {densityOpen && (
                <Row gap={8} style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: c.ruleSoft }}>
                  {(['compact', 'comfortable', 'spacious'] as DensityKey[]).map(k => {
                    const active = prefs.density === k;
                    return (
                      <Pressable
                        key={k}
                        testID={`settings-density-${k}`}
                        onPress={() => { Haptics.selectionAsync(); update({ density: k }); setDensityOpen(false); }}
                        style={{
                          flex: 1, borderWidth: 1, borderColor: active ? c.gold : c.rule,
                          paddingVertical: 10, alignItems: 'center',
                          backgroundColor: active ? c.bgCard : 'transparent',
                        }}
                      >
                        <Text style={{
                          fontFamily: f.mono, fontSize: 9, letterSpacing: 9 * 0.22,
                          color: active ? c.forest : c.inkMuted, textTransform: 'uppercase',
                        }}>{k}</Text>
                      </Pressable>
                    );
                  })}
                </Row>
              )}
            </View>
          </View>

          {/* Notifications */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>Notifications</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <SettingsToggle label="Letter arrived" value={notifLetter} onValueChange={v => update({ notifLetter: v })} />
              <SettingsToggle label="New match found" value={notifMatch} onValueChange={v => update({ notifMatch: v })} />
            </View>
          </View>

          {/* Privacy */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>Privacy</MonoLabel>
            <View style={{ marginTop: 6 }}>
              {biometricAvailable && (
                <SettingsToggle
                  label="Require Face ID / Fingerprint"
                  value={prefs.biometric ?? false}
                  onValueChange={v => update({ biometric: v })}
                />
              )}
              <SettingsRow label="Who can see your photographs" value="Romeo only" />
              <SettingsRow label="Download my data" onPress={() => {}} />
            </View>
          </View>

          {/* You */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>You</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <SettingsRow label="Name" value={profile?.first_name ?? '—'} />
              <SettingsRow label="Email" value={truncatedEmail} />
              <SettingsRow label="Your archetype" value={archetype?.name ?? '—'} />
              <SettingsRow label="Your referral code" value={referralCodeFromName(profile?.first_name ?? null)} />
              <SettingsRow label="Edit your photographs" onPress={() => router.push('/(onboarding)/profile' as never)} />
            </View>
          </View>

          {/* Account */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>Account</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <SettingsRow label="Sign out" onPress={onSignOut} />
              <SettingsRow label="Delete Account" danger onPress={onDeleteAccount} />
            </View>
          </View>

          {/* App */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>App</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <SettingsRow label="Version" value={`v${version}`} />
              <SettingsRow label="Rate on App Store" onPress={() => WebBrowser.openBrowserAsync(APP_STORE_URL)} />
            </View>
          </View>

          <Text style={{
            marginTop: 12, textAlign: 'center', fontFamily: f.mono, fontSize: 8,
            letterSpacing: 8 * 0.22, color: c.inkMuted, textTransform: 'uppercase',
          }}>
            Romeo &amp; Juliet · v{version} · Est. 2026
          </Text>
        </View>
      </ScreenScroll>
    </View>
  );
}
