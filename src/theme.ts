export type Theme = typeof light;

/**
 * Frosted glass over a soft colour wash. The palette is deliberately desaturated
 * compared with the previous pastel version: glass only reads as glass when the
 * colour sits *behind* it and the card itself stays near-neutral.
 */
export const light = {
  isDark: false,
  base: '#F3F1FA',
  blobRose: '#FFAECE',
  blobSky: '#9BC8FF',
  blobLilac: '#C4B2FF',
  blobMint: '#A8ECD8',

  glass: 'rgba(255,255,255,0.62)',
  glassStrong: 'rgba(255,255,255,0.78)',
  glassBorder: 'rgba(255,255,255,0.85)',
  glassTint: 'light' as 'light' | 'dark',

  text: '#2C2739',
  muted: '#6B6483',
  faint: 'rgba(44,39,57,0.45)',

  accent: '#6F63D8',
  accentSoft: 'rgba(107,91,230,0.14)',
  rose: '#E4568F',
  danger: '#D94A6A',
  warn: '#E08A2E',

  rule: 'rgba(44,39,57,0.10)',
  field: 'rgba(255,255,255,0.5)',
  band: 'rgba(107,91,230,0.10)',
  onAccent: '#FFFFFF',
  shadow: '#6E5F8C',
};

export const dark: Theme = {
  isDark: true,
  base: '#0E0D18',
  blobRose: '#5B2748',
  blobSky: '#1C3A66',
  blobLilac: '#3A2A63',
  blobMint: '#1B4A45',

  glass: 'rgba(255,255,255,0.07)',
  glassStrong: 'rgba(255,255,255,0.11)',
  glassBorder: 'rgba(255,255,255,0.16)',
  glassTint: 'dark',

  text: '#EEEBF7',
  muted: '#A79FC0',
  faint: 'rgba(238,235,247,0.45)',

  accent: '#A99BFF',
  accentSoft: 'rgba(169,155,255,0.18)',
  rose: '#FF8FB8',
  danger: '#FF8098',
  warn: '#F0B45E',

  rule: 'rgba(255,255,255,0.10)',
  field: 'rgba(255,255,255,0.06)',
  band: 'rgba(169,155,255,0.12)',
  onAccent: '#1A1526',
  shadow: '#000000',
};
