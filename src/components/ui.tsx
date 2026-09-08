import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import type { Theme } from '../theme';

/**
 * Containers differ by rank instead of every block being an identical rounded
 * card: `sheet` is the printed page that carries the grid, `plain` is a quiet
 * grouping with a rule instead of a box.
 */
export function Sheet({ theme, children, style }: { theme: Theme; children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View style={[s.sheet, { backgroundColor: theme.paper, borderColor: theme.rule }, style]}>
      {children}
    </View>
  );
}

export function Section({
  theme, title, children,
}: { theme: Theme; title?: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      {title ? <Text style={[s.sectionTitle, { color: theme.ink }]}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Chip({
  theme, active, label, onPress,
}: { theme: Theme; active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[s.chip, {
        backgroundColor: active ? theme.accent : 'transparent',
        borderColor: active ? theme.accent : theme.ruleStrong,
      }]}
    >
      <Text style={[s.chipText, { color: active ? theme.onAccent : theme.inkSoft }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Stat({ theme, label, value, unit }: { theme: Theme; label: string; value: string; unit?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValue, { color: theme.ink }]}>
        {value}
        {unit ? <Text style={[s.statUnit, { color: theme.inkFaint }]}>{unit}</Text> : null}
      </Text>
      <Text style={[s.statLabel, { color: theme.inkSoft }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: {
    borderRadius: 8, borderWidth: StyleSheet.hairlineWidth, padding: 14,
    shadowColor: '#3A3357', shadowOpacity: 0.10, shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 }, elevation: 2,
  },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 4, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '500' },
  stat: { minWidth: 70, gap: 1 },
  statValue: { fontSize: 21, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.4 },
  statUnit: { fontSize: 11, fontWeight: '500' },
  statLabel: { fontSize: 11.5 },
});
