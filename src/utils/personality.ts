import {
  PERSONALITY_CARE_DELTAS,
  PERSONALITY_DEFINITIONS,
  PERSONALITY_IDS,
  PET_PREFERENCES,
  PersonalityCareTrigger,
  SPECIES_INITIAL_PERSONALITY_DEFAULTS,
} from '../data/personality';
import {
  PersonalityId,
  PetPersonality,
  PetPreference,
  PetSpecies,
} from '../types';

export type PreferenceMatch = 'favorite' | 'neutral' | 'disliked';

// Hysteresis thresholds prevent primary/secondary traits from flipping too fast
const PRIMARY_PROMOTION_MARGIN = 6;
const SECONDARY_PROMOTION_MARGIN = 4;
const MAX_SCORE = 100;

export function createInitialPetPersonality(
  species: PetSpecies = 'pig'
): PetPersonality {
  const def =
    SPECIES_INITIAL_PERSONALITY_DEFAULTS[species] ??
    SPECIES_INITIAL_PERSONALITY_DEFAULTS.pig;
  return {
    primary: def.primary,
    secondary: def.secondary,
    scores: { ...def.baseScores },
    careActionCounts: {},
    lastUpdatedAt: Date.now(),
  };
}

export function getPetPreference(species: PetSpecies): PetPreference {
  return PET_PREFERENCES[species] ?? PET_PREFERENCES.pig;
}

export function evaluateFoodPreference(
  species: PetSpecies,
  foodId: string
): PreferenceMatch {
  const pref = getPetPreference(species);
  if (pref.favoriteFoodIds.includes(foodId)) return 'favorite';
  if (pref.dislikedFoodIds.includes(foodId)) return 'disliked';
  return 'neutral';
}

export function evaluateItemPreference(
  species: PetSpecies,
  itemId: string
): PreferenceMatch {
  const pref = getPetPreference(species);
  if (
    pref.favoriteToyIds.includes(itemId) ||
    pref.favoriteFurnitureIds.includes(itemId)
  ) {
    return 'favorite';
  }
  if (
    pref.dislikedToyIds.includes(itemId) ||
    pref.dislikedFurnitureIds.includes(itemId)
  ) {
    return 'disliked';
  }
  return 'neutral';
}

/**
 * Slowly develops pet personality from care actions.
 * Only increments by +1 every 2nd matching action (or +1/+2 gentle ticks)
 * and uses hysteresis so primary/secondary traits shift gradually and naturally.
 */
export function applyPersonalityDevelopment(
  current: PetPersonality,
  trigger: PersonalityCareTrigger
): {
  nextPersonality: PetPersonality;
  primaryChanged: boolean;
  secondaryChanged: boolean;
} {
  const prevCount = current.careActionCounts[trigger] ?? 0;
  const nextCount = prevCount + 1;
  const nextCareCounts: Record<string, number> = {
    ...current.careActionCounts,
    [trigger]: nextCount,
  };

  // Slow progression: grant trait points on every 2nd action of this category
  const shouldGrantPoints = nextCount % 2 === 0;
  const nextScores: Record<PersonalityId, number> = { ...current.scores };

  if (shouldGrantPoints) {
    const deltas = PERSONALITY_CARE_DELTAS[trigger];
    for (const id of PERSONALITY_IDS) {
      const delta = deltas[id] ?? 0;
      if (delta > 0) {
        nextScores[id] = Math.min(MAX_SCORE, (nextScores[id] ?? 10) + delta);
      }
    }
  }

  // Re-evaluate primary & secondary with hysteresis so traits never flicker rapidly
  const sorted = [...PERSONALITY_IDS].sort(
    (a, b) => (nextScores[b] ?? 0) - (nextScores[a] ?? 0)
  );

  let nextPrimary = current.primary;
  const topCandidate = sorted[0];
  if (
    topCandidate !== current.primary &&
    (nextScores[topCandidate] ?? 0) >=
      (nextScores[current.primary] ?? 0) + PRIMARY_PROMOTION_MARGIN
  ) {
    nextPrimary = topCandidate;
  }

  let nextSecondary = current.secondary;
  if (nextSecondary === nextPrimary) {
    nextSecondary = sorted.find((id) => id !== nextPrimary) ?? current.primary;
  } else {
    const runnerUp = sorted.find((id) => id !== nextPrimary);
    if (
      runnerUp &&
      runnerUp !== nextSecondary &&
      (nextScores[runnerUp] ?? 0) >=
        (nextScores[nextSecondary] ?? 0) + SECONDARY_PROMOTION_MARGIN
    ) {
      nextSecondary = runnerUp;
    }
  }

  const nextPersonality: PetPersonality = {
    primary: nextPrimary,
    secondary: nextSecondary,
    scores: nextScores,
    careActionCounts: nextCareCounts,
    lastUpdatedAt: shouldGrantPoints ? Date.now() : current.lastUpdatedAt,
  };

  return {
    nextPersonality,
    primaryChanged: nextPrimary !== current.primary,
    secondaryChanged: nextSecondary !== current.secondary,
  };
}

export function getPersonalitySummaryLabel(personality: PetPersonality): string {
  const p = PERSONALITY_DEFINITIONS[personality.primary];
  const s = PERSONALITY_DEFINITIONS[personality.secondary];
  return `${p.emoji} ${p.label} · ${s.emoji} ${s.label}`;
}
