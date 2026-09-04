import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, useColorScheme,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { getTarget, listReadings } from './src/lib/db';
import { DEFAULT_TARGET, type Reading, type TargetRange } from './src/lib/types';
import { dark, light } from './src/theme';

type Tab = 'log' | 'history' | 'trends';
const TABS: { key: Tab; label: string }[] = [
  { key: 'log', label: 'Log' },
  { key: 'history', label: 'History' },
  { key: 'trends', label: 'Trends' },
];

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;

  const [tab, setTab] = useState<Tab>('log');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [target, setTargetState] = useState<TargetRange>(DEFAULT_TARGET);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [rows, t] = await Promise.all([listReadings(), getTarget()]);
      setReadings(rows);
      setTargetState(t);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the database.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Glucose Log</Text>
          <Text style={[styles.count, { color: theme.muted }]}>
            {readings.length} reading{readings.length === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.content}>
          {loading ? (
            <View style={styles.center}><ActivityIndicator color={theme.accent} /></View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={{ color: theme.danger, textAlign: 'center' }}>{error}</Text>
            </View>
          ) : tab === 'log' ? (
            <LogScreen theme={theme} onSaved={refresh} />
          ) : tab === 'history' ? (
            <HistoryScreen theme={theme} readings={readings} onChanged={refresh} />
          ) : (
            <TrendsScreen theme={theme} readings={readings} target={target} />
          )}
        </View>

        <View style={[styles.tabs, { borderColor: theme.rule, backgroundColor: theme.card }]}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => setTab(t.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.key }}
            >
              <Text style={[styles.tabText, {
                color: tab === t.key ? theme.tabActive : theme.muted,
                fontWeight: tab === t.key ? '700' : '500',
              }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 8, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  count: { fontSize: 12, fontVariant: ['tabular-nums'] },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tabs: { flexDirection: 'row', borderTopWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13.5 },
});
