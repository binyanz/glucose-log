/**
 * A single food item as identified from a photo, or edited by hand.
 * Carbs/sugar are the app's best estimate in grams - always shown as
 * editable, never presented as a measured value.
 */
export type FoodItem = {
  id: string;
  name: string;
  portion: string;   // free text, e.g. "1 cup", "about 150g" - human-scale, not a forced unit
  carbsG: number;
  sugarG: number;
};

export type Meal = {
  id: number;
  takenAt: number;      // epoch ms
  photoUri: string | null;
  items: FoodItem[];
  totalCarbsG: number;   // cached sum of items - the source of truth for matching, since
  totalSugarG: number;   // items can be edited after the fact and this must track that
  note: string | null;
};

/** A past reading bucketed by elapsed time since a meal. */
export type PostMealOffset = 'plus1h' | 'plus2h';

export type MealEstimate = {
  offset: PostMealOffset;
  sampleCount: number;
  avgMgdl: number | null;
  minMgdl: number | null;
  maxMgdl: number | null;
};
