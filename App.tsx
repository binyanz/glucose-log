import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, StyleSheet,
  Text, TextInput, TouchableWithoutFeedback, Keyboard, View, useColorScheme,
} from 'react-native';
import { formatMmol, mgdlToMmol, parseMgdl } from './src/lib/glucose.ts';

const palette = {
  light: {
    bg: '#F2F4F7', card: '#FFFFFF', text: '#12151A', muted: '#697586',
    accent: '#0F766E', danger: '#B42318', rule: '#E3E8EF', field: '#F8FAFC',
  },
  dark: {
    bg: '#0D1117', card: '#161B22', text: '#E9EDF2', muted: '#8B98A8',
    accent: '#2DD4BF', danger: '#FF7B72', rule: '#252C36', field: '#0D1117',
  },
};

export default function App() {
  const scheme = useColorScheme();
  const c = palette[scheme === 'dark' ? 'dark' : 'light'];
  const [input, setInput] = useState('');

  // Show the converted value as soon as it's valid, but only complain about
  // bad input once something has actually been typed.
  const { mmol, error } = useMemo(() => {
    if (input.trim() === '') return { mmol: null, error: null };
    const parsed = parseMgdl(input);
    return parsed.ok
      ? { mmol: mgdlToMmol(parsed.mgdl), error: null }
      : { mmol: null, error: parsed.error };
  }, [input]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.body}>
            <Text style={[styles.eyebrow, { color: c.muted }]}>GLUCOSE LOG</Text>

            <View style={[styles.card, { backgroundColor: c.card, borderColor: c.rule }]}>
              <Text style={[styles.label, { color: c.muted }]}>METER READING</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.field, borderColor: error ? c.danger : c.rule }]}
                  value={input}
                  onChangeText={setInput}
                  placeholder="145"
                  placeholderTextColor={c.muted}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                  maxLength={6}
                  autoFocus
                  accessibilityLabel="Blood glucose reading in milligrams per deciliter"
                />
                <Text style={[styles.unit, { color: c.muted }]}>mg/dL</Text>
              </View>

              <View style={[styles.divider, { backgroundColor: c.rule }]} />

              <Text style={[styles.label, { color: c.muted }]}>CONVERTED</Text>
              <View style={styles.inputRow}>
                <Text style={[styles.result, { color: mmol === null ? c.muted : c.accent }]}>
                  {mmol === null ? '—' : formatMmol(mmol)}
                </Text>
                <Text style={[styles.unit, { color: c.muted }]}>mmol/L</Text>
              </View>
            </View>

            <Text style={[styles.hint, { color: error ? c.danger : c.muted }]}>
              {error ?? 'Enter the number shown on your meter.'}
            </Text>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  eyebrow: { fontSize: 11, letterSpacing: 2, fontWeight: '600' },
  card: { borderRadius: 14, borderWidth: 1, padding: 20, gap: 10 },
  label: { fontSize: 11, letterSpacing: 1.4, fontWeight: '600' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10 },
  input: {
    flex: 1, fontSize: 46, fontWeight: '700', fontVariant: ['tabular-nums'],
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
  },
  result: { flex: 1, fontSize: 46, fontWeight: '700', fontVariant: ['tabular-nums'], paddingHorizontal: 14 },
  unit: { fontSize: 14, fontWeight: '600', paddingBottom: 16 },
  divider: { height: 1, marginVertical: 6 },
  hint: { fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
});
