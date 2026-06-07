// RJ-APP/app/(letter)/letter.tsx
// Romeo's letter — Caveat handwriting font, page curl, ink blot decorations.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PrimaryButton, SecondaryButton, TextLink } from '@/components/primitives/Button';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { useStatus, useMatches, otherUserName, MatchRow } from '@/lib/hooks';
import { ARCHETYPES, ArchetypeId } from '@/lib/archetypes';

function letterNumber(match: MatchRow | undefined): string {
  if (!match) return '0247';
  let sum = 0;
  for (let i = 0; i < match.id.length; i++) sum = (sum + match.id.charCodeAt(i)) % 99991;
  return String(sum % 9999).padStart(4, '0');
}

function buildLetter(name: string, archetypeId: string | null): string {
  const arch = archetypeId && (archetypeId in ARCHETYPES)
    ? ARCHETYPES[archetypeId as ArchetypeId]
    : null;
  return arch
    ? `I think you might like ${name}. He is ${arch.name} — ${arch.sub}.`
    : `I think you might like ${name}. He struck me as someone worth knowing.`;
}

function InkBlots({ color }: { color: string }) {
  return (
    <Svg width={80} height={24} viewBox="0 0 80 24" style={{ marginTop: 8, marginLeft: 'auto' }}>
      <SvgCircle cx={8} cy={12} r={4} fill={color} fillOpacity={0.12} />
      <SvgCircle cx={22} cy={8} r={2.5} fill={color} fillOpacity={0.08} />
      <SvgCircle cx={34} cy={16} r={5} fill={color} fillOpacity={0.1} />
      <SvgCircle cx={48} cy={10} r={2} fill={color} fillOpacity={0.07} />
      <SvgCircle cx={58} cy={14} r={3.5} fill={color} fillOpacity={0.09} />
      <SvgCircle cx={70} cy={8} r={2} fill={color} fillOpacity={0.06} />
    </Svg>
  );
}

function PageCurl({ color }: { color: string }) {
  return (
    <View style={[styles.curlCorner, { borderColor: color }]}>
      <View style={[styles.curlShadow, { backgroundColor: color }]} />
    </View>
  );
}

export default function Letter() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { profile, userId } = useStatus(0);
  const { matches, loading } = useMatches(userId);

  const mostRecent: MatchRow | undefined = matches[0];
  const otherName = mostRecent ? otherUserName(mostRecent, userId) : 'someone special';
  const otherProfile = mostRecent
    ? (mostRecent.user_a === userId ? mostRecent.profile_b : mostRecent.profile_a)
    : null;
  const archetypeId = otherProfile?.archetype ?? null;

  const letterBody = buildLetter(otherName, archetypeId);
  const num = letterNumber(mostRecent);
  const myName = profile?.first_name ?? 'friend';

  return (
    <View style={{ flex: 1, backgroundColor: c.bgAlt, paddingTop: insets.top }}>
      <PaperNoise />

      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <TextLink onPress={() => safeBack()}>← Envelope</TextLink>
        <MonoLabel>Letter no. {num}</MonoLabel>
      </Row>

      <ScrollView
        contentContainerStyle={{ padding: d.pad, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <ActivityIndicator color={c.forest} />
          </View>
        ) : (
          <>
            <View style={[styles.paper, { backgroundColor: c.bg, borderColor: c.rule }]}>
              {/* Wax seal at top */}
              <View style={{ alignItems: 'center', marginBottom: 22 }}>
                <WaxSeal size={52} />
              </View>

              {/* Greeting — CormorantGaramond italic */}
              <Text style={{ fontFamily: f.serifI, fontSize: 24, color: c.indigo, marginBottom: 20 }}>
                Dear {myName},
              </Text>

              {/* Body — Caveat handwriting */}
              <Text style={{ fontFamily: f.script, fontSize: 18, color: c.ink, lineHeight: 28 }}>
                I have just finished reading your letter to Juliet — twice, actually, because the second time I wanted to be sure I hadn&rsquo;t imagined the part about you.
              </Text>

              <Text style={{ fontFamily: f.script, fontSize: 18, color: c.ink, lineHeight: 28, marginTop: 18 }}>
                {letterBody}
              </Text>

              <Text style={{ fontFamily: f.script, fontSize: 18, color: c.ink, lineHeight: 28, marginTop: 18 }}>
                Take a moment with his note. There is no clock running.
              </Text>

              <View style={{ marginTop: 24 }}>
                <OrnamentDivider />
              </View>

              {/* Sign-off */}
              <Text style={{ fontFamily: f.script, fontSize: 22, color: c.indigo, textAlign: 'right', marginTop: 18, lineHeight: 30 }}>
                Yours,{'\n'}Romeo.
              </Text>

              {/* Ink blot decorations near signature */}
              <InkBlots color={c.ink} />

              {/* Page curl bottom-right */}
              <PageCurl color={c.rule} />
            </View>

            <Stack gap={10} style={{ marginTop: 28 }}>
              <PrimaryButton onPress={() => router.push('/(letter)/match' as never)}>
                Meet {otherName}
              </PrimaryButton>
              <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>
                Reply directly
              </SecondaryButton>
            </Stack>

            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ fontFamily: f.mono, fontSize: 8, letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase' }}>
                Delivered · Romeo &amp; Juliet Correspondence
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderWidth: 1,
    padding: 28,
    paddingBottom: 36,
    elevation: 4,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 12px 28px rgba(0,0,0,0.14)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 28 },
    }),
  },
  curlCorner: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderTopLeftRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  curlShadow: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    opacity: 0.06,
    borderTopLeftRadius: 14,
  },
});
