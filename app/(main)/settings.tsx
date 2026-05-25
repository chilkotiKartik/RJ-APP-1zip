// RJ-APP/app/(main)/settings.tsx
import { useEffect, useState } from 'react';
import { View, Text, Switch, Pressable } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
import type { DensityKey } from '@/theme/tokens';

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

type RowItem = { k: string; v?: string; onPress?: () => void };

function SettingsRow({ item, isFirst, isLast }: { item: RowItem; isFirst: boolean; isLast: boolean }) {
  const { c, f } = useRJTheme();
  return (
    <Pressable
      onPress={() => { Haptics.selectionAsync(); item.onPress?.(); }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderTopWidth: isFirst ? 1 : 1,
        borderTopColor: c.ruleSoft,
        borderBottomWidth: isLast ? 1 : 0,
        borderBottomColor: c.ruleSoft,
      }}
    >
      <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>{item.k}</Text>
      {item.v ? (
        <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>{item.v}</Text>
      ) : (
        <IconArrow color={c.inkMuted} size={14} />
      )}
    </Pressable>
  );
}

export default function Settings() {
  const { c, f, d } = useRJTheme();
  const { profile, userId } = useStatus(0);
  const { prefs, update } = usePreferences();
  const [email, setEmail] = useState<string | null>(null);
  const [densityOpen, setDensityOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setEmail(data.user?.email ?? null);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const archetype = profile?.archetype && profile.archetype in ARCHETYPES
    ? ARCHETYPES[profile.archetype as ArchetypeId]
    : null;

  const onSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // best-effort; user wanted out
    }
    // Note: do NOT clear rj.theme.* keys — those are device-level prefs.
    router.replace('/');
  };

  const truncatedEmail = email
    ? (email.length > 20 ? `${email.slice(0, 8)}…` : email)
    : '—';

  const sections: { label: string; rows: RowItem[] }[] = [
    {
      label: 'You',
      rows: [
        { k: 'Name', v: profile?.first_name ?? '—' },
        { k: 'Email', v: truncatedEmail },
        { k: 'Your archetype', v: archetype?.name ?? '—' },
        { k: 'Edit your photographs' },
      ],
    },
    {
      label: 'Correspondence',
      rows: [
        { k: 'Pause introductions', v: 'Off' },
        { k: 'How often Romeo writes', v: 'When ready' },
        { k: 'Reading speed', v: 'Slow' },
      ],
    },
    {
      label: 'Privacy',
      rows: [
        { k: 'Who can see your photographs', v: 'Romeo only' },
        { k: 'Download my data' },
        { k: 'Remove me from the room' },
      ],
    },
    {
      label: 'The room',
      rows: [
        { k: 'Your referral code', v: referralCodeFromName(profile?.first_name ?? null) },
        { k: 'Notifications' },
        { k: 'Sign out', onPress: onSignOut },
      ],
    },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={
          <IconBtn onPress={() => router.back()} testID="settings-back-btn">
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
              flexDirection: 'row',
              gap: 14,
              alignItems: 'center',
              padding: 14,
              borderWidth: 1,
              borderColor: c.rule,
              marginBottom: 22,
              backgroundColor: c.bgCard,
            }}>
              <ArchetypeStamp archetype={archetype} height={70} color={c.gold} />
              <Stack gap={2}>
                <MonoLabel size={7.5} color={c.gold}>Juliet sees you as</MonoLabel>
                <Text style={{
                  fontFamily: f.serifI, fontSize: 22, color: c.forest,
                  lineHeight: 22, marginTop: 4,
                }}>
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

          {/* Display section */}
          <View style={{ marginBottom: 22 }}>
            <MonoLabel size={8} color={c.gold}>Display</MonoLabel>
            <View style={{ marginTop: 6 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingVertical: 10,
                borderTopWidth: 1,
                borderTopColor: c.ruleSoft,
              }}>
                <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>Dark mode</Text>
                <Switch
                  testID="settings-dark-toggle"
                  value={prefs.dark}
                  onValueChange={v => update({ dark: v })}
                  trackColor={{ false: c.ruleSoft, true: c.gold }}
                  thumbColor={prefs.dark ? c.goldLight : c.bg}
                />
              </View>
              <Pressable
                testID="settings-density-row"
                onPress={() => { Haptics.selectionAsync(); setDensityOpen(o => !o); }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 14,
                  borderTopWidth: 1,
                  borderTopColor: c.ruleSoft,
                  borderBottomWidth: densityOpen ? 0 : 1,
                  borderBottomColor: c.ruleSoft,
                }}
              >
                <Text style={{ fontFamily: f.serif, fontSize: 16, color: c.ink }}>Density</Text>
                <Text style={{ fontFamily: f.bodyI, fontSize: 14, color: c.inkMuted }}>
                  {prefs.density.charAt(0).toUpperCase() + prefs.density.slice(1)}
                </Text>
              </Pressable>
              {densityOpen && (
                <Row
                  gap={8}
                  style={{
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: c.ruleSoft,
                  }}
                >
                  {(['compact', 'comfortable', 'spacious'] as DensityKey[]).map(k => {
                    const active = prefs.density === k;
                    return (
                      <Pressable
                        key={k}
                        testID={`settings-density-${k}`}
                        onPress={() => {
                          Haptics.selectionAsync();
                          update({ density: k });
                          setDensityOpen(false);
                        }}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: active ? c.gold : c.rule,
                          paddingVertical: 10,
                          alignItems: 'center',
                          backgroundColor: active ? c.bgCard : 'transparent',
                        }}
                      >
                        <Text style={{
                          fontFamily: f.mono, fontSize: 9, letterSpacing: 9 * 0.22,
                          color: active ? c.forest : c.inkMuted, textTransform: 'uppercase',
                        }}>
                          {k}
                        </Text>
                      </Pressable>
                    );
                  })}
                </Row>
              )}
            </View>
          </View>

          {sections.map(sec => (
            <View key={sec.label} style={{ marginBottom: 22 }}>
              <MonoLabel size={8} color={c.gold}>{sec.label}</MonoLabel>
              <View style={{ marginTop: 6 }}>
                {sec.rows.map((r, i) => (
                  <SettingsRow
                    key={r.k}
                    item={r}
                    isFirst={i === 0}
                    isLast={i === sec.rows.length - 1}
                  />
                ))}
              </View>
            </View>
          ))}

          <Text style={{
            marginTop: 12,
            textAlign: 'center',
            fontFamily: f.mono,
            fontSize: 8,
            letterSpacing: 8 * 0.22,
            color: c.inkMuted,
            textTransform: 'uppercase',
          }}>
            Romeo &amp; Juliet · v1.0 · Est. 2026
          </Text>
        </View>
      </ScreenScroll>
    </View>
  );
}
