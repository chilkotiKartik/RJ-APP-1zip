import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { DensityKey } from './tokens';

const KEY_DARK      = 'rj.theme.dark';
const KEY_DENSITY   = 'rj.theme.density';
const KEY_BIOMETRIC = 'rj.theme.biometric';

export type Preferences = { dark: boolean; density: DensityKey; biometric?: boolean };
const DEFAULTS: Preferences = { dark: false, density: 'comfortable', biometric: false };

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, den, bio] = await Promise.all([
        storage.getItem(KEY_DARK),
        storage.getItem(KEY_DENSITY),
        storage.getItem(KEY_BIOMETRIC),
      ]);
      setPrefs({
        dark:      d === '1',
        density:   (den as DensityKey) ?? DEFAULTS.density,
        biometric: bio === '1',
      });
      setLoaded(true);
    })();
  }, []);

  const update = async (next: Partial<Preferences>) => {
    setPrefs(p => ({ ...p, ...next }));
    if (next.dark      !== undefined) await storage.setItem(KEY_DARK,      next.dark      ? '1' : '0');
    if (next.density   !== undefined) await storage.setItem(KEY_DENSITY,   next.density);
    if (next.biometric !== undefined) await storage.setItem(KEY_BIOMETRIC, next.biometric ? '1' : '0');
  };

  return { prefs, loaded, update };
}
