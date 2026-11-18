import {
  DISLIKED_FOOD_SPEECHES,
  FAVORITE_FOOD_SPEECHES,
} from '../data/personality';
import {
  FAVORITE_FEED_RULE,
  FEED_REACTION_BY_CATEGORY,
  FEED_REACTION_BY_FOOD_ID,
  STUFFED_FEED_RULE,
} from '../data/feedingReactions';
import { getPetSpeciesInfo, pickRandomNonRepeating } from '../data/species';
import {
  FeedingVisualEffect,
  Food,
  PetExpression,
  PetSpecies,
  PiggyActionState,
} from '../types';
import { evaluateFoodPreference } from './personality';

export interface FeedingOutcome {
  action: PiggyActionState;
  visualEffect: FeedingVisualEffect;
  expression: PetExpression;
  speech: string;
  feedbackText: string;
  feedbackEmoji: string;
  particleEmojis: string[];
  isFavorite: boolean;
  isDisliked: boolean;
  isStuffed: boolean;
}

export function resolveFeedingOutcome(
  food: Food,
  species: PetSpecies,
  nextFastFoodStreak: number,
  lastSpeech?: string
): FeedingOutcome {
  const speciesInfo = getPetSpeciesInfo(species);
  const preference = evaluateFoodPreference(species, food.id);
  const isFavorite = preference === 'favorite';
  const isDisliked = preference === 'disliked';
  const isStuffed = nextFastFoodStreak >= 3;

  if (isStuffed) {
    return {
      action: 'stuffed',
      visualEffect: 'stuffed',
      expression: STUFFED_FEED_RULE.expression,
      speech: pickRandomNonRepeating(STUFFED_FEED_RULE.speeches, lastSpeech),
      feedbackText: STUFFED_FEED_RULE.feedbackText,
      feedbackEmoji: STUFFED_FEED_RULE.feedbackEmoji,
      particleEmojis: STUFFED_FEED_RULE.particleEmojis,
      isFavorite,
      isDisliked,
      isStuffed: true,
    };
  }

  const rule =
    FEED_REACTION_BY_FOOD_ID[food.id] ?? FEED_REACTION_BY_CATEGORY[food.category];

  if (isFavorite) {
    const favoriteSpeeches = [
      speciesInfo.favoriteFoodReaction,
      ...FAVORITE_FOOD_SPEECHES[species],
      ...rule.speeches.map((s) => `${s}（最愛料理大滿足！）`),
    ];
    return {
      action: 'eating',
      visualEffect: 'favoriteJump',
      expression: 'sparkle',
      speech: pickRandomNonRepeating(favoriteSpeeches, lastSpeech),
      feedbackText: `${food.name} · ${FAVORITE_FEED_RULE.feedbackText}`,
      feedbackEmoji: FAVORITE_FEED_RULE.feedbackEmoji,
      particleEmojis: FAVORITE_FEED_RULE.particleEmojis,
      isFavorite: true,
      isDisliked: false,
      isStuffed: false,
    };
  }

  // Disliked food: normal expression & mild complaint, zero penalties
  if (isDisliked) {
    return {
      action: 'eating',
      visualEffect: 'none',
      expression: 'normal',
      speech: pickRandomNonRepeating(DISLIKED_FOOD_SPEECHES[species], lastSpeech),
      feedbackText: `${food.name}（不太合胃口）`,
      feedbackEmoji: '💭',
      particleEmojis: ['💭'],
      isFavorite: false,
      isDisliked: true,
      isStuffed: false,
    };
  }

  return {
    action: 'eating',
    visualEffect: 'hearts',
    expression: rule.expression,
    speech: pickRandomNonRepeating(rule.speeches, lastSpeech),
    feedbackText: rule.feedbackText,
    feedbackEmoji: rule.feedbackEmoji,
    particleEmojis: rule.particleEmojis,
    isFavorite: false,
    isDisliked: false,
    isStuffed: false,
  };
}
