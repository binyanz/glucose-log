import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';
import type { Reading, TargetRange } from '../lib/types';
import { mgdlToMmol, formatMmol } from '../lib/glucose';
import type { Theme } from '../theme';

type Props = {
  readings: Reading[];      // oldest first
  target: TargetRange;
  width: number;
  height?: number;
  theme: Theme;
};

const PAD = { left: 34, right: 10, top: 10, bottom: 20 };

export function Chart({ readings, target, width, height = 200, theme }: Props) {
  if (readings.length === 0) {
    return (
      <View style={[styles.empty, { height, borderColor: theme.rule }]}>
        <Text style={{ color: theme.muted, fontSize: 13 }}>No readings in this range yet.</Text>
      </View>
    );
  }

  const plotW = Math.max(1, width - PAD.left - PAD.right);
  const plotH = Math.max(1, height - PAD.top - PAD.bottom);

  const values = readings.map((r) => r.mgdl);
  // Always include the target band in the visible range so it stays meaningful.
  const lo = Math.min(...values, target.lowMgdl) - 10;
  const hi = Math.max(...values, target.highMgdl) + 10;
  const span = Math.max(1, hi - lo);

  const t0 = readings[0].takenAt;
  const t1 = readings[readings.length - 1].takenAt;
  const tSpan = Math.max(1, t1 - t0);

  const x = (t: number) => PAD.left + ((t - t0) / tSpan) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - lo) / span) * plotH;

  // Connecting every reading produces a vertical scribble, because readings
  // alternate between fasting lows and post-meal highs several times a day.
  // The trend line is therefore the daily average; individual readings stay
  // visible as faint dots behind it.
  const byDay = new Map<string, { sum: number; n: number; t: number }>();
  for (const r of readings) {
    const d = new Date(r.takenAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const noon = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12).getTime();
    const cur = byDay.get(key);
    if (cur) { cur.sum += r.mgdl; cur.n += 1; }
    else byDay.set(key, { sum: r.mgdl, n: 1, t: noon });
  }
  const daily = [...byDay.values()]
    .map((d) => ({ t: d.t, avg: d.sum / d.n }))
    .sort((a, b) => a.t - b.t);

  const path = daily
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${x(d.t).toFixed(1)},${y(d.avg).toFixed(1)}`)
    .join(' ');

  const bandTop = y(target.highMgdl);
  const bandBottom = y(target.lowMgdl);

  // Three gridlines: target low, target high, and the midpoint between them.
  const ticks = [target.lowMgdl, Math.round((target.lowMgdl + target.highMgdl) / 2), target.highMgdl];

  return (
    <View>
      <Svg width={width} height={height}>
        <Rect
          x={PAD.left} y={bandTop} width={plotW} height={Math.max(0, bandBottom - bandTop)}
          fill={theme.band}
        />
        {ticks.map((v) => (
          <Line
            key={v} x1={PAD.left} x2={PAD.left + plotW} y1={y(v)} y2={y(v)}
            stroke={theme.rule} strokeWidth={1}
          />
        ))}
        {readings.map((r) => {
          const outside = r.mgdl < target.lowMgdl || r.mgdl > target.highMgdl;
          return (
            <Circle
              key={r.id} cx={x(r.takenAt)} cy={y(r.mgdl)} r={outside ? 2.2 : 1.8}
              fill={outside ? theme.warn : theme.accent}
              opacity={outside ? 0.9 : 0.45}
            />
          );
        })}
        {daily.length > 1 ? (
          <Path d={path} stroke={theme.accent} strokeWidth={2} fill="none"
            strokeLinejoin="round" strokeLinecap="round" />
        ) : null}
      </Svg>
      {/* Axis labels in mmol/L, drawn as RN text so they inherit font scaling. */}
      <View style={[StyleSheet.absoluteFill, { width: PAD.left }]} pointerEvents="none">
        {ticks.map((v) => (
          <Text
            key={v}
            style={[styles.tick, { color: theme.muted, top: y(v) - 6 }]}
            numberOfLines={1}
          >
            {formatMmol(mgdlToMmol(v))}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 10, borderStyle: 'dashed' },
  tick: { position: 'absolute', left: 0, width: 30, textAlign: 'right', fontSize: 9 },
});
