import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Chip, Section, Sheet, Stat } from '../components/ui';
import { Logbook } from '../components/Logbook';
import { Chart } from '../components/Chart';
import { columnAverages, dailyRows, weeklyRows } from '../lib/logbook';
import { summarize, withinDays } from '../lib/stats';
import { formatMgdl, formatMmol, mgdlToMmol } from '../lib/glucose';
import type { Reading, TargetRange } from '../lib/types';
import { cellColor, type Theme } from '../theme';

const RANGES = [
  { days: 7, label: '7 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
];

export function TrendsScreen({
  theme, readings, target,
}: { theme: Theme; readings: Reading[]; target: TargetRange }) {
  const [days, setDays] = useState(30);
  const now = Date.now();
  const { width } = useWindowDimensions();

  const inRange = useMemo(() => withinDays(readings, days, now), [readings, days, now]);
  const rows = useMemo(
    () => (days > 30 ? weeklyRows(inRange, Math.ceil(days / 7), now) : dailyRows(inRange, days, now)),
    [inRange, days, now],
  );
  const colAvgs = useMemo(() => columnAverages(rows), [rows]);
  const summary = useMemo(() => summarize(inRange, target), [inRange, target]);

  const scaleStops = [target.lowMgdl - 20, target.lowMgdl, (target.lowMgdl + target.highMgdl) / 2,
    target.highMgdl, target.highMgdl + 70, target.highMgdl + 150];

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <View style={styles.chips}>
        {RANGES.map((r) => (
          <Chip key={r.days} theme={theme} active={days === r.days} label={r.label} onPress={() => setDays(r.days)} />
        ))}
      </View>

      <Section theme={theme} title="At a glance">
        <Sheet theme={theme}>
          <Chart readings={inRange} target={target} theme={theme} width={width - 32 - 28} height={170} />
        </Sheet>
        <Text style={[styles.note, { color: theme.inkFaint }]}>
          The line is each day's average; every dot is one reading. Amber dots sit outside
          your target band.
        </Text>
      </Section>

      <Section theme={theme} title={days > 30 ? 'Logbook, by week' : 'Logbook'}>
        <Sheet theme={theme}>
          <Logbook rows={rows} columnAvgs={colAvgs} target={target} theme={theme} />
        </Sheet>

        <View style={styles.legend}>
          <Text style={[styles.legendText, { color: theme.inkFaint }]}>low</Text>
          <View style={styles.swatches}>
            {scaleStops.map((v, i) => (
              <View
                key={i}
                style={[styles.swatch, {
                  backgroundColor: cellColor(v, target.lowMgdl, target.highMgdl, theme.isDark),
                  borderColor: theme.rule,
                }]}
              />
            ))}
          </View>
          <Text style={[styles.legendText, { color: theme.inkFaint }]}>high</Text>
          <Text style={[styles.legendNote, { color: theme.inkFaint }]}>
            dashed = not measured
          </Text>
        </View>
      </Section>

      <Section theme={theme} title="Summary">
        <View style={styles.stats}>
          <Stat theme={theme} label="readings" value={String(summary.count)} />
          <Stat theme={theme} label="average"
            value={summary.avgMgdl === null ? '—' : formatMmol(mgdlToMmol(summary.avgMgdl))} unit=" mmol/L" />
          <Stat theme={theme} label="lowest"
            value={summary.minMgdl === null ? '—' : formatMmol(mgdlToMmol(summary.minMgdl))} />
          <Stat theme={theme} label="highest"
            value={summary.maxMgdl === null ? '—' : formatMmol(mgdlToMmol(summary.maxMgdl))} />
          <Stat theme={theme} label="in target"
            value={summary.inRangePct === null ? '—' : `${Math.round(summary.inRangePct)}%`} />
        </View>
        {summary.avgMgdl !== null ? (
          <Text style={[styles.note, { color: theme.inkFaint }]}>
            Average in mg/dL is {formatMgdl(summary.avgMgdl)}. Your target range is{' '}
            {formatMmol(mgdlToMmol(target.lowMgdl))}–{formatMmol(mgdlToMmol(target.highMgdl))} mmol/L,
            which you set yourself.
          </Text>
        ) : null}
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 24, paddingBottom: 40 },
  chips: { flexDirection: 'row', gap: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  legendText: { fontSize: 11 },
  swatches: { flexDirection: 'row', gap: 2 },
  swatch: { width: 22, height: 12, borderRadius: 2, borderWidth: StyleSheet.hairlineWidth },
  legendNote: { fontSize: 11, marginLeft: 'auto' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 14, columnGap: 22 },
  note: { fontSize: 12, lineHeight: 17 },
});
