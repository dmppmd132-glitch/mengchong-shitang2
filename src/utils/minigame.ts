import { getGrowthStage } from '../data/growth';
import {
  DAILY_ROTATION_COUNT,
  MAX_FREE_PLAYS_PER_DAY,
  MINIGAMES,
  MINIGAME_BADGES,
  MINIGAME_BY_ID,
  MINIGAME_DIFFICULTY_PROFILES,
  MINIGAME_IDS,
  MINIGAME_WEEKLY_CHALLENGES,
  REPLAY_COST_COINS,
} from '../data/minigames';
import { GameState, IngredientId } from '../types';
import {
  MinigameBadgeId,
  MinigameDifficultyProfile,
  MinigameHubState,
  MinigameId,
  MinigameResult,
  MinigameReward,
  MinigameWeeklyChallengeId,
} from '../types/minigame';

function clampNum(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function clampStatValue(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLocalWeekKey(date: Date = new Date()): string {
  // Monday-anchored week key using local calendar date
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diffToMonday);
  return getLocalDateKey(copy);
}

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getDailyOpenMinigames(dateStr: string = getLocalDateKey()): MinigameId[] {
  const rng = createMulberry32(hashSeed(`mengchong-daily-${dateStr}`));
  const pool = [...MINIGAME_IDS];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }
  return pool.slice(0, Math.min(DAILY_ROTATION_COUNT, pool.length));
}

export function getDailyRecommendedMinigame(dateStr: string = getLocalDateKey()): MinigameId {
  const openIds = getDailyOpenMinigames(dateStr);
  const idx = hashSeed(`mengchong-rec-${dateStr}`) % openIds.length;
  return openIds[idx];
}

export function getMinigameDifficulty(petLevel: number): MinigameDifficultyProfile {
  if (petLevel <= 2) {
    return MINIGAME_DIFFICULTY_PROFILES.relaxed;
  }
  if (petLevel === 3) {
    return MINIGAME_DIFFICULTY_PROFILES.standard;
  }
  return MINIGAME_DIFFICULTY_PROFILES.pro;
}

const TUTORIAL_STORAGE_KEY = 'mengchong_minigame_tutorials_v1';

export function getSeenMinigameTutorials(): MinigameId[] {
  try {
    const raw = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter(isMinigameId)));
  } catch {
    return [];
  }
}

export function hasSeenMinigameTutorial(gameId: MinigameId): boolean {
  return getSeenMinigameTutorials().includes(gameId);
}

export function markMinigameTutorialSeen(gameId: MinigameId): void {
  try {
    const current = getSeenMinigameTutorials();
    if (current.includes(gameId)) return;
    localStorage.setItem(TUTORIAL_STORAGE_KEY, JSON.stringify([...current, gameId]));
  } catch {
    // Gracefully ignore storage errors
  }
}

export function createZeroRecord(): Record<MinigameId, number> {
  return {
    apple: 0,
    fries: 0,
    mudBath: 0,
    foodMemory: 0,
    petRhythm: 0,
  };
}

export function createInitialMinigameHubState(
  todayStr: string = getLocalDateKey(),
  weekKey: string = getLocalWeekKey()
): MinigameHubState {
  return {
    highScores: createZeroRecord(),
    playCounts: createZeroRecord(),
    dailyDate: todayStr,
    dailyPlays: createZeroRecord(),
    weekKey,
    weeklyPlayedGameIds: [],
    weeklyTotalScore: 0,
    weeklyRewardCount: 0,
    weeklyClaimedIds: [],
    unlockedBadges: [],
  };
}

export function syncMinigameHubState(
  hub: MinigameHubState,
  todayStr: string = getLocalDateKey(),
  weekKey: string = getLocalWeekKey()
): MinigameHubState {
  const nextDaily =
    hub.dailyDate === todayStr
      ? hub
      : {
          ...hub,
          dailyDate: todayStr,
          dailyPlays: createZeroRecord(),
        };

  if (nextDaily.weekKey === weekKey) {
    return nextDaily;
  }

  return {
    ...nextDaily,
    weekKey,
    weeklyPlayedGameIds: [],
    weeklyTotalScore: 0,
    weeklyRewardCount: 0,
    weeklyClaimedIds: [],
  };
}

