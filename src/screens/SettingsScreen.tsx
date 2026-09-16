import { useEffect, useState } from 'react';
import {
  Keyboard, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { getTarget, setTarget } from '../lib/db';
import { getApiKey, setApiKey } from '../lib/apiKey';
import { mgdlToMmol, mmolToMgdl, formatMmol } from '../lib/glucose';
import { Section, Sheet } from '../components/ui';
import type { Theme } from '../theme';

export function SettingsScreen({ theme }: { theme: Theme }) {
  const [lowMmol, setLowMmol] = useState('3.9');
  const [highMmol, setHighMmol] = useState('10.0');
  const [rangeSaved, setRangeSaved] = useState(false);

  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);

  useEffect(() => {
    getTarget().then((t) => {
      setLowMmol(formatMmol(mgdlToMmol(t.lowMgdl)));
      setHighMmol(formatMmol(mgdlToMmol(t.highMgdl)));
    });
    getApiKey().then((k) => setHasStoredKey(!!k));
  }, []);

  async function saveRange() {
    const lo = parseFloat(lowMmol);
    const hi = parseFloat(highMmol);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0 || hi <= lo) return;
    await setTarget({ lowMgdl: mmolToMgdl(lo), highMgdl: mmolToMgdl(hi) });
    Keyboard.dismiss();
    setRangeSaved(true);
    setTimeout(() => setRangeSaved(false), 2000);
  }

  async function saveKey() {
    await setApiKey(apiKeyInput);
    setHasStoredKey(!!apiKeyInput.trim());
    setApiKeyInput('');
    Keyboard.dismiss();
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2000);
  }

  async function clearKey() {
    await setApiKey('');
    setHasStoredKey(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      <Section theme={theme} title="Target range">
        <Sheet theme={theme}>
          <Text style={[styles.label, { color: theme.inkSoft }]}>
            The logbook and trend colours are relative to this range. You set it, not the app.
          </Text>
          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={[styles.fieldLabel, { color: theme.inkSoft }]}>Low, mmol/L</Text>
              <TextInput
                style={[styles.input, { color: theme.ink, borderColor: theme.ruleStrong }]}
                value={lowMmol} onChangeText={setLowMmol}
                keyboardType="decimal-pad" returnKeyType="done"
              />
            </View>
            <View style={styles.half}>
              <Text style={[styles.fieldLabel, { color: theme.inkSoft }]}>High, mmol/L</Text>
              <TextInput
                style={[styles.input, { color: theme.ink, borderColor: theme.ruleStrong }]}
                value={highMmol} onChangeText={setHighMmol}
                keyboardType="decimal-pad" returnKeyType="done"
              />
            </View>
          </View>
          <TouchableOpacity onPress={saveRange} style={[styles.save, { backgroundColor: theme.accent }]}>
            <Text style={[styles.saveText, { color: theme.onAccent }]}>Save range</Text>
          </TouchableOpacity>
          {rangeSaved ? <Text style={[styles.saved, { color: theme.accent }]}>Saved</Text> : null}
        </Sheet>
      </Section>

      <Section theme={theme} title="Food photo recognition">
        <Sheet theme={theme}>
          <Text style={[styles.label, { color: theme.inkSoft }]}>
            {hasStoredKey
              ? 'An Anthropic API key is stored on this device (in the keychain, not the app database). Photo analysis is billed to your own Anthropic account.'
              : 'Add your own Anthropic API key to enable photo-based food recognition. Without one, meals can still be logged by hand.'}
          </Text>
          <TextInput
            style={[styles.input, { color: theme.ink, borderColor: theme.ruleStrong, marginTop: 10 }]}
            value={apiKeyInput} onChangeText={setApiKeyInput}
            placeholder={hasStoredKey ? 'Replace the stored key…' : 'sk-ant-…'}
            placeholderTextColor={theme.inkFaint}
            secureTextEntry autoCapitalize="none" autoCorrect={false}
          />
          <View style={styles.keyActions}>
            <TouchableOpacity
              onPress={saveKey} disabled={!apiKeyInput.trim()}
              style={[styles.save, styles.grow, { backgroundColor: apiKeyInput.trim() ? theme.accent : theme.rule }]}
            >
              <Text style={[styles.saveText, { color: apiKeyInput.trim() ? theme.onAccent : theme.inkFaint }]}>
                Save key
              </Text>
            </TouchableOpacity>
            {hasStoredKey ? (
              <TouchableOpacity onPress={clearKey} style={[styles.clear, { borderColor: theme.ruleStrong }]}>
                <Text style={{ color: theme.danger, fontWeight: '600', fontSize: 13.5 }}>Remove</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {keySaved ? <Text style={[styles.saved, { color: theme.accent }]}>Saved</Text> : null}
          <TouchableOpacity onPress={() => Linking.openURL('https://console.anthropic.com/settings/keys')}>
            <Text style={[styles.link, { color: theme.accent }]}>Get an API key from console.anthropic.com →</Text>
          </TouchableOpacity>
        </Sheet>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 24, paddingBottom: 40 },
  label: { fontSize: 12.5, lineHeight: 18 },
  row: { flexDirection: 'row', gap: 12, marginTop: 12 },
  half: { flex: 1, gap: 4 },
  fieldLabel: { fontSize: 11, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  save: { borderRadius: 8, paddingVertical: 11, alignItems: 'center', marginTop: 12 },
  grow: { flex: 1, marginTop: 0 },
  saveText: { fontSize: 14, fontWeight: '600' },
  saved: { fontSize: 12, marginTop: 8 },
  keyActions: { flexDirection: 'row', gap: 10, marginTop: 12, alignItems: 'center' },
  clear: { borderWidth: 1, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 14 },
  link: { fontSize: 12.5, fontWeight: '600', marginTop: 12 },
});
