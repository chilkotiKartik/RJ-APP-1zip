// RJ-APP/app/(conversation)/archetype.tsx
import { useEffect, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ARCHETYPES, Archetype } from '@/lib/archetypes';
import { ArchetypeCard, ArchetypeReading } from '@/components/archetype/ArchetypeCard';
import { TextLink, PrimaryButton } from '@/components/primitives/Button';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { RosePetals } from '@/components/effects/RosePetals';
import { supabase } from '@/lib/supabase';
import { Row } from '@/components/primitives/layout';

const READINGS: Record<Archetype['id'], Omit<ArchetypeReading, 'archetype'>> = {
  curious: {
    traits: ['Restless', 'Curious', 'Open'],
    coreDesire: 'To find a partner who is also still becoming.',
    description: 'You read every book half-finished and remember three sentences from each. The Curious Explorer chases the new because the new keeps her honest. She tires of certainty.',
    light: ['Asks the second question', 'Travels light', 'Lets people change'],
    shadow: ['Restless when settled', 'Drops things half-built', 'Romanticises elsewhere'],
    harmonisesWith: ['The Grounded Builder', 'The Slow Burner'],
  },
  grounded: {
    traits: ['Patient', 'Devoted', 'Capable'],
    coreDesire: 'To build something that holds for fifty years.',
    description: 'The Grounded Builder takes the long view. She is the friend who shows up early and stays late, who repairs the chair instead of buying a new one.',
    light: ['Finishes what she starts', 'Holds promises', 'Builds slow trust'],
    shadow: ['Slow to change course', 'Can mistake habit for love', 'Sometimes too literal'],
    harmonisesWith: ['The Curious Explorer', 'The Magnetic Force'],
  },
  intellectual: {
    traits: ['Sharp', 'Attentive', 'Pattern-finder'],
    coreDesire: 'To be deeply understood, and to deeply understand.',
    description: 'She reads the room before she enters it. The Intellectual Connector watches; the Intellectual Connector remembers. She loves a long lunch and a sharp question.',
    light: ['Listens past the words', 'Connects ideas across decades', 'Makes others feel sharper'],
    shadow: ['Lives in the head', 'Slow to feel out loud', 'Over-edits her own warmth'],
    harmonisesWith: ['The Playful Spark', 'The Romantic Idealist'],
  },
  magnetic: {
    traits: ['Present', 'Electric', 'Compelling'],
    coreDesire: 'To matter visibly to one person, completely.',
    description: 'When she walks in, the conversation tilts. The Magnetic Force does not perform — she just shows up, all of her, with nothing held back.',
    light: ['Brings rooms alive', 'Sees people clearly', 'Asks for what she wants'],
    shadow: ['Performs unintentionally', 'Tires of small attention', 'Mistakes intensity for closeness'],
    harmonisesWith: ['The Grounded Builder', 'The Slow Burner'],
  },
  playful: {
    traits: ['Light', 'Mischievous', 'Joyful'],
    coreDesire: 'To turn the ordinary day into a small good story.',
    description: 'The Playful Spark refuses solemnity that is not earned. She makes the waiter laugh. She is the friend whose voice notes you save.',
    light: ['Lightens dark rooms', 'Names absurdity gently', 'Forgives quickly'],
    shadow: ['Avoids heavy weather', 'Can deflect intimacy with charm', 'Tires of the same audience'],
    harmonisesWith: ['The Intellectual Connector', 'The Romantic Idealist'],
  },
  romantic: {
    traits: ['Tender', 'Attentive', 'A believer'],
    coreDesire: 'To love someone who knows they are being loved.',
    description: 'The Romantic Idealist writes the letter and posts it. She keeps the train ticket. She is the one who notices when the other person has had a hard week and arrives with soup.',
    light: ['Loves out loud', 'Holds people without holding on', 'Sees beauty in the ordinary'],
    shadow: ['Builds people in her head', 'Mourns long after', 'Mistakes intensity for fit'],
    harmonisesWith: ['The Intellectual Connector', 'The Playful Spark'],
  },
  slow: {
    traits: ['Considered', 'Deep-rooted', 'Long-staying'],
    coreDesire: 'To love one person across decades.',
    description: 'The Slow Burner does not arrive in a season. She accumulates. By the time she says she loves you, she has loved you for two years already.',
    light: ['Builds the kind of love that holds', 'Trusts deeply', 'Keeps showing up'],
    shadow: ['Slow to begin', 'Reluctant to leave the wrong thing', 'Holds grief privately'],
    harmonisesWith: ['The Curious Explorer', 'The Magnetic Force'],
  },
};

export default function ArchetypeScreen() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [archetypeId, setArchetypeId] = useState<Archetype['id']>('curious');
  const [petalsRunning, setPetalsRunning] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('archetype').eq('user_id', user.id).maybeSingle();
      const arch = (data as { archetype?: string } | null)?.archetype;
      if (arch && (arch in ARCHETYPES)) setArchetypeId(arch as Archetype['id']);
    })();
    // Trigger rose petals on reveal
    const t = setTimeout(() => setPetalsRunning(true), 600);
    return () => clearTimeout(t);
  }, []);

  const archetype = ARCHETYPES[archetypeId];
  const reading: ArchetypeReading = { archetype, ...READINGS[archetypeId] };

  const onShare = async () => {
    await Share.share({ message: `Juliet read me as ${archetype.name}. — Romeo & Juliet` });
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <PaperNoise />
      <RosePetals running={petalsRunning} />
      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <TextLink onPress={() => router.replace('/(conversation)/waiting' as never)}>Skip</TextLink>
        <MonoLabel>Her reading</MonoLabel>
      </Row>

      <ArchetypeCard reading={reading} />

      <View style={{ padding: d.pad, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: c.rule }}>
        <Row gap={10}>
          <Pressable onPress={onShare} style={[styles.shareBtn, { borderColor: c.forest }]}>
            <Text style={{ fontFamily: f.mono, color: c.forest, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Share</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/(conversation)/compatibility' as never)}
            style={[styles.shareBtn, { borderColor: c.gold }]}
          >
            <Text style={{ fontFamily: f.mono, color: c.gold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>Matches</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton onPress={() => router.replace('/(conversation)/waiting' as never)}>Continue</PrimaryButton>
          </View>
        </Row>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shareBtn: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
});
