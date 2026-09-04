export const TAGS = ['fasting', 'pre_meal', 'post_meal', 'bedtime', 'random'] as const;
export type Tag = (typeof TAGS)[number];

export const TAG_LABELS: Record<Tag, string> = {
  fasting: 'Fasting',
  pre_meal: 'Before meal',
  post_meal: 'After meal',
  bedtime: 'Bedtime',
  random: 'Random',
};

export type Reading = {
  id: number;
  /** Always stored in mg/dL — the meter's unit. Converted only for display. */
  mgdl: number;
  /** Epoch milliseconds. */
  takenAt: number;
  tag: Tag;
  note?: string | null;
};

/** User-defined, set in Settings. The app never asserts what is medically normal. */
export type TargetRange = { lowMgdl: number; highMgdl: number };

/** Commonly cited general range, offered only as a starting point to edit. */
export const DEFAULT_TARGET: TargetRange = { lowMgdl: 70, highMgdl: 180 };
