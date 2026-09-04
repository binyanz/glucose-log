/**
 * Blood glucose unit conversion.
 *
 * Clinical convention divides mg/dL by 18 to get mmol/L. The chemically exact
 * divisor is 18.0156 (glucose molar mass 180.156 g/mol), but every published
 * conversion table and lab report uses 18, and at the first decimal place the
 * two disagree at common values: 100 mg/dL is 5.6 mmol/L by convention and
 * 5.5 by the exact figure. Matching the tables matters more here than the
 * fourth significant digit, so 18 it is.
 */
export const MG_PER_MMOL = 18;

/** Readings outside this range are almost certainly typos, not measurements. */
export const MIN_MGDL = 20;
export const MAX_MGDL = 600;

export function mgdlToMmol(mgdl: number): number {
  return mgdl / MG_PER_MMOL;
}

export function mmolToMgdl(mmol: number): number {
  return mmol * MG_PER_MMOL;
}

/** mmol/L is conventionally shown to one decimal place. */
export function formatMmol(mmol: number): string {
  return mmol.toFixed(1);
}

/** mg/dL is conventionally shown as a whole number. */
export function formatMgdl(mgdl: number): string {
  return String(Math.round(mgdl));
}

export type ParseResult =
  | { ok: true; mgdl: number }
  | { ok: false; error: string };

/**
 * Validate raw keyboard input as a mg/dL reading.
 * Returns a message the user can act on rather than throwing.
 */
export function parseMgdl(input: string): ParseResult {
  const trimmed = input.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Enter a reading first.' };
  }
  // Reject anything that is not a plain number: catches "12a", "1.2.3", "1e5".
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    return { ok: false, error: 'Numbers only — enter the value your meter shows.' };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: 'That is not a number I can read.' };
  }
  if (value < MIN_MGDL) {
    return { ok: false, error: `That reads low for mg/dL. Did you enter mmol/L? Expected ${MIN_MGDL}–${MAX_MGDL}.` };
  }
  if (value > MAX_MGDL) {
    return { ok: false, error: `That is above ${MAX_MGDL} mg/dL. Check the number and try again.` };
  }
  return { ok: true, mgdl: value };
}
