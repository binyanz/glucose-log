export type Theme = typeof light;

/**
 * Modelled on the paper logbook a clinic hands out: a printed grid on white,
 * read across the columns. Colour appears in exactly one place - the grid cells,
 * where it encodes glucose level - and nowhere as decoration.
 */
export const light = {
  isDark: false,
  paper: '#FFFFFF',
  page: '#F4F5F7',
  ink: '#191C20',
  inkSoft: '#5A6270',
  inkFaint: '#8D96A3',
  rule: '#DEE3E8',
  ruleStrong: '#C3CAD3',
  accent: '#2F5FD0',
  accentSoft: '#E8EEFB',
  onAccent: '#FFFFFF',
  danger: '#B3261E',
  cellEmpty: '#FFFFFF',
};

export const dark: Theme = {
  isDark: true,
  paper: '#15181C',
  page: '#0D0F12',
  ink: '#E8EBEF',
  inkSoft: '#A0A9B5',
  inkFaint: '#6E7885',
  rule: '#2A2F36',
  ruleStrong: '#3B424B',
  accent: '#7BA0F5',
  accentSoft: '#1B2436',
  onAccent: '#0D0F12',
  danger: '#F2837B',
  cellEmpty: '#15181C',
};

/* ---- the diverging scale used by the grid ---------------------------------
 * Low and high both matter, so the scale runs blue -> near-paper -> amber -> red
 * rather than a single-direction ramp. Stops are anchored to the user's own
 * target range so the pale middle always means "where you want to be".
 */
type Stop = { at: number; rgb: [number, number, number] };

function stopsFor(low: number, high: number, isDark: boolean): Stop[] {
  const mid = (low + high) / 2;
  return isDark
    ? [
        { at: low - 25, rgb: [58, 110, 214] },
        { at: low, rgb: [72, 108, 168] },
        { at: mid, rgb: [40, 56, 62] },
        { at: high, rgb: [150, 108, 46] },
        { at: high + 70, rgb: [186, 96, 40] },
        { at: high + 170, rgb: [176, 58, 46] },
      ]
    : [
        { at: low - 25, rgb: [46, 95, 203] },
        { at: low, rgb: [157, 187, 238] },
        { at: mid, rgb: [237, 242, 237] },
        { at: high, rgb: [245, 206, 122] },
        { at: high + 70, rgb: [217, 130, 43] },
        { at: high + 170, rgb: [176, 58, 46] },
      ];
}

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

export function cellColor(mgdl: number, low: number, high: number, isDark: boolean): string {
  const stops = stopsFor(low, high, isDark);
  if (mgdl <= stops[0].at) return rgb(stops[0].rgb);
  const last = stops[stops.length - 1];
  if (mgdl >= last.at) return rgb(last.rgb);
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i], b = stops[i + 1];
    if (mgdl >= a.at && mgdl <= b.at) {
      const t = clamp01((mgdl - a.at) / (b.at - a.at));
      return rgb([
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * t),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * t),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * t),
      ]);
    }
  }
  return rgb(stops[2].rgb);
}

/** Cells get dark enough at the extremes that black text stops working. */
export function cellTextColor(mgdl: number, low: number, high: number, isDark: boolean): string {
  const outLow = mgdl < low - 12;
  const outHigh = mgdl > high + 55;
  if (outLow || outHigh) return '#FFFFFF';
  return isDark ? '#E8EBEF' : '#191C20';
}

const rgb = (c: [number, number, number]) => `rgb(${c[0]},${c[1]},${c[2]})`;
