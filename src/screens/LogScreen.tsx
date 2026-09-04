import { useMemo, useState } from 'react';
import {
  Keyboard, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { formatMmol, mgdlToMmol, parseMgdl } from '../lib/glucose';
import { addReading } from '../lib/db';
import { TAGS, TAG_LABELS, type Tag } from '../lib/types';
import { Card, Chip, Label } from '../components/ui';
import { Kitty } from '../components/Mascots';
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
    setSaved(`Saved! ${parsed.mgdl} mg/dL · ${formatMmol(mgdlToMmol(parsed.mgdl))} mmol/L 🐾`);
    setInput('');
    Keyboard.dismiss();
    onSaved();
    setTimeout(() => setSaved(null), 2500);
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Card theme={theme}>
        <Label theme={theme}>YOUR METER SAYS</Label>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, {
              color: theme.text, backgroundColor: theme.field,
              borderColor: error ? theme.danger : theme.rule,
            }]}
            value={input}
            onChangeText={setInput}
            placeholder="145"
            placeholderTextColor={theme.muted}
            keyboardType="decimal-pad"
            returnKeyType="done"
            maxLength={6}
            accessibilityLabel="Blood glucose reading in milligrams per deciliter"
          />
          <Text style={[styles.unit, { color: theme.muted }]}>mg/dL</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.rule }]} />

        <Label theme={theme}>WHICH IS</Label>
        <View style={styles.row}>
          <Text style={[styles.result, { color: mmol === null ? theme.muted : theme.pink }]}>
            {mmol === null ? '—' : formatMmol(mmol)}
          </Text>
          <Text style={[styles.unit, { color: theme.muted }]}>mmol/L</Text>
        </View>
      </Card>

      <Text style={[styles.hint, { color: error ? theme.danger : theme.muted }]}>
        {error ?? 'Pop in the number from your meter and I will do the maths.'}
      </Text>

      <Card theme={theme}>
        <Label theme={theme}>WHEN WAS THIS?</Label>
        <View style={styles.chips}>
          {TAGS.map((t) => (
            <Chip
              key={t} theme={theme} active={tag === t}
              label={TAG_LABELS[t]} onPress={() => setTag(t)}
            />
          ))}
        </View>
      </Card>

      <TouchableOpacity
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        style={[styles.save, {
          backgroundColor: canSave ? theme.pink : theme.rule,
          opacity: canSave ? 1 : 0.6,
        }]}
      >
        <Text style={[styles.saveText, { color: canSave ? theme.chipOnText : theme.muted }]}>
          Save it ✨
        </Text>
      </TouchableOpacity>

      {saved ? (
        <View style={styles.savedRow}>
          <Kitty size={34} theme={theme} />
          <Text style={[styles.saved, { color: theme.pink }]}>{saved}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1, fontSize: 42, fontWeight: '700', fontVariant: ['tabular-nums'],
    borderWidth: 1.5, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10,
  },
  result: { flex: 1, fontSize: 42, fontWeight: '700', fontVariant: ['tabular-nums'], paddingHorizontal: 14 },
  unit: { fontSize: 14, fontWeight: '600', paddingBottom: 14 },
  divider: { height: 1, marginVertical: 4 },
  hint: { fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  save: { borderRadius: 22, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#E0709B', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 5 } },
  saveText: { fontSize: 16, fontWeight: '700' },
  saved: { fontSize: 13, fontWeight: '700', flexShrink: 1 },
  savedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
