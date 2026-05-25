import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode as decodeBase64 } from 'base64-arraybuffer';
import { supabase } from './supabase';

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

// Upload pattern for React Native + Supabase Storage:
// fetch(localUri).blob() is unreliable on RN (especially Android) — the
// blob comes back empty or the fetch fails outright. The supported path is
// to read the file as base64 with expo-file-system, decode to an
// ArrayBuffer, and hand that to the storage client.
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
  const ext = (asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg').replace(/[^a-z0-9]/g, '') || 'jpg';
  const contentType = asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  const path = `${userId}/${Date.now()}-${slot}.${ext}`;

  try {
    const base64 = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const arrayBuffer = decodeBase64(base64);

    const { error: uploadErr } = await supabase
      .storage
      .from('photos')
      .upload(path, arrayBuffer, { contentType, upsert: true });
    if (uploadErr) return { ok: false, error: uploadErr.message };

    const { data } = supabase.storage.from('photos').getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Upload failed' };
  }
}
