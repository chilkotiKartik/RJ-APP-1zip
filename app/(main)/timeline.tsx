// RJ-APP/app/(main)/timeline.tsx
// Full letter exchange history for a match — vertical scroll of paper cards.
import { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { PaperHeader } from '@/components/primitives/PaperHeader';
import { IconBtn } from '@/components/primitives/IconBtn';
import { IconBack } from '@/components/primitives/Icons';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PostmarkStamp } from '@/components/primitives/PostmarkStamp';
import { useStatus, useMatches, otherUserName } from '@/lib/hooks';
import { supabase } from '@/lib/supabase';

type Letter = {
  id: string;
  author_id: string | null;
  body: string | null;
  created_at: string | null;
  match_id: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Timeline() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ matchId?: string }>();
  const { userId } = useStatus(0);
  const { matches } = useMatches(userId);

  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const matchId = params.matchId ?? matches[0]?.id;
  const match = matches.find(m => m.id === matchId) ?? matches[0];
  const otherName = match ? otherUserName(match, userId) : 'Your match';

  useEffect(() => {
    if (!matchId) { setLoading(false); return; }
    (async () => {
      try {
        const { data } = await supabase
          .from('letters')
          .select('*')
          .eq('match_id', matchId)
          .order('created_at', { ascending: true });
        setLetters((data ?? []) as Letter[]);
      } catch {
        setLetters([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <PaperHeader
        left={
          <IconBtn onPress={() => safeBack('/(main)/home')}>
            <IconBack />
          </IconBtn>
        }
        center="Correspondence"
        sub={otherName}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: d.pad, paddingBottom: 48 + insets.bottom }}
      >
        <PaperNoise />
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <ActivityIndicator color={c.forest} />
          </View>
        )}

        {!loading && letters.length === 0 && (
          <View style={styles.empty}>
            <PostmarkStamp size={72} />
            <View style={{ marginVertical: 22 }}>
              <OrnamentDivider />
            </View>
            <Text style={{ fontFamily: f.serifI, fontSize: 20, color: c.ink, textAlign: 'center' }}>
              Your correspondence begins here.
            </Text>
            <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, textAlign: 'center', marginTop: 10, lineHeight: 22 }}>
              Letters between you and {otherName} will appear here as they arrive.
            </Text>
          </View>
        )}

        {!loading && letters.map((letter) => {
          const isMe = letter.author_id === userId;
          return (
            <View
              key={letter.id}
              style={[styles.card, {
                backgroundColor: c.bgCard,
                borderColor: c.rule,
                borderLeftWidth: 3,
                borderLeftColor: isMe ? c.gold : c.forest,
                marginLeft: isMe ? 0 : 20,
                marginRight: isMe ? 20 : 0,
              }]}
            >
              <Row justify="space-between" style={{ marginBottom: 8 }}>
                <Text style={{ fontFamily: f.serifI, fontSize: 16, color: isMe ? c.gold : c.forest }}>
                  {isMe ? 'You' : otherName}
                </Text>
                <MonoLabel size={7.5}>{formatDate(letter.created_at)}</MonoLabel>
              </Row>
              <Text style={{ fontFamily: f.body, fontSize: 16, color: c.ink, lineHeight: 25 }}>
                {letter.body ?? ''}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: 60,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    borderRadius: 2,
  },
});
