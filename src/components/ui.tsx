import { BlurView } from 'expo-blur';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import type { Theme } from '../theme';

/**
 * A frosted pane: real native blur, a translucent wash on top to lift it off the
 * background, and a bright hairline border that reads as the lit edge of glass.
 */
export function Glass({
  theme, children, style, strong,
}: { theme: Theme; children: React.ReactNode; style?: ViewStyle; strong?: boolean }) {
  return (
    <View style={[s.glassWrap, { shadowColor: theme.shadow }, style]}>
      <BlurView intensity={theme.isDark ? 42 : 34} tint={theme.glassTint} style={StyleSheet.absoluteFill} />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? theme.glassStrong : theme.glass, borderColor: theme.glassBorder },
          s.glassSkin,
        ]}
      />
      <View style={[s.topEdge, { backgroundColor: theme.glassBorder }]} />
      <View style={s.glassInner}>{children}</View>
    </View>
  );
}

export function Label({ theme, children }: { theme: Theme; children: React.ReactNode }) {
  return <Text style={[s.label, { color: theme.muted }]}>{children}</Text>;
}

export function Chip({
  theme, active, label, onPress,
}: { theme: Theme; active: boolean; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        s.chip,
        {
          backgroundColor: active ? theme.accent : theme.field,
          borderColor: active ? theme.accent : theme.glassBorder,
        },
      ]}
    >
      <Text style={[s.chipText, { color: active ? theme.onAccent : theme.muted }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Stat({ theme, label, value, unit }: { theme: Theme; label: string; value: string; unit?: string }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statLabel, { color: theme.faint }]}>{label}</Text>
      <Text style={[s.statValue, { color: theme.text }]}>
        {value}
        {unit ? <Text style={[s.statUnit, { color: theme.muted }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  glassWrap: {
    borderRadius: 26, overflow: 'hidden',
    shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 4,
  },
  glassSkin: { borderRadius: 26, borderWidth: StyleSheet.hairlineWidth * 2 },
  topEdge: { position: 'absolute', top: 0, left: 22, right: 22, height: 1, opacity: 0.9 },
  glassInner: { padding: 20, gap: 12 },
  label: { fontSize: 10.5, letterSpacing: 1.6, fontWeight: '700', textTransform: 'uppercase' },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth * 2 },
  chipText: { fontSize: 12.5, fontWeight: '600' },
  stat: { minWidth: 76, gap: 3 },
  statLabel: { fontSize: 9.5, letterSpacing: 1.1, fontWeight: '700', textTransform: 'uppercase' },
  statValue: { fontSize: 22, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -0.5 },
  statUnit: { fontSize: 11, fontWeight: '600' },
});
