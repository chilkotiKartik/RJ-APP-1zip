// RJ-APP/lib/storage.ts
// Cross-platform key/value storage. expo-secure-store is native-only; on
// web it throws because the underlying ExpoSecureStore native module isn't
// linked. We fall back to localStorage on web — fine for dev/Expo Web; in
// a real PWA you'd want a more deliberate strategy.
import { Platform } from 'react-native';

type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

let impl: Storage;

if (Platform.OS === 'web') {
  impl = {
    getItem: async (k) => {
      try { return globalThis.localStorage?.getItem(k) ?? null; } catch { return null; }
    },
    setItem: async (k, v) => {
      try { globalThis.localStorage?.setItem(k, v); } catch { /* quota exceeded etc. */ }
    },
    removeItem: async (k) => {
      try { globalThis.localStorage?.removeItem(k); } catch { /* noop */ }
    },
  };
} else {
  // Lazy require so web bundles don't try to resolve native-only modules.
  const SecureStore = require('expo-secure-store');
  impl = {
    getItem: (k) => SecureStore.getItemAsync(k),
    setItem: (k, v) => SecureStore.setItemAsync(k, v),
    removeItem: (k) => SecureStore.deleteItemAsync(k),
  };
}

export const storage = impl;
