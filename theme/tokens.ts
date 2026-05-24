// RJ-APP/theme/tokens.ts
// Port of rj-primitives.jsx tokens. Source values verbatim from the design bundle.

export type RJColors = {
  bg: string; bgAlt: string; bgCard: string; bgSunken: string;
  ink: string; inkSoft: string; inkMuted: string;
  forest: string; forestDk: string;
  indigo: string; gold: string; goldLight: string; danger: string;
  rule: string; ruleSoft: string; rulePaper: string;
  wax: string; waxDeep: string;
};

export const RJ_LIGHT: RJColors = {
  bg:        '#FBF2E3',
  bgAlt:     '#F4E9CF',
  bgCard:    '#FBF2E3',
  bgSunken:  '#F0E6D0',
  ink:       '#2B2E22',
  inkSoft:   '#5A5847',
  inkMuted:  'rgba(43,46,34,0.55)',
  forest:    '#4E5B45',
  forestDk:  '#3a4534',
  indigo:    '#2A2540',
  gold:      '#B89766',
  goldLight: '#D4B98A',
  danger:    '#8B3A3A',
  rule:      'rgba(78,91,69,0.22)',
  ruleSoft:  'rgba(78,91,69,0.12)',
  rulePaper: 'rgba(78,91,69,0.07)',
  wax:       '#8B3A3A',
  waxDeep:   '#6f2b2b',
};

export const RJ_DARK: RJColors = {
  bg:        '#1A1612',
  bgAlt:     '#221d17',
  bgCard:    '#211c16',
  bgSunken:  '#15110d',
  ink:       '#EFE6CF',
  inkSoft:   '#C9BFA4',
  inkMuted:  'rgba(239,230,207,0.6)',
  forest:    '#8FA48A',
  forestDk:  '#A7BBA1',
  indigo:    '#B0A8D6',
  gold:      '#D4B98A',
  goldLight: '#E5CFA1',
  danger:    '#D88080',
  rule:      'rgba(212,185,138,0.22)',
  ruleSoft:  'rgba(212,185,138,0.10)',
  rulePaper: 'rgba(212,185,138,0.06)',
  wax:       '#9F4040',
  waxDeep:   '#6f2b2b',
};

export const RJ_FONTS = {
  serif:  'CormorantGaramond_400Regular',
  serifI: 'CormorantGaramond_400Regular_Italic',
  body:   'EBGaramond_400Regular',
  bodyI:  'EBGaramond_400Regular_Italic',
  mono:   'JetBrainsMono_400Regular',
  script: 'Caveat_400Regular',
} as const;

export type RJDensity = {
  pad: number; gap: number;
  hero: number; headline: number; body: number; mono: number;
};

export const RJ_DENSITY: Record<'compact' | 'comfortable' | 'spacious', RJDensity> = {
  compact:     { pad: 16, gap: 12, hero: 36, headline: 22, body: 14, mono: 8 },
  comfortable: { pad: 20, gap: 16, hero: 44, headline: 26, body: 15, mono: 9 },
  spacious:    { pad: 24, gap: 20, hero: 52, headline: 30, body: 16, mono: 10 },
};

export type DensityKey = keyof typeof RJ_DENSITY;
