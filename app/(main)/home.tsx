// RJ-APP/app/(main)/home.tsx
import { useMemo, useState, useCallback } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { JulietPortrait } from '@/components/primitives/JulietPortrait';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconCog, IconArrow } from '@/components/primitives/Icons';
import { SkeletonLine, SkeletonBlock } from '@/components/primitives/Skeleton';
import { useStatus, useMatches, otherUserName, MatchRow } from '@/lib/hooks';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  return 'Good evening,';
}

function letterNumberFromMatch(match: MatchRow | undefined): string {
  if (!match) return '0000';
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

function SkeletonLetterCard() {
  const { c } = useRJTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.bgCard, borderColor: c.rule }]}>
      <Row justify="space-between" style={{ marginBottom: 12 }}>
        <SkeletonLine width={90} />
        <SkeletonLine width={50} />
      </Row>
      <SkeletonLine width="70%" style={{ marginBottom: 10 }} />
      <SkeletonLine width="90%" style={{ marginBottom: 8 }} />
      <SkeletonLine width="65%" />
    </View>
  );
}

export default function Home() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { phase, profile, userId, refresh: refreshStatus } = useStatus(15000);
  const { matches, loading: matchesLoading, refresh: refreshMatches } = useMatches(userId);
  const [refreshing, setRefreshing] = useState(false);

  const month = useMemo(() => MONTHS[new Date().getMonth()], []);
  const mostRecent: MatchRow | undefined = matches[0];
  const earlier = matches.slice(1, 4);
  const otherName = mostRecent ? otherUserName(mostRecent, userId) : null;
  const letterReady = phase === 'LETTER_READY';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshStatus(), refreshMatches()]);
    setRefreshing(false);
  }, [refreshStatus, refreshMatches]);

  const openLetter = () => {
    Haptics.selectionAsync();
    if (letterReady) {
      router.push('/(letter)/envelope' as never);
    } else {
      router.push('/(letter)/letter' as never);
    }
  };

  const openTimeline = (matchId: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(main)/timeline', params: { matchId } } as never);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={c.gold}
          colors={[c.gold]}
        />
      }
      showsVerticalScrollIndicator={false}
    >
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

        {/* Time-of-day greeting */}
        <View style={{ marginTop: 20, marginBottom: 4 }}>
          <Text style={{ fontFamily: f.serifI, fontSize: 15, color: c.inkMuted }}>
            {greeting()}
          </Text>
          <Text style={{ fontFamily: f.serifI, fontSize: 24, color: c.ink, lineHeight: 30 }}>
            {profile?.first_name ?? 'friend'}.
          </Text>
        </View>

        {/* Most recent letter */}
        <View style={{ marginTop: 20 }}>
          <MonoLabel size={8} color={c.gold}>Most recent</MonoLabel>

          {matchesLoading && (
            <>
              <SkeletonLetterCard />
              <View style={{ height: 12 }} />
              <SkeletonBlock height={52} style={{ marginTop: 4 }} />
              <View style={{ height: 8 }} />
              <SkeletonBlock height={52} style={{ marginTop: 4 }} />
            </>
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
                {otherName !== 'Someone' && otherName
                  ? `I'd like you to meet someone. Their name is ${otherName}, and they are, I think, kind in a way you might not have guessed…`
                  : 'A short note from me is inside…'}
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
            <View style={styles.emptyState}>
              <PostmarkStamp size={72} />
              <View style={{ marginVertical: 18 }}>
                <OrnamentDivider />
              </View>
              <Text style={{
                fontFamily: f.serifI,
                fontSize: 22,
                color: c.ink,
                textAlign: 'center',
                lineHeight: 30,
              }}>
                Romeo is seeking you.
              </Text>
              <MonoLabel size={9} color={c.inkMuted} style={{ marginTop: 10, textAlign: 'center' }}>
                Your letter will arrive in due time.
              </MonoLabel>
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
                    onPress={() => openTimeline(m.id)}
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

        {/* Speak to Juliet */}
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
            <JulietPortrait width={56} height={56} rotate={0} label="" />
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
    </ScrollView>
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
  emptyState: {
    marginTop: 28,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
});
