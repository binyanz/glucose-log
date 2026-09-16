import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAnalysis, analyzeFood } from './analyzeFood.ts';

test('parses a clean, well-formed response', () => {
  const r = parseAnalysis(JSON.stringify({
    items: [
      { name: 'steamed rice', portion: 'about 1 cup', carbsG: 45, sugarG: 0 },
      { name: 'orange juice', portion: '1 glass', carbsG: 25, sugarG: 21 },
    ],
    confidence: 'medium',
  }));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.items.length, 2);
    assert.equal(r.items[0].name, 'steamed rice');
    assert.equal(r.items[1].sugarG, 21);
    assert.equal(r.confidence, 'medium');
  }
});

test('unwraps a response the model wrapped in a markdown fence', () => {
  const r = parseAnalysis('```json\n' + JSON.stringify({ items: [{ name: 'apple', portion: '1', carbsG: 25, sugarG: 19 }] }) + '\n```');
  assert.equal(r.ok, true);
});

test('rejects text that is not JSON at all', () => {
  const r = parseAnalysis("I can see a plate of rice and vegetables.");
  assert.equal(r.ok, false);
});

test('rejects JSON missing the items field', () => {
  const r = parseAnalysis(JSON.stringify({ confidence: 'high' }));
  assert.equal(r.ok, false);
});

test('rejects an empty items array rather than saving a zero-food meal', () => {
  const r = parseAnalysis(JSON.stringify({ items: [] }));
  assert.equal(r.ok, false);
});

test('drops individual malformed items but keeps the well-formed ones', () => {
  const r = parseAnalysis(JSON.stringify({
    items: [
      { name: 'rice', portion: '1 cup', carbsG: 45, sugarG: 0 },
      { name: 'mystery item', portion: '1', carbsG: 'a lot' },   // carbsG not a number
      { portion: '1', carbsG: 10, sugarG: 5 },                    // missing name
    ],
  }));
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.items.length, 1, 'only the fully-valid item should survive');
});

test('clamps a negative carb value to zero rather than storing it', () => {
  const r = parseAnalysis(JSON.stringify({ items: [{ name: 'x', portion: '1', carbsG: -5, sugarG: 0 }] }));
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.items[0].carbsG, 0);
});

test('defaults confidence to low when absent or invalid, never silently high', () => {
  const noConfidence = parseAnalysis(JSON.stringify({ items: [{ name: 'x', portion: '1', carbsG: 5, sugarG: 0 }] }));
  const badConfidence = parseAnalysis(JSON.stringify({ items: [{ name: 'x', portion: '1', carbsG: 5, sugarG: 0 }], confidence: 'nonsense' }));
  assert.ok(noConfidence.ok && noConfidence.confidence === 'low');
  assert.ok(badConfidence.ok && badConfidence.confidence === 'low');
});

test('analyzeFood refuses to call the network without an API key', async () => {
  const r = await analyzeFood({ apiKey: '', imageBase64: 'x', mediaType: 'image/jpeg' });
  assert.equal(r.ok, false);
});

test('analyzeFood surfaces a clear message on 401 without needing a real key', async () => {
  const fakeFetch = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const r = await analyzeFood({ apiKey: 'sk-fake', imageBase64: 'x', mediaType: 'image/jpeg', fetchImpl: fakeFetch });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /key/i);
});

test('analyzeFood surfaces a clear message on rate limiting', async () => {
  const fakeFetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  const r = await analyzeFood({ apiKey: 'sk-fake', imageBase64: 'x', mediaType: 'image/jpeg', fetchImpl: fakeFetch });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /rate/i);
});

test('analyzeFood parses a full successful response end to end via injected fetch', async () => {
  const fakeFetch = async () => ({
    ok: true, status: 200,
    json: async () => ({
      content: [{ type: 'text', text: JSON.stringify({
        items: [{ name: 'grilled chicken', portion: '1 breast', carbsG: 0, sugarG: 0 }],
        confidence: 'high',
      }) }],
    }),
  });
  const r = await analyzeFood({ apiKey: 'sk-fake', imageBase64: 'x', mediaType: 'image/jpeg', fetchImpl: fakeFetch });
  assert.equal(r.ok, true);
  if (r.ok) { assert.equal(r.items[0].name, 'grilled chicken'); assert.equal(r.confidence, 'high'); }
});

test('analyzeFood handles a network failure without throwing', async () => {
  const fakeFetch = async () => { throw new Error('offline'); };
  const r = await analyzeFood({ apiKey: 'sk-fake', imageBase64: 'x', mediaType: 'image/jpeg', fetchImpl: fakeFetch });
  assert.equal(r.ok, false);
});
