import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { supabase } from '@/lib/supabase';
import { pickAndUploadPhoto } from '@/lib/upload';

export default function Profile() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [social, setSocial] = useState('');
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [busy, setBusy] = useState(false);

  const pickSlot = async (slot: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Please sign in first');
    const r = await pickAndUploadPhoto(user.id, slot);
    if (!r.ok) {
      if (r.error !== 'Cancelled') Alert.alert('Upload failed', r.error);
      return;
    }
    setPhotos(p => p.map((u, i) => (i === slot ? r.url : u)));
  };

  const submit = async () => {
    if (!firstName.trim()) return Alert.alert('A name, please.');
    const photoUrls = photos.filter((p): p is string => !!p);
    if (photoUrls.length < 3) return Alert.alert('Three photos are required.');

    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return Alert.alert('Session expired'); }
    const { error } = await supabase.from('profiles').upsert({
      user_id: user.id,
      first_name: firstName.trim(),
      social_handle: social.trim() || null,
      photo_urls: photoUrls,
      phase: 'PENDING_APPROVAL',
    }, { onConflict: 'user_id' });
    setBusy(false);
    if (error) return Alert.alert("Couldn't save your profile", error.message);
    router.replace('/(onboarding)/pending');
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1 }}>
        <Row justify="space-between">
          <TextLink onPress={() => router.back()}>← Back</TextLink>
          <MonoLabel>Step 2 of 4</MonoLabel>
        </Row>

        <View style={{ marginTop: 32, gap: 16 }}>
          <MonoLabel>Tell her about yourself</MonoLabel>
          <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.05 }}>
            What should{'\n'}we call you?
          </Text>
        </View>

        <View style={{ marginTop: 24, marginBottom: 16 }}>
          <OrnamentDivider />
        </View>

        <Stack gap={16}>
          <Field label="First name" value={firstName} onChange={setFirstName} placeholder="Eleanor" />
          <Field label="Social handle" value={social} onChange={setSocial} placeholder="@eleanor" optional />
        </Stack>

        <View style={{ marginTop: 28, marginBottom: 12 }}>
          <MonoLabel>Three photographs</MonoLabel>
          <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, marginTop: 4 }}>
            One face, two of how you spend your time.
          </Text>
        </View>

        <View style={styles.photoRow}>
          {photos.map((url, i) => (
            <Pressable key={i} onPress={() => pickSlot(i)} style={[styles.slot, { backgroundColor: c.bgSunken, borderColor: c.rule }]}>
              {url ? (
                <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <Text style={{ fontFamily: f.mono, fontSize: 9, letterSpacing: 1.8, color: c.inkMuted, textTransform: 'uppercase' }}>+ Photo</Text>
              )}
            </Pressable>
          ))}
        </View>

        <View style={{ marginTop: 32 }}>
          <PrimaryButton onPress={submit}>{busy ? 'Sending…' : 'Send to Juliet'}</PrimaryButton>
        </View>
      </View>
    </ScreenScroll>
  );
}

function Field({
  label, value, onChange, placeholder, optional,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; optional?: boolean }) {
  const { c, f } = useRJTheme();
  return (
    <View>
      <Row gap={6}>
        <MonoLabel>{label}</MonoLabel>
        {optional && <MonoLabel color={c.inkMuted as string}>· optional</MonoLabel>}
      </Row>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.inkMuted as string}
        autoCorrect={false}
        style={{
          borderBottomWidth: 1, borderBottomColor: c.rule,
          paddingVertical: 10, marginTop: 4,
          fontFamily: f.serif, fontSize: 22, color: c.ink,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  photoRow: { flexDirection: 'row', gap: 10 },
  slot: {
    flex: 1, aspectRatio: 3 / 4,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
});
