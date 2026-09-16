import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, Keyboard, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { analyzeFood } from '../lib/analyzeFood';
import { stylizeMealPhoto } from '../lib/stylize';
import { getApiKey } from '../lib/apiKey';
import { addMeal, listReadingsWithMeals } from '../lib/db';
import { estimatePostMeal, MIN_SAMPLES } from '../lib/mealEstimate';
import { formatMmol, mgdlToMmol } from '../lib/glucose';
import type { FoodItem, Meal } from '../lib/mealtypes';
import { Section, Sheet } from './ui';
import type { Theme } from '../theme';

type Stage = 'idle' | 'analyzing' | 'reviewing' | 'saving';
type Estimate = ReturnType<typeof estimatePostMeal>;

const newItem = (): FoodItem => ({ id: `${Date.now()}-${Math.random()}`, name: '', portion: '', carbsG: 0, sugarG: 0 });

/**
 * The capture -> analyze -> review -> save flow, as a standalone piece rather
 * than a top-level screen, so it can be opened wherever logging a meal makes
 * sense (currently: attached inline to a glucose reading) instead of forcing
 * a trip to a separate tab.
 */
export function MealCapture({
  theme, onSaved, onCancel, onOpenSettings,
}: {
  theme: Theme;
  onSaved: (meal: Meal) => void;
  onCancel: () => void;
  onOpenSettings?: () => void;
}) {
  const [stage, setStage] = useState<Stage>('idle');
  const [rawUri, setRawUri] = useState<string | null>(null);
  const [items, setItems] = useState<FoodItem[]>([]);
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [noApiKey, setNoApiKey] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const totalCarbs = useMemo(() => items.reduce((s, it) => s + it.carbsG, 0), [items]);
  const totalSugar = useMemo(() => items.reduce((s, it) => s + it.sugarG, 0), [items]);

  async function refreshEstimate(carbsG: number) {
    if (carbsG <= 0) { setEstimate(null); return; }
    const history = await listReadingsWithMeals();
    setEstimate(estimatePostMeal(history, carbsG));
  }

  async function pickAndAnalyze(fromCamera: boolean) {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setError(fromCamera ? 'Camera permission was not granted.' : 'Photo library permission was not granted.');
      return;
    }

    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true, mediaTypes: 'images' })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, base64: true, mediaTypes: 'images' });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setRawUri(asset.uri);
    setError(null);
    setNoApiKey(false);

    const apiKey = await getApiKey();
    if (!apiKey) {
      setError('No API key set yet, so this photo can’t be auto-recognized.');
      setNoApiKey(true);
      setItems([newItem()]);
      setStage('reviewing');
      return;
    }
    if (!asset.base64) {
      setError('Could not read that photo. Try again, or enter the food by hand.');
      setItems([newItem()]);
      setStage('reviewing');
      return;
    }

    setStage('analyzing');
    const analysis = await analyzeFood({ apiKey, imageBase64: asset.base64, mediaType: 'image/jpeg' });
    if (!analysis.ok) {
      setError(analysis.error);
      setItems([newItem()]);
      setStage('reviewing');
      return;
    }
    setItems(analysis.items);
    setConfidence(analysis.confidence);
    setStage('reviewing');
    refreshEstimate(analysis.items.reduce((s, it) => s + it.carbsG, 0));
  }

  function startManualEntry() {
    setRawUri(null);
    setItems([newItem()]);
    setConfidence(null);
    setError(null);
    setNoApiKey(false);
    setStage('reviewing');
  }

  function updateItem(id: string, patch: Partial<FoodItem>) {
    const next = items.map((it) => (it.id === id ? { ...it, ...patch } : it));
    setItems(next);
    refreshEstimate(next.reduce((s, it) => s + it.carbsG, 0));
  }

  function removeItem(id: string) {
    const next = items.filter((it) => it.id !== id);
    setItems(next);
    refreshEstimate(next.reduce((s, it) => s + it.carbsG, 0));
  }

  async function save() {
    const cleanItems = items
      .map((it) => ({ ...it, name: it.name.trim(), portion: it.portion.trim() || '1 serving' }))
      .filter((it) => it.name);
    if (cleanItems.length === 0) {
      Alert.alert('Add at least one food', 'Name each item before saving.');
      return;
    }
    setStage('saving');
    try {
      const takenAt = Date.now();
      const photoUri = rawUri ? (await stylizeMealPhoto(rawUri)).uri : null;
      const id = await addMeal(takenAt, photoUri, cleanItems, null);
      const carbsG = cleanItems.reduce((s, it) => s + it.carbsG, 0);
      const sugarG = cleanItems.reduce((s, it) => s + it.sugarG, 0);
      Keyboard.dismiss();
      onSaved({ id, takenAt, photoUri, items: cleanItems, totalCarbsG: carbsG, totalSugarG: sugarG, note: null });
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Something went wrong.');
      setStage('reviewing');
    }
  }

  const Header = ({ title }: { title: string }) => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: theme.ink }]}>{title}</Text>
      <TouchableOpacity onPress={onCancel} hitSlop={10}>
        <Text style={[styles.link, { color: theme.inkSoft }]}>Close</Text>
      </TouchableOpacity>
    </View>
  );

  if (stage === 'idle') {
    return (
      <View style={styles.flex}>
        <Header title="Log a meal" />
        <ScrollView contentContainerStyle={styles.body}>
          <Sheet theme={theme}>
            <Text style={[styles.hint, { color: theme.inkSoft }]}>
              A photo gets you a rough carb estimate you can correct. Estimates from a
              photo are never exact - edit anything that looks off before saving.
            </Text>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => pickAndAnalyze(true)} style={[styles.bigBtn, { backgroundColor: theme.accent }]}>
                <Text style={[styles.bigBtnText, { color: theme.onAccent }]}>Take a photo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => pickAndAnalyze(false)} style={[styles.bigBtnOutline, { borderColor: theme.ruleStrong }]}>
                <Text style={[styles.bigBtnText, { color: theme.ink }]}>Choose from library</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={startManualEntry}>
                <Text style={[styles.link, { color: theme.accent }]}>Enter food by hand instead</Text>
              </TouchableOpacity>
            </View>
          </Sheet>
        </ScrollView>
      </View>
    );
  }

  if (stage === 'analyzing') {
    return (
      <View style={styles.flex}>
        <Header title="Log a meal" />
        <View style={styles.center}>
          <ActivityIndicator color={theme.accent} />
          <Text style={{ color: theme.inkSoft, marginTop: 10 }}>Looking at the photo…</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <Header title="Review the meal" />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {rawUri ? <Image source={{ uri: rawUri }} style={styles.preview} /> : null}
        {error ? (
          <View>
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
            {noApiKey && onOpenSettings ? (
              <TouchableOpacity onPress={onOpenSettings}>
                <Text style={[styles.link, { color: theme.accent }]}>Add an API key in Settings →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
        {confidence === 'low' ? (
          <Text style={[styles.hint, { color: theme.inkSoft }]}>
            Low confidence on this one - double-check the items below.
          </Text>
        ) : null}

        <Section theme={theme} title="Food items">
          {items.map((it) => (
            <Sheet key={it.id} theme={theme} style={styles.itemSheet}>
              <TextInput
                style={[styles.itemName, { color: theme.ink }]}
                value={it.name} onChangeText={(v) => updateItem(it.id, { name: v })}
                placeholder="Food name" placeholderTextColor={theme.inkFaint}
              />
              <TextInput
                style={[styles.itemPortion, { color: theme.inkSoft }]}
                value={it.portion} onChangeText={(v) => updateItem(it.id, { portion: v })}
                placeholder="portion, e.g. 1 cup" placeholderTextColor={theme.inkFaint}
              />
              <View style={styles.gramsRow}>
                <View style={styles.gramField}>
                  <Text style={[styles.gramLabel, { color: theme.inkSoft }]}>carbs g</Text>
                  <TextInput
                    style={[styles.gramInput, { color: theme.ink, borderColor: theme.ruleStrong }]}
                    value={String(it.carbsG)} keyboardType="numeric"
                    onChangeText={(v) => updateItem(it.id, { carbsG: Math.max(0, parseFloat(v) || 0) })}
                  />
                </View>
                <View style={styles.gramField}>
                  <Text style={[styles.gramLabel, { color: theme.inkSoft }]}>sugar g</Text>
                  <TextInput
                    style={[styles.gramInput, { color: theme.ink, borderColor: theme.ruleStrong }]}
                    value={String(it.sugarG)} keyboardType="numeric"
                    onChangeText={(v) => updateItem(it.id, { sugarG: Math.max(0, parseFloat(v) || 0) })}
                  />
                </View>
                <TouchableOpacity onPress={() => removeItem(it.id)} style={styles.removeBtn}>
                  <Text style={{ color: theme.danger, fontSize: 13, fontWeight: '600' }}>Remove</Text>
                </TouchableOpacity>
              </View>
            </Sheet>
          ))}
          <TouchableOpacity onPress={() => setItems([...items, newItem()])}>
            <Text style={[styles.link, { color: theme.accent }]}>+ Add another item</Text>
          </TouchableOpacity>
        </Section>

        <Sheet theme={theme}>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: theme.inkSoft }]}>Total carbs</Text>
            <Text style={[styles.totalsValue, { color: theme.ink }]}>{totalCarbs.toFixed(0)} g</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: theme.inkSoft }]}>Total sugar</Text>
            <Text style={[styles.totalsValue, { color: theme.ink }]}>{totalSugar.toFixed(0)} g</Text>
          </View>
        </Sheet>

        {estimate ? <EstimateCard theme={theme} estimate={estimate} /> : null}

        <TouchableOpacity onPress={save} disabled={stage === 'saving'} style={[styles.bigBtn, { backgroundColor: theme.accent }]}>
          <Text style={[styles.bigBtnText, { color: theme.onAccent }]}>{stage === 'saving' ? 'Saving…' : 'Save meal'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EstimateCard({ theme, estimate }: { theme: Theme; estimate: Estimate }) {
  return (
    <Section theme={theme} title="Based on your own history">
      <Sheet theme={theme}>
        {estimate.map((e) => (
          <View key={e.offset} style={styles.totalsRow}>
            <Text style={[styles.totalsLabel, { color: theme.inkSoft }]}>
              {e.offset === 'plus1h' ? 'About 1h after' : 'About 2h after'}
            </Text>
            {e.avgMgdl === null ? (
              <Text style={[styles.notEnough, { color: theme.inkFaint }]}>
                need {Math.max(0, MIN_SAMPLES - e.sampleCount)} more similar meal{MIN_SAMPLES - e.sampleCount === 1 ? '' : 's'}
              </Text>
            ) : (
              <Text style={[styles.totalsValue, { color: theme.ink }]}>
                {formatMmol(mgdlToMmol(e.avgMgdl))} mmol/L
                <Text style={{ fontSize: 11, color: theme.inkFaint }}>  ({e.sampleCount} past meals)</Text>
              </Text>
            )}
          </View>
        ))}
        <Text style={[styles.hint, { color: theme.inkFaint, marginTop: 6 }]}>
          From meals with a similar carb total, not a general prediction.
        </Text>
      </Sheet>
    </Section>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  body: { padding: 16, paddingTop: 0, gap: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12.5, lineHeight: 18 },
  error: { fontSize: 12.5, lineHeight: 18, paddingHorizontal: 2 },
  actions: { gap: 10, marginTop: 12 },
  bigBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  bigBtnOutline: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  bigBtnText: { fontSize: 15, fontWeight: '600' },
  link: { fontSize: 13, fontWeight: '600', paddingVertical: 6 },
  preview: { width: '100%', height: 200, borderRadius: 10 },
  itemSheet: { gap: 8 },
  itemName: { fontSize: 16, fontWeight: '600' },
  itemPortion: { fontSize: 13 },
  gramsRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', marginTop: 4 },
  gramField: { gap: 3 },
  gramLabel: { fontSize: 10.5 },
  gramInput: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 6, width: 64, fontSize: 14 },
  removeBtn: { marginLeft: 'auto', paddingVertical: 8 },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalsLabel: { fontSize: 13 },
  totalsValue: { fontSize: 15, fontWeight: '700' },
  notEnough: { fontSize: 12, fontStyle: 'italic' },
});
