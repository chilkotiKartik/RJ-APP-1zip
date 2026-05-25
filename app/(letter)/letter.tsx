import { View, Text, StyleSheet, ScrollView } from 'react-native';
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

export default function Letter() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: c.bgAlt, paddingTop: insets.top }}>
      <PaperNoise />
      <Row justify="space-between" style={{ paddingHorizontal: d.pad, paddingVertical: 12 }}>
        <TextLink onPress={() => safeBack()}>← Envelope</TextLink>
        <MonoLabel>Letter no. 0247</MonoLabel>
      </Row>

      <ScrollView contentContainerStyle={{ padding: d.pad, paddingBottom: 40 }}>
        <View style={[styles.paper, { backgroundColor: c.bg, borderColor: c.rule }]}>
          <View style={{ alignItems: 'center', marginBottom: 18 }}>
            <WaxSeal size={56} />
          </View>

          <Text style={{ fontFamily: f.script, fontSize: 28, color: c.indigo, textAlign: 'left', marginBottom: 18 }}>
            Dear friend,
          </Text>

          <Text style={{ fontFamily: f.serif, fontSize: 19, color: c.ink, lineHeight: 30 }}>
            I have just finished reading your letter to Juliet — twice, actually, because the second time I wanted to be sure I hadn&rsquo;t imagined the part about your grandmother&rsquo;s kitchen.
            {'\n\n'}
            I think you might like James. He is the Slow Burner — considered, late to bloom, long to stay. He keeps a record of which restaurants are quiet on Tuesdays. He reads two books at once on principle.
            {'\n\n'}
            Take a moment with his note. There is no clock running.
          </Text>

          <View style={{ marginTop: 22 }}><OrnamentDivider /></View>

          <Text style={{ fontFamily: f.script, fontSize: 24, color: c.indigo, textAlign: 'right', marginTop: 16 }}>
            Yours,{'\n'}Romeo.
          </Text>
        </View>

        <Stack gap={10} style={{ marginTop: 24 }}>
          <PrimaryButton onPress={() => router.push('/(letter)/match' as never)}>Meet James</PrimaryButton>
          <SecondaryButton onPress={() => router.push('/(letter)/respond' as never)}>Reply directly</SecondaryButton>
        </Stack>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  paper: {
    borderWidth: 1, padding: 26,
    shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 12 }, shadowRadius: 28,
    elevation: 4,
  },
});
