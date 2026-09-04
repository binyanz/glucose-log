import Svg, { Circle, Ellipse, G, Path, Polygon } from 'react-native-svg';
import type { Theme } from '../theme';

type Props = { size?: number; theme: Theme };

/** A kitten, drawn as vectors so it stays crisp and needs no image assets. */
export function Kitty({ size = 64, theme }: Props) {
  const fur = theme.pink;
  const inner = '#FFD3E2';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* ears */}
        <Polygon points="20,40 26,10 48,28" fill={fur} />
        <Polygon points="80,40 74,10 52,28" fill={fur} />
        <Polygon points="26,36 29,19 42,30" fill={inner} />
        <Polygon points="74,36 71,19 58,30" fill={inner} />
        {/* head */}
        <Circle cx="50" cy="56" r="32" fill={fur} />
        {/* blush */}
        <Ellipse cx="30" cy="63" rx="7" ry="4.5" fill="#FFFFFF" opacity={0.45} />
        <Ellipse cx="70" cy="63" rx="7" ry="4.5" fill="#FFFFFF" opacity={0.45} />
        {/* eyes */}
        <Ellipse cx="39" cy="52" rx="4" ry="5" fill="#4A3A52" />
        <Ellipse cx="61" cy="52" rx="4" ry="5" fill="#4A3A52" />
        <Circle cx="40.4" cy="50" r="1.5" fill="#FFFFFF" />
        <Circle cx="62.4" cy="50" r="1.5" fill="#FFFFFF" />
        {/* nose + smile */}
        <Path d="M46 62 L54 62 L50 66 Z" fill="#FFFFFF" />
        <Path d="M50 66 q-5 6 -10 1" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <Path d="M50 66 q5 6 10 1" stroke="#FFFFFF" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* whiskers */}
        <Path d="M20 58 L33 60 M20 66 L33 65" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity={0.8} />
        <Path d="M80 58 L67 60 M80 66 L67 65" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" opacity={0.8} />
      </G>
    </Svg>
  );
}

/** A puppy with floppy ears, same treatment. */
export function Puppy({ size = 64, theme }: Props) {
  const fur = theme.blue;
  const light = '#D8F0FF';
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <G>
        {/* floppy ears */}
        <Ellipse cx="20" cy="56" rx="12" ry="22" fill={fur} />
        <Ellipse cx="80" cy="56" rx="12" ry="22" fill={fur} />
        <Ellipse cx="20" cy="58" rx="6" ry="14" fill={light} opacity={0.55} />
        <Ellipse cx="80" cy="58" rx="6" ry="14" fill={light} opacity={0.55} />
        {/* head */}
        <Circle cx="50" cy="52" r="30" fill={fur} />
        {/* muzzle */}
        <Ellipse cx="50" cy="66" rx="18" ry="13" fill={light} />
        {/* eyes */}
        <Ellipse cx="40" cy="45" rx="4" ry="5" fill="#3A4A57" />
        <Ellipse cx="60" cy="45" rx="4" ry="5" fill="#3A4A57" />
        <Circle cx="41.4" cy="43" r="1.5" fill="#FFFFFF" />
        <Circle cx="61.4" cy="43" r="1.5" fill="#FFFFFF" />
        {/* nose + mouth */}
        <Ellipse cx="50" cy="60" rx="5.5" ry="4" fill="#4A3A52" />
        <Path d="M50 64 L50 69" stroke="#4A3A52" strokeWidth="2" strokeLinecap="round" />
        <Path d="M50 69 q-6 5 -9 0" stroke="#4A3A52" strokeWidth="2" fill="none" strokeLinecap="round" />
        <Path d="M50 69 q6 5 9 0" stroke="#4A3A52" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* tongue */}
        <Path d="M45 73 q5 8 10 0 z" fill={theme.pink} />
      </G>
    </Svg>
  );
}

/** Full-bleed pastel wash used behind every screen. */
export function CandyBackground({ theme, width, height }: { theme: Theme; width: number; height: number }) {
  return (
    <Svg width={width} height={height} style={{ position: 'absolute', top: 0, left: 0 }}>
      <Path d={`M0 0 H${width} V${height} H0 Z`} fill={theme.bgTop} />
      <Path d={`M0 ${height * 0.32} H${width} V${height} H0 Z`} fill={theme.bgBottom} opacity={0.55} />
      <Path
        d={`M0 ${height * 0.3} Q${width * 0.5} ${height * 0.22} ${width} ${height * 0.34} V${height} H0 Z`}
        fill={theme.bgBottom}
      />
    </Svg>
  );
}
