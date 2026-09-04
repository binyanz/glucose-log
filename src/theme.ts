export type Theme = typeof light;

export const light = {
  bg: '#F2F4F7', card: '#FFFFFF', text: '#12151A', muted: '#697586',
  accent: '#0F766E', danger: '#B42318', warn: '#B54708',
  rule: '#E3E8EF', field: '#F8FAFC', band: 'rgba(15,118,110,0.10)',
  chipOn: '#0F766E', chipOnText: '#FFFFFF', tabActive: '#0F766E',
};

export const dark: Theme = {
  bg: '#0D1117', card: '#161B22', text: '#E9EDF2', muted: '#8B98A8',
  accent: '#2DD4BF', danger: '#FF7B72', warn: '#E3A008',
  rule: '#252C36', field: '#0D1117', band: 'rgba(45,212,191,0.12)',
  chipOn: '#2DD4BF', chipOnText: '#06201C', tabActive: '#2DD4BF',
};
