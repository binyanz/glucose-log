import Svg, { Defs, Ellipse, Rect, RadialGradient, Stop } from 'react-native-svg';
import type { Theme } from '../theme';

/**
 * Soft colour wash built from overlapping radial blobs. This lives *behind* the
 * blurred cards, so the blur has something worth blurring - a flat background
 * would make the glass look like plain translucent grey.
 */
export function Backdrop({ theme, width, height }: { theme: Theme; width: number; height: number }) {
  // Kept to the corners and tighter than full-width: overlapping wide blobs
  // average out into a flat grey-mauve through the middle of the screen.
  const blobs = [
    { c: theme.blobSky, cx: -0.05, cy: -0.02, rx: 0.72, ry: 0.24, o: theme.isDark ? 0.9 : 1 },
    { c: theme.blobRose, cx: 1.02, cy: 0.14, rx: 0.66, ry: 0.22, o: theme.isDark ? 0.85 : 0.95 },
    { c: theme.blobLilac, cx: -0.08, cy: 0.55, rx: 0.7, ry: 0.26, o: theme.isDark ? 0.85 : 0.9 },
    { c: theme.blobMint, cx: 1.05, cy: 0.97, rx: 0.7, ry: 0.26, o: theme.isDark ? 0.7 : 0.8 },
    { c: theme.blobRose, cx: 0.5, cy: 1.06, rx: 0.6, ry: 0.18, o: theme.isDark ? 0.5 : 0.5 },
  ];

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Defs>
        {blobs.map((b, i) => (
          <RadialGradient key={i} id={`b${i}`} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={b.c} stopOpacity={b.o} />
            <Stop offset="55%" stopColor={b.c} stopOpacity={b.o * 0.5} />
            <Stop offset="100%" stopColor={b.c} stopOpacity={0} />
          </RadialGradient>
        ))}
      </Defs>
      <Rect x={0} y={0} width={width} height={height} fill={theme.base} />
      {blobs.map((b, i) => (
        <Ellipse
          key={i}
          cx={width * b.cx} cy={height * b.cy}
          rx={width * b.rx} ry={height * b.ry}
          fill={`url(#b${i})`}
        />
      ))}
    </Svg>
  );
}
