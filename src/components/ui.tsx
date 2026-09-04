import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import type { Theme } from '../theme';

export function Card({ theme, children, style }: any) {
  return (
    <View style={[s.card, { backgroundColor: theme.card, borderColor: theme.rule }, style]}>
      {children}
    </View>
  );
}

export function Label({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return <Text style={[s.label, { color: theme.muted }]}>{children}</Text>;
}

export function Chip({
  theme, active, label, onPress, small,
}: { theme: Theme; active: boolean; label: string; onPress: () => void; small?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        s.chip,
        small && s.chipSmall,
        {
          backgroundColor: active ? theme.chipOn : 'transparent',
          borderColor: active ? theme.chipOn : theme.rule,
        },
      ]}
    >
      <Text style={[s.chipText, small && s.chipTextSmall, { color: active ? theme.chipOnText : theme.muted }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Stat({ theme, label, value, unit }: { theme: Theme; label: string; value: string; unit?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statLabel, { color: theme.muted }]}>{label}</Text>
      <Text style={[s.statValue, { color: theme.text }]}>
        {value}
        {unit ? <Text style={[s.statUnit, { color: theme.muted }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.3, fontWeight: '600' },
  chip: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  chipTextSmall: { fontSize: 11.5 },
  stat: { minWidth: 74, gap: 2 },
  statLabel: { fontSize: 10, letterSpacing: 0.8, fontWeight: '600', textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statUnit: { fontSize: 11, fontWeight: '600' },
});
