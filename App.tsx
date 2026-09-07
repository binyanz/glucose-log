import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, StatusBar, StyleSheet, Text,
  TouchableOpacity, View, useColorScheme, useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LogScreen } from './src/screens/LogScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { TrendsScreen } from './src/screens/TrendsScreen';
import { Backdrop } from './src/components/Backdrop';
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
      <View style={[styles.root, { backgroundColor: theme.base }]}>
        <Backdrop theme={theme} width={width} height={height} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Sugar Diary</Text>
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

          <View style={[styles.tabsWrap, { shadowColor: theme.shadow }]}>
            <BlurView intensity={theme.isDark ? 48 : 40} tint={theme.glassTint} style={StyleSheet.absoluteFill} />
            <View style={[StyleSheet.absoluteFill, styles.tabsSkin, {
              backgroundColor: theme.glass, borderColor: theme.glassBorder,
            }]} />
            <View style={styles.tabs}>
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <TouchableOpacity
                    key={t.key}
                    style={[styles.tab, active && { backgroundColor: theme.accent }]}
                    onPress={() => setTab(t.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabText, {
                      color: active ? theme.onAccent : theme.muted,
                      fontWeight: active ? '700' : '600',
                    }]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingHorizontal: 22, paddingTop: 6, paddingBottom: 12,
  },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.6 },
  count: { fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
  content: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  tabsWrap: {
    marginHorizontal: 18, marginBottom: 6, borderRadius: 22, overflow: 'hidden',
    shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
  },
  tabsSkin: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth * 2 },
  tabs: { flexDirection: 'row', padding: 5, gap: 5 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 17 },
  tabText: { fontSize: 13, letterSpacing: 0.2 },
});
