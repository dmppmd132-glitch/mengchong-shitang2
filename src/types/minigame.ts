import { IngredientId } from './index';

export type MinigameId = 'apple' | 'fries' | 'mudBath' | 'foodMemory' | 'petRhythm';

export type MinigameCategory = 'catch' | 'care' | 'puzzle' | 'rhythm';

export type MinigameWeeklyChallengeId =
  | 'play_three_games'
  | 'total_score_150'
  | 'earn_three_rewards';

export type MinigameBadgeId =
  | 'first_play'
  | 'catch_master'
  | 'mud_cleaner'
  | 'memory_detective'
  | 'rhythm_star'
  | 'weekly_champion';

export type MinigameDifficultyTier = 'relaxed' | 'standard' | 'pro';

export interface MinigameDifficultyProfile {
  tier: MinigameDifficultyTier;
  label: string;
  hint: string;
  speedMultiplier: number;
  spawnMultiplier: number;
  hazardMultiplier: number;
  windowMultiplier: number;
  memoryPeekMs: number;
}

export interface MinigameTutorialStep {
  title: string;
  instruction: string;
  emoji: string;
}

export interface MinigameConfig {
  id: MinigameId;
  name: string;
  emoji: string;
  category: MinigameCategory;
  description: string;
  goalText: string;
  controlsHint: string;
  durationSeconds: number;
  rewardRuleSummary: string;
  unlockCondition: string;
  minLevel: number;
  maxFreePlaysPerDay: number;
  replayCostCoins: number;
  accentBg: string;
  accentBorder: string;
  accentText: string;
}

export interface MinigameResult {
  gameId: MinigameId;
  score: number;
  maxCombo?: number;
  perfectCount?: number;
  goodCount?: number;
  missCount?: number;
  matchedPairs?: number;
  chiliHits?: number;
  bathCompleted?: boolean;
  usedPaidReplay: boolean;
  playedAt: number;
}

export interface MinigameReward {
  coins: number;
  mood: number;
  growth: number;
  cleanliness: number;
  intimacy: number;
  ingredientReward: {
    id: IngredientId;
    qty: number;
  } | null;
}

export interface MinigameWeeklyChallenge {
  id: MinigameWeeklyChallengeId;
  title: string;
  description: string;
  target: number;
  rewardCoins: number;
  rewardGrowth: number;
}

export interface MinigameBadge {
  id: MinigameBadgeId;
  name: string;
  emoji: string;
  description: string;
}

export interface MinigameHubState {
  highScores: Record<MinigameId, number>;
  playCounts: Record<MinigameId, number>;
  dailyDate: string;
  dailyPlays: Record<MinigameId, number>;
  weekKey: string;
  weeklyPlayedGameIds: MinigameId[];
  weeklyTotalScore: number;
  weeklyRewardCount: number;
  weeklyClaimedIds: MinigameWeeklyChallengeId[];
  unlockedBadges: MinigameBadgeId[];
}
