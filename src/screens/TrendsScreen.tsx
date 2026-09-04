import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Chart } from '../components/Chart';
import { Card, Chip, Label, Stat } from '../components/ui';
import { averagesByTag, summarize, withinDays } from '../lib/stats';
import { formatMgdl, formatMmol, mgdlToMmol } from '../lib/glucose';
import { TAGS, TAG_LABELS, type Reading, type TargetRange } from '../lib/types';
import type { Theme } from '../theme';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
];

export function TrendsScreen({
  theme, readings, target,
}: { theme: Theme; readings: Reading[]; target: TargetRange }) {
  const [days, setDays] = useState(90);
  const { width } = useWindowDimensions();

  const inRange = useMemo(() => withinDays(readings, days, Date.now()), [readings, days]);
  const summary = useMemo(() => summarize(inRange, target), [inRange, target]);
  const byTag = useMemo(() => averagesByTag(inRange), [inRange]);

  const both = (mgdl: number | null) =>
    mgdl === null ? '—' : `${formatMmol(mgdlToMmol(mgdl))}`;

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip
            key={r.days} theme={theme} active={days === r.days}
            label={r.label} onPress={() => setDays(r.days)}
          />
        ))}
      </View>

      <Card theme={theme}>
        <Label theme={theme}>TREND · mmol/L</Label>
        <Chart
          readings={inRange} target={target} theme={theme}
          width={width - 32 - 32} height={190}
        />
        <Text style={[styles.caption, { color: theme.muted }]}>
          Line is the daily average. Each dot is one reading; amber dots fall outside
          your target band of {formatMmol(mgdlToMmol(target.lowMgdl))}–
          {formatMmol(mgdlToMmol(target.highMgdl))} mmol/L.
        </Text>
      </Card>

      <Card theme={theme}>
        <Label theme={theme}>SUMMARY</Label>
        <View style={styles.stats}>
          <Stat theme={theme} label="Readings" value={String(summary.count)} />
          <Stat theme={theme} label="Average" value={both(summary.avgMgdl)} unit="mmol/L" />
          <Stat theme={theme} label="Lowest" value={both(summary.minMgdl)} />
          <Stat theme={theme} label="Highest" value={both(summary.maxMgdl)} />
          <Stat
            theme={theme} label="In target"
            value={summary.inRangePct === null ? '—' : `${Math.round(summary.inRangePct)}%`}
          />
        </View>
        {summary.avgMgdl !== null ? (
          <Text style={[styles.caption, { color: theme.muted }]}>
            Average in mg/dL: {formatMgdl(summary.avgMgdl)}
          </Text>
        ) : null}
      </Card>

      <Card theme={theme}>
        <Label theme={theme}>AVERAGE BY TIME OF DAY</Label>
        {TAGS.map((t) => {
          const a = byTag[t];
          return (
            <View key={t} style={[styles.tagRow, { borderColor: theme.rule }]}>
              <Text style={[styles.tagName, { color: theme.text }]}>{TAG_LABELS[t]}</Text>
              <Text style={[styles.tagCount, { color: theme.muted }]}>
                {a.count === 0 ? 'no readings' : `${a.count} reading${a.count === 1 ? '' : 's'}`}
              </Text>
              <Text style={[styles.tagAvg, { color: a.avgMgdl === null ? theme.muted : theme.accent }]}>
                {both(a.avgMgdl)}
              </Text>
            </View>
          );
        })}
        <Text style={[styles.caption, { color: theme.muted }]}>
          A fasting reading and an after-meal reading of the same value mean different
          things, so these are kept apart.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  chips: { flexDirection: 'row', gap: 8 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 18 },
  caption: { fontSize: 11.5, lineHeight: 16 },
  tagRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, borderTopWidth: 1, gap: 10 },
  tagName: { fontSize: 14, fontWeight: '600', flex: 1 },
  tagCount: { fontSize: 11 },
  tagAvg: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'], minWidth: 44, textAlign: 'right' },
});