export function isMinigameId(value: unknown): value is MinigameId {
  return (
    value === 'apple' ||
    value === 'fries' ||
    value === 'mudBath' ||
    value === 'foodMemory' ||
    value === 'petRhythm'
  );
}

export function isWeeklyChallengeId(value: unknown): value is MinigameWeeklyChallengeId {
  return (
    value === 'play_three_games' ||
    value === 'total_score_150' ||
    value === 'earn_three_rewards'
  );
}

export function isMinigameBadgeId(value: unknown): value is MinigameBadgeId {
  return MINIGAME_BADGES.some((badge) => badge.id === value);
}

export interface MinigamePlayAccess {
  isOpenToday: boolean;
  meetsLevel: boolean;
  freeRemaining: number;
  usedToday: number;
  requiresCoinReplay: boolean;
  canStart: boolean;
  reason: string | null;
}

export function getMinigamePlayAccess(
  hub: MinigameHubState,
  gameId: MinigameId,
  coins: number,
  petLevel: number,
  todayStr: string = getLocalDateKey()
): MinigamePlayAccess {
  const cfg = MINIGAME_BY_ID[gameId];
  const synced = syncMinigameHubState(hub, todayStr);
  const dailyOpenIds = getDailyOpenMinigames(todayStr);
  const isOpenToday = dailyOpenIds.includes(gameId);
  const meetsLevel = petLevel >= cfg.minLevel;
  const usedToday = synced.dailyPlays[gameId] ?? 0;
  const freeRemaining = Math.max(0, MAX_FREE_PLAYS_PER_DAY - usedToday);
  const requiresCoinReplay = freeRemaining === 0;

  if (!meetsLevel) {
    return {
      isOpenToday,
      meetsLevel,
      freeRemaining,
      usedToday,
      requiresCoinReplay,
      canStart: false,
      reason: `需要 Lv.${cfg.minLevel} 解鎖`,
    };
  }

  if (!isOpenToday) {
    return {
      isOpenToday,
      meetsLevel,
      freeRemaining,
      usedToday,
      requiresCoinReplay,
      canStart: false,
      reason: '今日輪休中，明日隨機開放',
    };
  }

  if (requiresCoinReplay && coins < REPLAY_COST_COINS) {
    return {
      isOpenToday,
      meetsLevel,
      freeRemaining: 0,
      usedToday,
      requiresCoinReplay: true,
      canStart: false,
      reason: `免費次數已用完，需要 ${REPLAY_COST_COINS} 金幣重玩`,
    };
  }

  return {
    isOpenToday: true,
    meetsLevel: true,
    freeRemaining,
    usedToday,
    requiresCoinReplay,
    canStart: true,
    reason: null,
  };
}

function pickRareIngredient(score: number, playedAt: number): IngredientId {
  const pool: IngredientId[] = ['strawberry', 'corn', 'carrot'];
  const idx = Math.abs(Math.floor(score + playedAt)) % pool.length;
  return pool[idx];
}

export function calculateMinigameReward(result: MinigameResult): MinigameReward {
  const safeScore = Math.max(0, Math.round(result.score));

  if (result.gameId === 'apple') {
    return {
      coins: clampNum(Math.round(safeScore * 1.6) + 6, 8, 60),
      mood: 5,
      growth: 4,
      cleanliness: 0,
      intimacy: 0,
      ingredientReward: null,
    };
  }

  if (result.gameId === 'fries') {
    return {
      coins: clampNum(Math.round(safeScore * 1.45) + 6, 8, 60),
      mood: 5,
      growth: 4,
      cleanliness: 0,
      intimacy: 0,
      ingredientReward: null,
    };
  }

  if (result.gameId === 'mudBath') {
    const ratio = clampNum(safeScore / 30, 0, 1);
    return {
      coins: clampNum(Math.round(safeScore * 1.55) + 8, 10, 65),
      mood: Math.round(5 + ratio * 5),
      growth: 5,
      cleanliness: Math.round(20 + ratio * 15),
      intimacy: result.bathCompleted ? 1 : 0,
      ingredientReward: null,
    };
  }

  if (result.gameId === 'foodMemory') {
    const ratio = clampNum(safeScore / 52, 0, 1);
    const qty = safeScore >= 36 || (result.matchedPairs ?? 0) >= 6 ? 2 : 1;
    return {
      coins: clampNum(Math.round(safeScore * 0.95) + 12, 12, 75),
      mood: Math.round(6 + ratio * 6),
      growth: Math.round(5 + ratio * 5),
      cleanliness: 0,
      intimacy: 0,
      ingredientReward: {
        id: pickRareIngredient(safeScore, result.playedAt),
        qty,
      },
    };
  }

  // petRhythm (40s)
  const ratio = clampNum(safeScore / 220, 0, 1);
  return {
    coins: clampNum(Math.round(safeScore * 0.22) + 10, 12, 70),
    mood: Math.round(10 + ratio * 10),
    growth: 5,
    cleanliness: 0,
    intimacy: Math.round(2 + ratio * 3),
    ingredientReward: null,
  };
}

