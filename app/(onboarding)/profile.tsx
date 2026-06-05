// RJ-APP/app/(onboarding)/profile.tsx
import { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, Pressable, Alert, Image,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { safeBack } from '@/lib/nav';
import { useRJTheme } from '@/theme/useRJTheme';
import { ScreenScroll, Row, Stack } from '@/components/primitives/layout';
import { MonoLabel } from '@/components/primitives/MonoLabel';
import { OrnamentDivider } from '@/components/primitives/OrnamentDivider';
import { PrimaryButton, TextLink } from '@/components/primitives/Button';
import { PaperNoise } from '@/components/primitives/PaperNoise';
import { WaxSeal } from '@/components/primitives/WaxSeal';
import { supabase } from '@/lib/supabase';
import { pickAndUploadPhoto } from '@/lib/upload';
import { saveProfile } from '@/lib/api';

const PHOTO_LABELS = [
  'Your face',
  'How you spend time',
  'Something you love',
];

export default function Profile() {
  const { c, f, d } = useRJTheme();
  const insets = useSafeAreaInsets();
  const [firstName, setFirstName] = useState('');
  const [social, setSocial] = useState('');
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState<boolean[]>([false, false, false]);
  const [busy, setBusy] = useState(false);

  const completedPhotos = photos.filter(Boolean).length;

  const pickSlot = async (slot: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Alert.alert('Please sign in first');

    setUploading(u => u.map((v, i) => i === slot ? true : v));
    const r = await pickAndUploadPhoto(user.id, slot);
    setUploading(u => u.map((v, i) => i === slot ? false : v));

    if (!r.ok) {
      if (r.error !== 'Cancelled') Alert.alert('Upload failed', r.error);
      return;
    }
    setPhotos(p => p.map((u, i) => (i === slot ? r.url : u)));
  };

  const submit = async () => {
    if (!firstName.trim()) return Alert.alert('A name, please.');
    const photoUrls = photos.filter((p): p is string => !!p);
    if (photoUrls.length < 3) return Alert.alert(
      'Three photographs',
      `You have ${completedPhotos} of 3. Please add ${3 - completedPhotos} more.`,
    );

    setBusy(true);
    const r = await saveProfile({
      firstName: firstName.trim(),
      socialHandle: social.trim() || null,
      photoUrls,
    });
    setBusy(false);
    if (!r.ok) return Alert.alert("Couldn't save your profile", r.error ?? 'Try again');
    router.replace('/(onboarding)/pending');
  };

  return (
    <ScreenScroll>
      <PaperNoise />
      <View style={{ padding: d.pad, paddingTop: d.pad + insets.top, paddingBottom: d.pad + insets.bottom, flex: 1 }}>

        {/* Header */}
        <Row justify="space-between">
          <TextLink onPress={() => safeBack()}>← Back</TextLink>
          <MonoLabel>Step 2 of 4</MonoLabel>
        </Row>

        {/* Title */}
        <View style={{ marginTop: 32, gap: 10 }}>
          <MonoLabel color={c.gold}>Tell her about yourself</MonoLabel>
          <Text style={{ fontFamily: f.serif, fontSize: d.hero, color: c.ink, lineHeight: d.hero * 1.05 }}>
            What should{'\n'}we call you?
          </Text>
          <Text style={{ fontFamily: f.bodyI, fontSize: 15, color: c.inkMuted, lineHeight: 22 }}>
            A first name and three photographs. Juliet reads slowly — she appreciates the honest ones.
          </Text>
        </View>

        <View style={{ marginTop: 24, marginBottom: 20 }}>
          <OrnamentDivider />
        </View>

        {/* Fields */}
        <Stack gap={18}>
          <Field
            label="First name"
            value={firstName}
            onChange={setFirstName}
            placeholder="Eleanor"
          />
          <Field
            label="Social handle"
            value={social}
            onChange={setSocial}
            placeholder="@eleanor"
            optional
          />
        </Stack>

        {/* Photos */}
        <View style={{ marginTop: 30 }}>
          <Row justify="space-between" style={{ marginBottom: 8 }}>
            <MonoLabel>Three photographs</MonoLabel>
            <MonoLabel color={completedPhotos === 3 ? c.forest : c.inkMuted}>
              {completedPhotos} / 3
            </MonoLabel>
          </Row>
          <Text style={{ fontFamily: f.bodyI, fontSize: 13, color: c.inkMuted, marginBottom: 14, lineHeight: 19 }}>
            One face, two of how you spend your time.
          </Text>

          <View style={styles.photoRow}>
            {photos.map((url, i) => (
              <Pressable
                key={i}
                onPress={() => pickSlot(i)}
                style={[styles.slot, { backgroundColor: c.bgSunken, borderColor: url ? c.forest : c.rule }]}
              >
                {url ? (
                  <>
                    <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    {/* Subtle green check overlay */}
                    <View style={[styles.slotCheck, { backgroundColor: `${c.forest}CC` }]}>
                      <Text style={{ fontFamily: f.mono, fontSize: 9, color: c.bg, letterSpacing: 1 }}>✓</Text>
                    </View>
                  </>
                ) : uploading[i] ? (
                  <Text style={{ fontFamily: f.mono, fontSize: 8, color: c.inkMuted, letterSpacing: 1.5 }}>
                    UPLOADING
                  </Text>
                ) : (
                  <Stack gap={4} style={{ alignItems: 'center' }}>
                    <Text style={{ fontFamily: f.serifI, fontSize: 20, color: c.inkMuted }}>+</Text>
                    <Text style={{ fontFamily: f.mono, fontSize: 7.5, color: c.inkMuted, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                      {PHOTO_LABELS[i]}
                    </Text>
                  </Stack>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Progress dots */}
        <Row gap={6} style={{ justifyContent: 'center', marginTop: 18 }}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[styles.dot, {
                backgroundColor: i < completedPhotos ? c.forest : c.ruleSoft,
                width: i < completedPhotos ? 16 : 8,
              }]}
            />
          ))}
        </Row>

        <View style={{ marginTop: 28 }}>
          <PrimaryButton onPress={submit}>
            {busy ? 'Sending to Juliet…' : 'Send to Juliet'}
          </PrimaryButton>
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
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  slotCheck: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
});
