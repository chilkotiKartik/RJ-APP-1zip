import * as ImagePicker from 'expo-image-picker';
import { supabase } from './supabase';

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function pickAndUploadPhoto(userId: string, slot: number): Promise<UploadResult> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, error: 'Photo library access denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.85,
  });
  if (result.canceled || !result.assets[0]) return { ok: false, error: 'Cancelled' };

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const path = `${userId}/${Date.now()}-${slot}.${ext}`;

  const response = await fetch(asset.uri);
  const blob = await response.blob();

  const { error: uploadErr } = await supabase
    .storage
    .from('photos')
    .upload(path, blob, { contentType: `image/${ext}`, upsert: true });
  if (uploadErr) return { ok: false, error: uploadErr.message };

  const { data } = supabase.storage.from('photos').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}
