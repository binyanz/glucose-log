import type { FoodItem } from './mealtypes';

/**
 * The one place this app talks to Claude. Everything above this module - every
 * screen - calls analyzeFood() and never touches fetch(), an API key, or a
 * model name directly. Swapping this implementation later (e.g. to call a
 * proxy backend instead of Anthropic directly) means editing this file only.
 */

const MODEL = 'claude-sonnet-5';
const API_URL = 'https://api.anthropic.com/v1/messages';

export type AnalyzeFoodResult =
  | { ok: true; items: FoodItem[]; confidence: 'low' | 'medium' | 'high' }
  | { ok: false; error: string };

const PROMPT = `You are looking at a photo of a meal. Identify each distinct food item and estimate its carbohydrate and sugar content in grams.

These are estimates from a photo, not measurements - be honest about uncertainty rather than falsely precise. Round to the nearest 5g.

Respond with ONLY a JSON object, no other text, in exactly this shape:
{
  "items": [
    { "name": "steamed rice", "portion": "about 1 cup", "carbsG": 45, "sugarG": 0 }
  ],
  "confidence": "low" | "medium" | "high"
}

Use "low" confidence for mixed or partly-obscured dishes, "high" only for a single, clearly visible, easily-portioned food.`;

/**
 * Validate the model's JSON rather than trusting it blindly - a vision model
 * asked for strict JSON will still occasionally wrap it in prose, omit a
 * field, or return a non-numeric value, and this must fail closed rather than
 * hand a screen NaN or an undefined field to render.
 */
export function parseAnalysis(raw: string): AnalyzeFoodResult {
  let text = raw.trim();
  // Models sometimes wrap JSON in a markdown fence despite instructions not to.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) text = fenced[1].trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "Could not read the response. Try again, or enter the food by hand." };
  }

  if (typeof parsed !== 'object' || parsed === null || !('items' in parsed)) {
    return { ok: false, error: 'The response was missing the food list.' };
  }
  const obj = parsed as { items: unknown; confidence?: unknown };
  if (!Array.isArray(obj.items) || obj.items.length === 0) {
    return { ok: false, error: 'No food items were recognized in that photo.' };
  }

  const items: FoodItem[] = [];
  for (const raw of obj.items) {
    if (typeof raw !== 'object' || raw === null) continue;
    const it = raw as Record<string, unknown>;
    const name = typeof it.name === 'string' ? it.name.trim() : '';
    const portion = typeof it.portion === 'string' ? it.portion.trim() : '';
    const carbsG = typeof it.carbsG === 'number' && Number.isFinite(it.carbsG) ? Math.max(0, it.carbsG) : null;
    const sugarG = typeof it.sugarG === 'number' && Number.isFinite(it.sugarG) ? Math.max(0, it.sugarG) : null;
    if (!name || carbsG === null || sugarG === null) continue; // drop malformed entries rather than fail the whole meal
    items.push({ id: `${Date.now()}-${items.length}`, name, portion: portion || '1 serving', carbsG, sugarG });
  }

  if (items.length === 0) {
    return { ok: false, error: 'Could not make sense of the food list. Try again, or enter it by hand.' };
  }

  const confidence = obj.confidence === 'high' || obj.confidence === 'medium' ? obj.confidence : 'low';
  return { ok: true, items, confidence };
}

export type FetchLike = (url: string, init: RequestInit) => Promise<{
  ok: boolean; status: number; json: () => Promise<any>;
}>;

export async function analyzeFood(params: {
  apiKey: string;
  imageBase64: string;
  mediaType: 'image/jpeg' | 'image/png';
  fetchImpl?: FetchLike;
}): Promise<AnalyzeFoodResult> {
  const { apiKey, imageBase64, mediaType, fetchImpl = fetch as unknown as FetchLike } = params;

  if (!apiKey.trim()) {
    return { ok: false, error: 'No Anthropic API key is set. Add one in Settings.' };
  }

  let res;
  try {
    res = await fetchImpl(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: PROMPT },
          ],
        }],
      }),
    });
  } catch {
    return { ok: false, error: 'Could not reach the network. Check your connection and try again.' };
  }

  if (!res.ok) {
    if (res.status === 401) return { ok: false, error: 'That API key was rejected. Check it in Settings.' };
    if (res.status === 429) return { ok: false, error: 'Rate limited - wait a moment and try again.' };
    return { ok: false, error: `The request failed (status ${res.status}).` };
  }

  const body = await res.json();
  const text = body?.content?.[0]?.text;
  if (typeof text !== 'string') {
    return { ok: false, error: 'The response did not contain the expected content.' };
  }
  return parseAnalysis(text);
}
