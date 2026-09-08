import { useMemo, useState } from 'react';
import {
  Keyboard, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { formatMmol, mgdlToMmol, parseMgdl } from '../lib/glucose';
import { addReading } from '../lib/db';
import { TAGS, TAG_LABELS, type Tag } from '../lib/types';
import { Chip, Section, Sheet } from '../components/ui';
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
    setSaved(`Saved ${formatMmol(mgdlToMmol(parsed.mgdl))} mmol/L to ${TAG_LABELS[tag].toLowerCase()}`);
    setInput('');
    Keyboard.dismiss();
    onSaved();
    setTimeout(() => setSaved(null), 2600);
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Sheet theme={theme} style={styles.entry}>
        <View style={styles.pair}>
          <View style={styles.half}>
            <TextInput
              style={[styles.input, {
                color: theme.ink,
                borderBottomColor: error ? theme.danger : theme.ruleStrong,
              }]}
              value={input}
              onChangeText={setInput}
              placeholder="145"
              placeholderTextColor={theme.inkFaint}
              keyboardType="decimal-pad"
              returnKeyType="done"
              maxLength={6}
              accessibilityLabel="Blood glucose reading in milligrams per deciliter"
            />
            <Text style={[styles.unit, { color: theme.inkSoft }]}>mg/dL from your meter</Text>
          </View>

          <Text style={[styles.equals, { color: theme.inkFaint }]}>=</Text>

          <View style={styles.half}>
            <Text style={[styles.result, { color: mmol === null ? theme.inkFaint : theme.ink }]}>
              {mmol === null ? '—' : formatMmol(mmol)}
            </Text>
            <Text style={[styles.unit, { color: theme.inkSoft }]}>mmol/L</Text>
          </View>
        </View>
      </Sheet>

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      <Section theme={theme} title="When was it taken">
        <View style={styles.chips}>
          {TAGS.map((t) => (
            <Chip key={t} theme={theme} active={tag === t} label={TAG_LABELS[t]} onPress={() => setTag(t)} />
          ))}
        </View>
        <Text style={[styles.note, { color: theme.inkFaint }]}>
          This is the column your reading lands in on the logbook page.
        </Text>
      </Section>

      <TouchableOpacity
        onPress={save}
        disabled={!canSave}
        accessibilityRole="button"
        style={[styles.save, {
          backgroundColor: canSave ? theme.accent : 'transparent',
          borderColor: canSave ? theme.accent : theme.rule,
        }]}
      >
        <Text style={[styles.saveText, { color: canSave ? theme.onAccent : theme.inkFaint }]}>
          Save reading
        </Text>
      </TouchableOpacity>

      {saved ? <Text style={[styles.saved, { color: theme.accent }]}>{saved}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 22, paddingBottom: 40 },
  entry: { paddingVertical: 20 },
  pair: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  half: { flex: 1, gap: 4 },
  equals: { fontSize: 24, fontWeight: '300', paddingTop: 12 },
  input: {
    fontSize: 40, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1.4,
    borderBottomWidth: 1.5, paddingBottom: 6,
  },
  result: { fontSize: 40, fontWeight: '600', fontVariant: ['tabular-nums'], letterSpacing: -1.4, paddingBottom: 7.5 },
  unit: { fontSize: 11.5 },
  error: { fontSize: 12.5, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  note: { fontSize: 12, lineHeight: 17 },
  save: { borderRadius: 6, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  saveText: { fontSize: 15, fontWeight: '600' },
  saved: { fontSize: 12.5, textAlign: 'center' },
});
