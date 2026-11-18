import { ACCESSORIES } from '../data/accessories';
import {
  ACCESSORY_MILESTONE_COINS,
  ACCESSORY_MILESTONE_GROWTH,
  ACCESSORY_MILESTONE_STEP,
} from '../data/encyclopedia';
import { FOODS } from '../data/foods';
import { getGrowthStage } from '../data/growth';
import { EncyclopediaState, GameState, TitleId } from '../types';

export function createInitialEncyclopediaState(
  seedFoodIds: string[] = []
): EncyclopediaState {
  const validFoodIds = new Set(FOODS.map((f) => f.id));
  const uniqueFoods = Array.from(
    new Set(seedFoodIds.filter((id) => validFoodIds.has(id)))
  );

  return {
    collectedFoodIds: uniqueFoods,
    claimedAccessoryMilestones: [],
    unlockedTitles: [],
    activeTitle: null,
  };
}

export function getAccessoryMilestoneThresholds(): number[] {
  const thresholds: number[] = [];
  for (let n = ACCESSORY_MILESTONE_STEP; n <= ACCESSORIES.length; n += ACCESSORY_MILESTONE_STEP) {
    thresholds.push(n);
  }
  return thresholds;
}

export interface EncyclopediaSyncOutcome {
  nextState: GameState;
  newlyAwardedMilestones: number[];
  newlyUnlockedTitles: TitleId[];
  bonusCoins: number;
  bonusGrowth: number;
}

export function syncEncyclopediaRewards(state: GameState): EncyclopediaSyncOutcome {
  const validAccessoryIds = new Set(ACCESSORIES.map((a) => a.id));
  const ownedCount = state.accessories.filter((id) => validAccessoryIds.has(id)).length;

  const thresholds = getAccessoryMilestoneThresholds();
  const newlyAwardedMilestones = thresholds.filter(
    (threshold) =>
      ownedCount >= threshold &&
      !state.encyclopedia.claimedAccessoryMilestones.includes(threshold)
  );

  const bonusCoins = newlyAwardedMilestones.length * ACCESSORY_MILESTONE_COINS;
  const bonusGrowth = newlyAwardedMilestones.length * ACCESSORY_MILESTONE_GROWTH;

  const validFoodIds = new Set(FOODS.map((f) => f.id));
  const collectedFoodCount = state.encyclopedia.collectedFoodIds.filter((id) =>
    validFoodIds.has(id)
  ).length;

  const unlockedTitles = [...state.encyclopedia.unlockedTitles];
  const newlyUnlockedTitles: TitleId[] = [];

  if (collectedFoodCount >= FOODS.length && !unlockedTitles.includes('gourmet_owner')) {
    unlockedTitles.push('gourmet_owner');
    newlyUnlockedTitles.push('gourmet_owner');
  }

  if (ownedCount >= ACCESSORIES.length && !unlockedTitles.includes('fashion_stylist')) {
    unlockedTitles.push('fashion_stylist');
    newlyUnlockedTitles.push('fashion_stylist');
  }

  if (newlyAwardedMilestones.length === 0 && newlyUnlockedTitles.length === 0) {
    return {
      nextState: state,
      newlyAwardedMilestones: [],
      newlyUnlockedTitles: [],
      bonusCoins: 0,
      bonusGrowth: 0,
    };
  }

  const nextGrowth = state.pet.growth + bonusGrowth;
  const nextActiveTitle =
    state.encyclopedia.activeTitle ??
    (unlockedTitles.length > 0 ? unlockedTitles[0] : null);

  return {
    nextState: {
      ...state,
      coins: state.coins + bonusCoins,
      pet: {
        ...state.pet,
        growth: nextGrowth,
        level: getGrowthStage(nextGrowth).level,
      },
      encyclopedia: {
        ...state.encyclopedia,
        claimedAccessoryMilestones: [
          ...state.encyclopedia.claimedAccessoryMilestones,
          ...newlyAwardedMilestones,
        ].sort((a, b) => a - b),
        unlockedTitles,
        activeTitle: nextActiveTitle,
      },
    },
    newlyAwardedMilestones,
    newlyUnlockedTitles,
    bonusCoins,
    bonusGrowth,
  };
}
