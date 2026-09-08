import { StyleSheet, Text, View } from 'react-native';
import { formatMmol, mgdlToMmol } from '../lib/glucose';
import { TAGS, type Tag, type TargetRange } from '../lib/types';
import type { Row } from '../lib/logbook';
import { cellColor, cellTextColor, type Theme } from '../theme';

const SHORT: Record<Tag, string> = {
  fasting: 'Fast',
  pre_meal: 'Pre',
  post_meal: 'Post',
  bedtime: 'Bed',
  random: 'Any',
};

type Props = {
  rows: Row[];
  columnAvgs: Record<Tag, number | null>;
  target: TargetRange;
  theme: Theme;
  labelWidth?: number;
};

export function Logbook({ rows, columnAvgs, target, theme, labelWidth = 52 }: Props) {
  const compact = rows.length > 40;

  return (
    <View>
      {/* column headings */}
      <View style={[styles.headRow, { borderBottomColor: theme.ruleStrong }]}>
        <View style={{ width: labelWidth }} />
        {TAGS.map((t) => (
          <Text key={t} style={[styles.head, { color: theme.inkSoft }]} numberOfLines={1}>
            {SHORT[t]}
          </Text>
        ))}
      </View>

      {/* Each column's average, directly under its heading. This is the payoff of
          the grid and has to be visible without scrolling past every row. */}
      <View style={[styles.avgRow, { borderBottomColor: theme.ruleStrong }]}>
        <Text style={[styles.avgLabel, { color: theme.inkFaint, width: labelWidth }]}>average</Text>
        {TAGS.map((t) => {
          const v = columnAvgs[t];
          return (
            <Text key={t} style={[styles.avgValue, { color: v === null ? theme.inkFaint : theme.ink }]}>
              {v === null ? '·' : formatMmol(mgdlToMmol(v))}
            </Text>
          );
        })}
      </View>

      {rows.map((row) => (
        <View key={row.key} style={[styles.row, { borderBottomColor: theme.rule }]}>
          <View style={{ width: labelWidth }}>
            <Text style={[styles.dayLabel, { color: theme.inkSoft }, compact && styles.dayLabelSm]}>
              {row.label}
            </Text>
            {row.sublabel && !compact ? (
              <Text style={[styles.daySub, { color: theme.inkFaint }]}>{row.sublabel}</Text>
            ) : null}
          </View>

          {TAGS.map((t) => {
            const cell = row.cells[t];
            if (cell.avg === null) {
              return (
                <View key={t} style={[styles.cellWrap, compact && styles.cellWrapSm]}>
                  <View style={[styles.cellEmpty, { borderColor: theme.rule }]} />
                </View>
              );
            }
            const bg = cellColor(cell.avg, target.lowMgdl, target.highMgdl, theme.isDark);
            const fg = cellTextColor(cell.avg, target.lowMgdl, target.highMgdl, theme.isDark);
            return (
              <View key={t} style={[styles.cellWrap, compact && styles.cellWrapSm]}>
                <View style={[styles.cell, { backgroundColor: bg }]}>
                  {!compact ? (
                    <Text style={[styles.cellText, { color: fg }]}>
                      {formatMmol(mgdlToMmol(cell.avg))}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      ))}

    </View>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 6, borderBottomWidth: 1 },
  head: { flex: 1, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 3 },
  dayLabel: { fontSize: 11.5, fontVariant: ['tabular-nums'], fontWeight: '500' },
  dayLabelSm: { fontSize: 10 },
  daySub: { fontSize: 9, marginTop: -1 },
  cellWrap: { flex: 1, paddingHorizontal: 2, paddingVertical: 2 },
  cellWrapSm: { paddingVertical: 1 },
  cell: { height: 26, borderRadius: 3, alignItems: 'center', justifyContent: 'center' },
  cellEmpty: { height: 26, borderRadius: 3, borderWidth: StyleSheet.hairlineWidth, borderStyle: 'dashed' },
  cellText: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  avgRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 8, paddingTop: 6 },
  avgLabel: { fontSize: 10.5 },
  avgValue: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
});
