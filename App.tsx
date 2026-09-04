import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, useColorScheme, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { CandyBackground, Kitty, Puppy } from './src/components/Mascots';
import { getTarget, listReadings } from './src/lib/db';
import { DEFAULT_TARGET, type Reading, type TargetRange } from './src/lib/types';
import { dark, light } from './src/theme';

type Tab = 'log' | 'history' | 'trends';
const TABS: { key: Tab; label: string; emoji: string }[] = [
  { key: 'log', label: 'Log', emoji: '🐾' },
  { key: 'history', label: 'History', emoji: '📖' },
  { key: 'trends', label: 'Trends', emoji: '🎀' },
];

export default function App() {
  const scheme = useColorScheme();
  const theme = scheme === 'dark' ? dark : light;
  const { width, height } = useWindowDimensions();

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
      <View style={styles.root}>
        <CandyBackground theme={theme} width={width} height={height} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />

          <View style={styles.header}>
            <Kitty size={46} theme={theme} />
            <View style={styles.headerText}>
              <Text style={[styles.title, { color: theme.text }]}>Sugar Diary</Text>
              <Text style={[styles.count, { color: theme.muted }]}>
                {readings.length} reading{readings.length === 1 ? '' : 's'} saved
              </Text>
            </View>
            <Puppy size={46} theme={theme} />
          </View>

          <View style={styles.content}>
            {loading ? (
              <View style={styles.center}><ActivityIndicator color={theme.pink} /></View>
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

          <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.rule }]}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.tab, active && { backgroundColor: theme.chipOn }]}
                  onPress={() => setTab(t.key)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={styles.tabEmoji}>{t.emoji}</Text>
                  <Text style={[styles.tabText, {
                    color: active ? theme.chipOnText : theme.muted,
                    fontWeight: active ? '800' : '600',
                  }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 2, paddingBottom: 8, gap: 8,
  },
  headerText: { flex: 1, alignItems: 'center' },
  title: { fontSize: 25, fontWeight: '800', letterSpacing: -0.3 },
  count: { fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tabs: {
    flexDirection: 'row', borderRadius: 24, borderWidth: 1, padding: 5,
    marginHorizontal: 14, marginBottom: 4, gap: 5,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 19, gap: 1 },
  tabEmoji: { fontSize: 15 },
  tabText: { fontSize: 12.5 },
});
