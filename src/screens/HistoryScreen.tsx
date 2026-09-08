import { Alert, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatMgdl, formatMmol, mgdlToMmol } from '../lib/glucose';
import { deleteReading } from '../lib/db';
import { TAG_LABELS, type Reading, type TargetRange } from '../lib/types';
import { cellColor, type Theme } from '../theme';

const dayKey = (ts: number) =>
  new Date(ts).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const timeOf = (ts: number) =>
  new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export function HistoryScreen({
  theme, readings, target, onChanged,
}: { theme: Theme; readings: Reading[]; target: TargetRange; onChanged: () => void }) {
  const sections: { title: string; data: Reading[] }[] = [];
  for (const r of readings) {
    const key = dayKey(r.takenAt);
    const last = sections[sections.length - 1];
    if (last && last.title === key) last.data.push(r);
    else sections.push({ title: key, data: [r] });
  }

  function confirmDelete(r: Reading) {
    Alert.alert(
      'Delete this reading?',
      `${formatMgdl(r.mgdl)} mg/dL on ${dayKey(r.takenAt)} at ${timeOf(r.takenAt)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await deleteReading(r.id); onChanged(); } },
      ],
    );
  }

  if (readings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: theme.ink }]}>The page is blank</Text>
        <Text style={{ color: theme.inkSoft, textAlign: 'center', lineHeight: 20 }}>
          Every reading you save is listed here, newest first, and fills in a square on the logbook.
        </Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(r) => String(r.id)}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      stickySectionHeadersEnabled={false}
      renderSectionHeader={({ section }) => (
        <Text style={[styles.section, { color: theme.ink, borderBottomColor: theme.ruleStrong }]}>
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          onLongPress={() => confirmDelete(item)}
          delayLongPress={400}
          accessibilityHint="Long press to delete this reading"
          style={[styles.row, { borderBottomColor: theme.rule }]}
        >
          <View
            style={[styles.swatch, {
              backgroundColor: cellColor(item.mgdl, target.lowMgdl, target.highMgdl, theme.isDark),
              borderColor: theme.rule,
            }]}
          />
          <Text style={[styles.mmol, { color: theme.ink }]}>{formatMmol(mgdlToMmol(item.mgdl))}</Text>
          <Text style={[styles.mgdl, { color: theme.inkFaint }]}>{formatMgdl(item.mgdl)} mg/dL</Text>
          <Text style={[styles.tag, { color: theme.inkSoft }]}>{TAG_LABELS[item.tag]}</Text>
          <Text style={[styles.time, { color: theme.inkFaint }]}>{timeOf(item.takenAt)}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '600' },
  section: { fontSize: 13, fontWeight: '600', marginTop: 22, marginBottom: 4, paddingBottom: 6, borderBottomWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, gap: 10 },
  swatch: { width: 12, height: 22, borderRadius: 2, borderWidth: StyleSheet.hairlineWidth },
  mmol: { fontSize: 17, fontWeight: '600', fontVariant: ['tabular-nums'], width: 44 },
  mgdl: { fontSize: 12, fontVariant: ['tabular-nums'], width: 74 },
  tag: { fontSize: 13, flex: 1 },
  time: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
