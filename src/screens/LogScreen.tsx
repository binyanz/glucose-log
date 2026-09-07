import { useMemo, useState } from 'react';
import {
  Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { formatMmol, mgdlToMmol, parseMgdl } from '../lib/glucose';
import { addReading } from '../lib/db';
import { TAGS, TAG_LABELS, type Tag } from '../lib/types';
import { Chip, Glass, Label } from '../components/ui';
import type { Theme } from '../theme';

export function LogScreen({ theme, onSaved }: { theme: Theme; onSaved: () => void }) {
  const [input, setInput] = useState('');
  const [tag, setTag] = useState<Tag>('fasting');
  const [saved, setSaved] = useState<string | null>(null);

  const { mmol, error } = useMemo(() => {
    if (input.trim() === '') return { mmol: null, error: null };
    const parsed = parseMgdl(input);
    return parsed.ok
      ? { mmol: mgdlToMmol(parsed.mgdl), error: null }
      : { mmol: null, error: parsed.error };
  }, [input]);

  const canSave = mmol !== null;

  async function save() {
    const parsed = parseMgdl(input);
    if (!parsed.ok) return;
    await addReading(parsed.mgdl, Date.now(), tag, null);
    setSaved(`Saved · ${formatMmol(mgdlToMmol(parsed.mgdl))} mmol/L`);
    setInput('');
    Keyboard.dismiss();
    onSaved();
    setTimeout(() => setSaved(null), 2400);
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Glass theme={theme} strong>
        <Label theme={theme}>Meter reading</Label>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, {
              color: theme.text, backgroundColor: theme.field,
              borderColor: error ? theme.danger : theme.glassBorder,
            }]}
            value={input}
            onChangeText={setInput}
            placeholder="145"
            placeholderTextColor={theme.faint}
            keyboardType="decimal-pad"
            returnKeyType="done"
            maxLength={6}
            accessibilityLabel="Blood glucose reading in milligrams per deciliter"
          />
          <Text style={[styles.unit, { color: theme.muted }]}>mg/dL</Text>
        </View>

        <View style={[styles.hairline, { backgroundColor: theme.rule }]} />

        <Label theme={theme}>Converted</Label>
        <View style={styles.resultRow}>
          <Text style={[styles.result, { color: mmol === null ? theme.faint : theme.accent }]}>
            {mmol === null ? '—' : formatMmol(mmol)}
          </Text>
          <Text style={[styles.unitBig, { color: theme.muted }]}>mmol/L</Text>
        </View>
      </Glass>

      <Text style={[styles.hint, { color: error ? theme.danger : theme.muted }]}>
        {error ?? 'Enter the value your meter shows.'}
      </Text>

      <Glass theme={theme}>
        <Label theme={theme}>When was it taken</Label>
        <View style={styles.chips}>
          {TAGS.map((t) => (
            <Chip key={t} theme={theme} active={tag === t} label={TAG_LABELS[t]} onPress={() => setTag(t)} />
          ))}
        </View>
      </Glass>

      <TouchableOpacity
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        style={[styles.save, {
          backgroundColor: canSave ? theme.accent : theme.field,
          borderColor: canSave ? theme.accent : theme.glassBorder,
          shadowColor: theme.accent,
          shadowOpacity: canSave ? 0.32 : 0,
        }]}
      >
        <Text style={[styles.saveText, { color: canSave ? theme.onAccent : theme.faint }]}>
          Save reading
        </Text>
      </TouchableOpacity>

      {saved ? <Text style={[styles.saved, { color: theme.accent }]}>{saved}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, gap: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  input: {
    flex: 1, fontSize: 44, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1.5,
    borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10,
  },
  result: { fontSize: 48, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1.8 },
  unit: { fontSize: 13, fontWeight: '600', paddingBottom: 16 },
  unitBig: { fontSize: 13, fontWeight: '600' },
  hairline: { height: StyleSheet.hairlineWidth, marginVertical: 2 },
  hint: { fontSize: 12.5, lineHeight: 17, paddingHorizontal: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  save: {
    borderRadius: 20, paddingVertical: 16, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth * 2,
    shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
  },
  saveText: { fontSize: 15.5, fontWeight: '700', letterSpacing: 0.1 },
  saved: { fontSize: 12.5, textAlign: 'center', fontWeight: '600', letterSpacing: 0.3 },
});
