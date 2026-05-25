import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { TextLink, PrimaryButton, SecondaryButton } from '@/components/primitives/Button';
import { ArchetypeStamp } from '@/components/primitives/ArchetypeStamp';
import { ARCHETYPES } from '@/lib/archetypes';

// Demo data — replace with real match payload once Phase 3 backend integration lands.
const MATCH = {
  name: 'James',
  archetype: ARCHETYPES.slow,
  age: 31,
  city: 'Edinburgh',
  occupation: 'Garden designer',
  note: 'I keep a notebook of restaurants that are quiet on Tuesdays. I read two books at a time because committing to one feels rude to the other.',
  photoCount: 3,
};

export default function Match() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />
      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <TextLink onPress={() => safeBack()}>← Letter</TextLink>
        <MonoLabel>{MATCH.name}</MonoLabel>
      </Row>

      <ScrollView contentContainerStyle={{ paddingHorizontal: d.pad, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginTop: 8 }}>
          <View style={[styles.photo, { borderColor: c.rule, backgroundColor: c.bgSunken }]}>
            <Text style={{ fontFamily: f.mono, color: c.inkMuted, letterSpacing: 2, fontSize: 9 }}>PHOTO 1 OF {MATCH.photoCount}</Text>
          </View>
        </View>

        <Stack gap={8} style={{ marginTop: 24, alignItems: 'center' }}>
          <Text style={{ fontFamily: f.serif, fontSize: 38, color: c.ink, lineHeight: 42 }}>{MATCH.name},</Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 16, color: c.inkMuted }}>{MATCH.age} · {MATCH.city} · {MATCH.occupation}</Text>
        </Stack>

        <View style={{ marginTop: 18, alignItems: 'center' }}>
          <ArchetypeStamp archetype={MATCH.archetype} height={90} />
          <Text style={{ fontFamily: f.serifI, fontSize: 18, color: c.forest, marginTop: 8 }}>{MATCH.archetype.name}</Text>
        </View>

        <View style={{ marginTop: 22 }}><OrnamentDivider /></View>

        <Text style={{ fontFamily: f.serif, fontStyle: 'italic', fontSize: 18, color: c.ink, lineHeight: 27, marginTop: 18, textAlign: 'center' }}>
          &ldquo;{MATCH.note}&rdquo;
        </Text>

        <Stack gap={10} style={{ marginTop: 28 }}>
          <PrimaryButton onPress={() => router.push('/(letter)/respond' as never)}>Yes — reply to Romeo</PrimaryButton>
          <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>Not this time</SecondaryButton>
        </Stack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { width: 220, height: 280, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
