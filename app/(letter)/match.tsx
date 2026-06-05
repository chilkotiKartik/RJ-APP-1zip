// RJ-APP/app/(letter)/match.tsx
// Match profile — fetches real data from Supabase.
import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import * as Haptics from 'expo-haptics';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { TextLink, PrimaryButton, SecondaryButton } from '@/components/primitives/Button';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { ARCHETYPES, ArchetypeId } from '@/lib/archetypes';
import { useStatus, useMatches, otherUserName, MatchRow } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type OtherProfile = {
  first_name: string | null;
  archetype: string | null;
  photo_urls: string[] | null;
  questionnaire_answers: Record<string, string> | null;
};

export default function Match() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useStatus(0);
  const { matches, loading: matchLoading } = useMatches(userId);

  const [otherProfile, setOtherProfile] = useState<OtherProfile | null>(null);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);

  const mostRecent: MatchRow | undefined = matches[0];

  // Get the other user's full profile from Supabase
  useEffect(() => {
    if (matchLoading) return;
    if (!mostRecent) { setProfileLoading(false); return; }
    const otherId = mostRecent.user_a === userId ? mostRecent.user_b : mostRecent.user_a;
    if (!otherId) { setProfileLoading(false); return; }

    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, archetype, photo_urls, questionnaire_answers')
        .eq('user_id', otherId)
        .maybeSingle();
      setOtherProfile(data as OtherProfile | null);
      setProfileLoading(false);
    })();
  }, [mostRecent, matchLoading, userId]);

  const loading = matchLoading || profileLoading;
  const name = mostRecent ? otherUserName(mostRecent, userId) : 'Your match';
  const archetype = otherProfile?.archetype && (otherProfile.archetype in ARCHETYPES)
    ? ARCHETYPES[otherProfile.archetype as ArchetypeId]
    : null;
  const photos = otherProfile?.photo_urls ?? [];
  const note = otherProfile?.questionnaire_answers?.romeo_note as string | undefined;

  const nextPhoto = () => {
    if (photos.length < 2) return;
    Haptics.selectionAsync();
    setPhotoIdx(i => (i + 1) % photos.length);
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />

      {/* Header */}
      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <TextLink onPress={() => safeBack()}>← Letter</TextLink>
        <MonoLabel>{loading ? '…' : name}</MonoLabel>
      </Row>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={c.forest} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: d.pad, paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Photo */}
          <View style={{ alignItems: 'center', marginTop: 4 }}>
            <Pressable onPress={nextPhoto}>
              <View style={[styles.photo, { borderColor: c.rule, backgroundColor: c.bgSunken }]}>
                {photos.length > 0 ? (
                  <Image source={{ uri: photos[photoIdx] }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <Text style={{ fontFamily: f.mono, color: c.inkMuted, letterSpacing: 2, fontSize: 9, textTransform: 'uppercase' }}>
                    No photo
                  </Text>
                )}
                {photos.length > 1 && (
                  <View style={[styles.photoCounter, { backgroundColor: c.indigo }]}>
                    <Text style={{ fontFamily: f.mono, fontSize: 8, color: c.bg, letterSpacing: 1 }}>
                      {photoIdx + 1} / {photos.length}
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>
            {photos.length > 1 && (
              <MonoLabel size={7.5} color={c.inkMuted} style={{ marginTop: 6 }}>
                Tap photo to see more
              </MonoLabel>
            )}
          </View>

          {/* Name & details */}
          <Stack gap={6} style={{ marginTop: 24, alignItems: 'center' }}>
            <Text style={{ fontFamily: f.serif, fontSize: 40, color: c.ink, lineHeight: 44 }}>
              {name},
            </Text>
          </Stack>

          {/* Archetype */}
          {archetype && (
            <View style={{ marginTop: 18, alignItems: 'center' }}>
              <ArchetypeStamp archetype={archetype} height={90} color={c.forest} />
              <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.forest, marginTop: 8 }}>
                {archetype.name}
              </Text>
              <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, marginTop: 3, textAlign: 'center', maxWidth: 260 }}>
                {archetype.sub}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 22 }}>
            <OrnamentDivider />
          </View>

          {/* Their note */}
          {note ? (
            <View style={{ marginTop: 20 }}>
              <MonoLabel size={7.5} color={c.gold}>In their own words</MonoLabel>
              <Text style={{
                fontFamily: f.serif, fontStyle: 'italic', fontSize: 19, color: c.ink,
                lineHeight: 29, marginTop: 10, textAlign: 'center',
              }}>
                &ldquo;{note}&rdquo;
              </Text>
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <Text style={{
                fontFamily: f.serifI, fontSize: 18, color: c.inkMuted,
                lineHeight: 27, textAlign: 'center',
              }}>
                &ldquo;I keep a notebook of places that are quiet on weekday mornings.{'\n'}I read two books at once on principle.&rdquo;
              </Text>
            </View>
          )}

          {/* CTAs */}
          <Stack gap={10} style={{ marginTop: 32 }}>
            <PrimaryButton onPress={() => router.push('/(letter)/respond' as never)}>
              Yes — reply to Romeo
            </PrimaryButton>
            <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>
              Not this time
            </SecondaryButton>
          </Stack>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: 230,
    height: 290,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 22,
    elevation: 4,
  },
  photoCounter: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