function evaluateUnlockedBadges(
  currentBadges: MinigameBadgeId[],
  result: MinigameResult,
  weeklyClaimedIds: MinigameWeeklyChallengeId[]
): { allBadges: MinigameBadgeId[]; newlyUnlocked: MinigameBadgeId[] } {
  const badgeSet = new Set<MinigameBadgeId>(currentBadges);
  const newlyUnlocked: MinigameBadgeId[] = [];

  const grant = (id: MinigameBadgeId) => {
    if (!badgeSet.has(id)) {
      badgeSet.add(id);
      newlyUnlocked.push(id);
    }
  };

  grant('first_play');

  if ((result.gameId === 'apple' || result.gameId === 'fries') && result.score >= 22) {
    grant('catch_master');
  }
  if (result.gameId === 'mudBath' && result.score >= 16 && result.bathCompleted) {
    grant('mud_cleaner');
  }
  if (
    result.gameId === 'foodMemory' &&
    (result.score >= 36 || (result.matchedPairs ?? 0) >= 6)
  ) {
    grant('memory_detective');
  }
  if (
    result.gameId === 'petRhythm' &&
    ((result.maxCombo ?? 0) >= 8 || result.score >= 140)
  ) {
    grant('rhythm_star');
  }
  if (weeklyClaimedIds.length >= MINIGAME_WEEKLY_CHALLENGES.length) {
    grant('weekly_champion');
  }

  return {
    allBadges: Array.from(badgeSet),
    newlyUnlocked,
  };
}

export function settleMinigameOutcome(
  prev: GameState,
  result: MinigameResult
): {
  nextState: GameState;
  reward: MinigameReward;
  isNewHighScore: boolean;
  newlyUnlockedBadges: MinigameBadgeId[];
} {
  const todayStr = getLocalDateKey();
  const weekKey = getLocalWeekKey();
  const syncedHub = syncMinigameHubState(prev.minigameHub, todayStr, weekKey);
  const reward = calculateMinigameReward(result);

  const prevHigh = syncedHub.highScores[result.gameId] ?? 0;
  const isNewHighScore = result.score > prevHigh;
  const nextHighScores: Record<MinigameId, number> = {
    ...syncedHub.highScores,
    [result.gameId]: Math.max(prevHigh, result.score),
  };

  const nextPlayCounts: Record<MinigameId, number> = {
    ...syncedHub.playCounts,
    [result.gameId]: (syncedHub.playCounts[result.gameId] ?? 0) + 1,
  };

  const nextDailyPlays: Record<MinigameId, number> = {
    ...syncedHub.dailyPlays,
    [result.gameId]: (syncedHub.dailyPlays[result.gameId] ?? 0) + 1,
  };

  const nextWeeklyPlayedGameIds = syncedHub.weeklyPlayedGameIds.includes(result.gameId)
    ? syncedHub.weeklyPlayedGameIds
    : [...syncedHub.weeklyPlayedGameIds, result.gameId];

  const { allBadges, newlyUnlocked } = evaluateUnlockedBadges(
    syncedHub.unlockedBadges,
    result,
    syncedHub.weeklyClaimedIds
  );

  const nextGrowth = prev.pet.growth + reward.growth;
  const nextIngredients = { ...prev.ingredients };
  if (reward.ingredientReward) {
    const { id, qty } = reward.ingredientReward;
    nextIngredients[id] = (nextIngredients[id] ?? 0) + qty;
  }

  const nextState: GameState = {
    ...prev,
    coins: prev.coins + reward.coins,
    ingredients: nextIngredients,
    pet: {
      ...prev.pet,
      mood: clampStatValue(prev.pet.mood + reward.mood),
      cleanliness: clampStatValue(prev.pet.cleanliness + reward.cleanliness),
      intimacy: prev.pet.intimacy + reward.intimacy,
      growth: nextGrowth,
      level: getGrowthStage(nextGrowth).level,
    },
    noviceGrowth: {
      ...prev.noviceGrowth,
      minigameCount: prev.noviceGrowth.minigameCount + 1,
    },
    minigameHub: {
      ...syncedHub,
      highScores: nextHighScores,
      playCounts: nextPlayCounts,
      dailyPlays: nextDailyPlays,
      weeklyPlayedGameIds: nextWeeklyPlayedGameIds,
      weeklyTotalScore: syncedHub.weeklyTotalScore + Math.max(0, result.score),
      weeklyRewardCount: syncedHub.weeklyRewardCount + 1,
      unlockedBadges: allBadges,
    },
  };

  return {
    nextState,
    reward,
    isNewHighScore,
    newlyUnlockedBadges: newlyUnlocked,
  };
}

