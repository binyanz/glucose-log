import { SectionList, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { formatMgdl, formatMmol, mgdlToMmol } from '../lib/glucose';
import { deleteReading } from '../lib/db';
import { TAG_LABELS, type Reading } from '../lib/types';
import type { Theme } from '../theme';

function dayKey(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function timeOf(ts: number) {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function HistoryScreen({
  theme, readings, onChanged,
}: { theme: Theme; readings: Reading[]; onChanged: () => void }) {
  // readings arrive newest first; group them into day sections preserving that order.
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
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => { await deleteReading(r.id); onChanged(); },
        },
      ],
    );
  }

  if (readings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyTitle, { color: theme.text }]}>No readings yet</Text>
        <Text style={{ color: theme.muted, textAlign: 'center' }}>
          Saved readings appear here, newest first.
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
        <Text style={[styles.section, { color: theme.muted }]}>{section.title.toUpperCase()}</Text>
      )}
      renderItem={({ item }) => (
        <TouchableOpacity
          onLongPress={() => confirmDelete(item)}
          delayLongPress={400}
          accessibilityHint="Long press to delete this reading"
          style={[styles.row, { backgroundColor: theme.glass, borderColor: theme.glassBorder, shadowColor: theme.shadow }]}
        >
          <View style={styles.rowMain}>
            <Text style={[styles.mmol, { color: theme.text }]}>
              {formatMmol(mgdlToMmol(item.mgdl))}
              <Text style={[styles.smallUnit, { color: theme.muted }]}> mmol/L</Text>
            </Text>
            <Text style={[styles.mgdl, { color: theme.muted }]}>
              {formatMgdl(item.mgdl)} mg/dL
            </Text>
          </View>
          <View style={styles.rowMeta}>
            <Text style={[styles.tag, { color: theme.accent }]}>{TAG_LABELS[item.tag]}</Text>
            <Text style={[styles.time, { color: theme.muted }]}>{timeOf(item.takenAt)}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 6 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  section: { fontSize: 10, letterSpacing: 1.6, fontWeight: '700', marginTop: 18, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 20, padding: 16, marginBottom: 9,
    shadowOpacity: 0.10, shadowRadius: 12, shadowOffset: { width: 0, height: 5 },
  },
  rowMain: { gap: 2 },
  rowMeta: { alignItems: 'flex-end', gap: 3 },
  mmol: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.6 },
  smallUnit: { fontSize: 11, fontWeight: '600' },
  mgdl: { fontSize: 12, fontVariant: ['tabular-nums'] },
  tag: { fontSize: 12, fontWeight: '700' },
  time: { fontSize: 12, fontVariant: ['tabular-nums'] },
});
