import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import type { DensityKey } from './tokens';

const KEY_DARK = 'rj.theme.dark';
const KEY_DENSITY = 'rj.theme.density';

export type Preferences = { dark: boolean; density: DensityKey };
const DEFAULTS: Preferences = { dark: false, density: 'comfortable' };

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [d, den] = await Promise.all([
        storage.getItem(KEY_DARK),
        storage.getItem(KEY_DENSITY),
      ]);
      setPrefs({
        dark: d === '1',
        density: (den as DensityKey) ?? DEFAULTS.density,
      });
      setLoaded(true);
    })();
  }, []);

  const update = async (next: Partial<Preferences>) => {
    setPrefs(p => ({ ...p, ...next }));
    if (next.dark !== undefined) await storage.setItem(KEY_DARK, next.dark ? '1' : '0');
    if (next.density !== undefined) await storage.setItem(KEY_DENSITY, next.density);
  };

  return { prefs, loaded, update };
}