export function getWeeklyChallengeProgress(
  hub: MinigameHubState,
  challengeId: MinigameWeeklyChallengeId
): number {
  if (challengeId === 'play_three_games') {
    return hub.weeklyPlayedGameIds.length;
  }
  if (challengeId === 'total_score_150') {
    return hub.weeklyTotalScore;
  }
  return hub.weeklyRewardCount;
}

export function claimWeeklyMinigameChallenge(
  prev: GameState,
  challengeId: MinigameWeeklyChallengeId
): { nextState: GameState; claimed: boolean; unlockedChampionBadge: boolean } {
  const challenge = MINIGAME_WEEKLY_CHALLENGES.find((c) => c.id === challengeId);
  if (!challenge) {
    return { nextState: prev, claimed: false, unlockedChampionBadge: false };
  }

  const syncedHub = syncMinigameHubState(prev.minigameHub);
  if (syncedHub.weeklyClaimedIds.includes(challengeId)) {
    return { nextState: prev, claimed: false, unlockedChampionBadge: false };
  }

  const currentProgress = getWeeklyChallengeProgress(syncedHub, challengeId);
  if (currentProgress < challenge.target) {
    return { nextState: prev, claimed: false, unlockedChampionBadge: false };
  }

  const nextClaimedIds: MinigameWeeklyChallengeId[] = [
    ...syncedHub.weeklyClaimedIds,
    challengeId,
  ];
  const badgeSet = new Set<MinigameBadgeId>(syncedHub.unlockedBadges);
  let unlockedChampionBadge = false;
  if (
    nextClaimedIds.length >= MINIGAME_WEEKLY_CHALLENGES.length &&
    !badgeSet.has('weekly_champion')
  ) {
    badgeSet.add('weekly_champion');
    unlockedChampionBadge = true;
  }

  const nextGrowth = prev.pet.growth + challenge.rewardGrowth;
  const nextState: GameState = {
    ...prev,
    coins: prev.coins + challenge.rewardCoins,
    pet: {
      ...prev.pet,
      growth: nextGrowth,
      level: getGrowthStage(nextGrowth).level,
    },
    minigameHub: {
      ...syncedHub,
      weeklyClaimedIds: nextClaimedIds,
      unlockedBadges: Array.from(badgeSet),
    },
  };

  return {
    nextState,
    claimed: true,
    unlockedChampionBadge,
  };
}

export function getSortedMinigamesForToday(todayStr: string = getLocalDateKey()) {
  const openIds = new Set(getDailyOpenMinigames(todayStr));
  return [...MINIGAMES].sort((a, b) => {
    const aOpen = openIds.has(a.id) ? 0 : 1;
    const bOpen = openIds.has(b.id) ? 0 : 1;
    return aOpen - bOpen;
  });
}
