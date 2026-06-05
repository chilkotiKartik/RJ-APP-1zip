// RJ-APP/app/(letter)/letter.tsx
// Romeo's letter — fetches the actual match data from Supabase to personalise.
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
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

function buildLetter(name: string, archetypeId: string | null, myName: string | null): string {
  const arch = archetypeId && (archetypeId in ARCHETYPES)
    ? ARCHETYPES[archetypeId as ArchetypeId]
    : null;

  const archLine = arch
    ? `I think you might like ${name}. He is ${arch.name} — ${arch.sub}.`
    : `I think you might like ${name}. He struck me as someone worth knowing.`;

  return archLine;
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

  const letterBody = buildLetter(otherName, archetypeId, profile?.first_name ?? null);
  const num = letterNumber(mostRecent);
  const myName = profile?.first_name ?? 'friend';

  return (
    <View style={{ flex: 1, backgroundColor: c.bgAlt, paddingTop: insets.top }}>
      <PaperNoise />

      {/* Header bar */}
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
            {/* Paper letter */}
            <View style={[styles.paper, { backgroundColor: c.bg, borderColor: c.rule }]}>
              {/* Wax seal at top */}
              <View style={{ alignItems: 'center', marginBottom: 22 }}>
                <WaxSeal size={52} />
              </View>

              {/* Greeting */}
              <Text style={{ fontFamily: f.script, fontSize: 28, color: c.indigo, marginBottom: 20 }}>
                Dear {myName},
              </Text>

              {/* Body */}
              <Text style={{ fontFamily: f.serif, fontSize: 19, color: c.ink, lineHeight: 31 }}>
                I have just finished reading your letter to Juliet — twice, actually, because the second time I wanted to be sure I hadn&rsquo;t imagined the part about you.
              </Text>

              <Text style={{ fontFamily: f.serif, fontSize: 19, color: c.ink, lineHeight: 31, marginTop: 18 }}>
                {letterBody}
              </Text>

              <Text style={{ fontFamily: f.serif, fontSize: 19, color: c.ink, lineHeight: 31, marginTop: 18 }}>
                Take a moment with his note. There is no clock running.
              </Text>

              <View style={{ marginTop: 24 }}>
                <OrnamentDivider />
              </View>

              {/* Sign-off */}
              <Text style={{ fontFamily: f.script, fontSize: 24, color: c.indigo, textAlign: 'right', marginTop: 18, lineHeight: 32 }}>
                Yours,{'\n'}Romeo.
              </Text>
            </View>

            {/* CTAs */}
            <Stack gap={10} style={{ marginTop: 28 }}>
              <PrimaryButton onPress={() => router.push('/(letter)/match' as never)}>
                Meet {otherName}
              </PrimaryButton>
              <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>
                Reply directly
              </SecondaryButton>
            </Stack>

            {/* Date postmark */}
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
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 28,
    elevation: 4,
  },
});
