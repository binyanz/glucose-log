export type Theme = typeof light;

/**
 * Candy palette: baby blue at the top of the screen melting into baby pink at
 * the bottom. Numbers still have to be readable at a glance, so text stays a
 * soft plum-navy rather than pastel, and the pastels carry the mood instead.
 */
export const light = {
  bgTop: '#DCF0FF',      // baby blue
  bgBottom: '#FFE1EC',   // baby pink
  card: '#FFFFFF',
  cardAlt: '#FFF7FB',
  text: '#463C57',
  muted: '#948AA8',
  pink: '#FF7FA8',
  blue: '#4FAFE0',
  accent: '#4FAFE0',
  danger: '#F0607F',
  warn: '#FFA24C',
  rule: '#F1E6EE',
  field: '#FBF7FC',
  band: 'rgba(79,175,224,0.14)',
  chipOn: '#FF7FA8',
  chipOnText: '#FFFFFF',
  tabActive: '#FF7FA8',
  shadow: '#C9A9BC',
};

export const dark: Theme = {
  bgTop: '#232037',
  bgBottom: '#33253A',
  card: '#332C46',
  cardAlt: '#3A3050',
  text: '#F6EEF8',
  muted: '#B6A8C8',
  pink: '#FF9EC4',
  blue: '#82D2F5',
  accent: '#82D2F5',
  danger: '#FF8FA6',
  warn: '#FFC078',
  rule: '#453B5C',
  field: '#2C2540',
  band: 'rgba(130,210,245,0.16)',
  chipOn: '#FF9EC4',
  chipOnText: '#3A1F2C',
  tabActive: '#FF9EC4',
  shadow: '#000000',
};
