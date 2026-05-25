// RJ-APP/app/(main)/home.tsx
import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconCog, IconArrow } from '@/components/primitives/Icons';
import { useStatus, useMatches, otherUserName, MatchRow } from '@/lib/hooks';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function letterNumberFromMatch(match: MatchRow | undefined): string {
  if (!match) return '0000';
  // 4-digit deterministic number from match.id (uuid). Sum char codes mod 9999.
  let sum = 0;
  for (let i = 0; i < match.id.length; i++) sum = (sum + match.id.charCodeAt(i)) % 99991;
  return String(sum % 9999).padStart(4, '0');
}

function formatLetterDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.floor((now.getTime() - d.getTime()) / dayMs);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
}

export default function Home() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase, profile, userId } = useStatus(15000);
  const { matches, loading: matchesLoading } = useMatches(userId);

  const month = useMemo(() => MONTHS[new Date().getMonth()], []);
  const mostRecent: MatchRow | undefined = matches[0];
  const earlier = matches.slice(1, 4);
  const otherName = mostRecent ? otherUserName(mostRecent, userId) : null;
  const letterReady = phase === 'LETTER_READY';

  const openLetter = () => {
    Haptics.selectionAsync();
    if (letterReady) {
      router.push('/(letter)/envelope' as never);
    } else {
      router.push('/(letter)/letter' as never);
    }
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: 32 }}>
        {/* Top bar */}
        <Row justify="space-between">
          <Stack gap={2}>
            <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.ink }}>
              Romeo &amp; Juliet
            </Text>
            <MonoLabel size={7.5}>Your stoop · {month}</MonoLabel>
          </Stack>
          <IconBtn
            onPress={() => router.push('/(main)/settings' as never)}
            testID="home-settings-btn"
          >
            <IconCog />
          </IconBtn>
        </Row>

        {/* Most recent letter */}
        <View style={{ marginTop: 24 }}>
          <MonoLabel size={8} color={c.gold}>Most recent</MonoLabel>

          {matchesLoading && (
            <View style={[styles.card, {
              backgroundColor: c.bgCard,
              borderColor: c.rule,
              opacity: 0.4,
            }]}>
              <View style={{ height: 70 }} />
            </View>
          )}

          {!matchesLoading && mostRecent && (
            <Pressable
              testID="home-most-recent-card"
              onPress={openLetter}
              style={[styles.card, {
                backgroundColor: c.bgCard,
                borderColor: c.rule,
                shadowColor: c.ink,
              }]}
            >
              <Row justify="space-between" style={{ marginBottom: 10 }}>
                <MonoLabel size={7.5}>Letter no. {letterNumberFromMatch(mostRecent)}</MonoLabel>
                <Text style={{
                  fontFamily: f.mono, fontSize: 7.5, letterSpacing: 7.5 * 0.22,
                  color: c.inkMuted, textTransform: 'uppercase',
                }}>
                  {formatLetterDate(mostRecent.created_at) || ''}
                </Text>
              </Row>
              <Text style={{ fontFamily: f.serifI, fontSize: 24, color: c.forest, lineHeight: 26 }}>
                Dear {profile?.first_name ?? 'friend'},
              </Text>
              <Text style={{
                fontFamily: f.serif, fontSize: 16, color: c.ink,
                marginTop: 8, lineHeight: 22, opacity: 0.9,
              }}>
                I&rsquo;d like you to meet someone. {otherName !== 'Someone' ? `Their name is ${otherName}, and they are, I think, kind in a way you might not have guessed…` : 'A short note from me is inside…'}
              </Text>
              <Row justify="space-between" style={{ marginTop: 14 }}>
                <Text style={{ fontFamily: f.serifI, color: c.forest, fontSize: 16 }}>— R.</Text>
                <Row gap={6}>
                  <Text style={{
                    color: c.forest, fontFamily: f.mono, fontSize: 9,
                    letterSpacing: 9 * 0.22, textTransform: 'uppercase',
                  }}>Read</Text>
                  <IconArrow color={c.forest} size={14} />
                </Row>
              </Row>
            </Pressable>
          )}

          {!matchesLoading && !mostRecent && (
            <View style={{ marginTop: 14, alignItems: 'center', paddingVertical: 18 }}>
              <Text style={{
                fontFamily: f.serifI,
                fontSize: 18,
                color: c.inkMuted,
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 26,
              }}>
                Your first letter will arrive soon.
              </Text>
            </View>
          )}
        </View>

        {/* Earlier list */}
        {earlier.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <MonoLabel size={8}>Earlier</MonoLabel>
            <View style={{ marginTop: 8 }}>
              {earlier.map((m, i) => {
                const name = otherUserName(m, userId);
                return (
                  <Pressable
                    key={m.id}
                    testID={`home-earlier-${i}`}
                    onPress={() => Haptics.selectionAsync()}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 14,
                      borderTopWidth: 1,
                      borderTopColor: c.ruleSoft,
                      borderBottomWidth: i === earlier.length - 1 ? 1 : 0,
                      borderBottomColor: c.ruleSoft,
                    }}
                  >
                    <Stack gap={2}>
                      <Row gap={8}>
                        <Text style={{
                          fontFamily: f.mono, fontSize: 7.5, letterSpacing: 7.5 * 0.22,
                          color: c.gold, textTransform: 'uppercase',
                        }}>
                          no. {letterNumberFromMatch(m)}
                        </Text>
                        <Text style={{
                          fontFamily: f.mono, fontSize: 7.5, letterSpacing: 7.5 * 0.22,
                          color: c.inkMuted, textTransform: 'uppercase',
                        }}>
                          {formatLetterDate(m.created_at)}
                        </Text>
                      </Row>
                      <Text style={{ fontFamily: f.serif, fontSize: 17, color: c.ink }}>
                        <Text style={{ fontFamily: f.serifI, color: c.forest }}>{name}</Text>
                      </Text>
                    </Stack>
                    <IconArrow color={c.inkMuted} size={14} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Speak to Juliet (only if user has completed at least one cycle) */}
        {phase === 'COMPLETE' && (
          <Pressable
            testID="home-speak-juliet"
            onPress={() => { Haptics.selectionAsync(); router.push('/(conversation)/voice' as never); }}
            style={{
              marginTop: 24,
              padding: 16,
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: c.rule,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <View style={{ transform: [{ rotate: '0deg' }] }}>
              <JulietPortrait width={56} height={56} rotate={0} label="" />
            </View>
            <View>
              <MonoLabel size={7.5}>If you&rsquo;d like to talk again</MonoLabel>
              <Text style={{ fontFamily: f.serifI, fontSize: 19, color: c.ink, marginTop: 4 }}>
                Speak to Juliet.
              </Text>
              <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, marginTop: 2 }}>
                She remembers what you said.
              </Text>
            </View>
          </Pressable>
        )}
      </View>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    padding: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 26,
    elevation: 3,
  },
});
