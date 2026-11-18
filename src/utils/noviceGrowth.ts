import { NOVICE_GROWTH_DAYS, NoviceDayConfig } from '../data/noviceGrowth';
import { GameState, NoviceGrowthStats } from '../types';

export const NOVICE_GROWTH_STORAGE_KEY = 'mengchong_novice_growth_v1';

export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDateMs(dateStr: string): number | null {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!parts) return null;
  const year = Number(parts[1]);
  const month = Number(parts[2]) - 1;
  const day = Number(parts[3]);
  const ms = new Date(year, month, day).getTime();
  return Number.isFinite(ms) ? ms : null;
}

export function createInitialNoviceGrowthStats(todayStr: string = getLocalDateString()): NoviceGrowthStats {
  return {
    startedDate: todayStr,
    claimedDays: [],
    lastClaimDate: null,
    feedCount: 0,
    petCount: 0,
    plantedCarrotCount: 0,
    minigameCount: 0,
    cookedCount: 0,
    weightRecordCount: 0,
    boughtAccessoryCount: 0,
    walkCount: 0,
    fedFavoriteCount: 0,
    completedDailyTasksCount: 0,
    createdSharedRoom: false,
  };
}

export function getNoviceCurrentDay(startedDate: string, todayStr: string = getLocalDateString()): number {
  const startMs = parseLocalDateMs(startedDate);
  const todayMs = parseLocalDateMs(todayStr);
  if (startMs === null || todayMs === null) return 1;
  const diffDays = Math.floor((todayMs - startMs) / 86400000);
  return Math.min(7, Math.max(1, diffDays + 1));
}

export interface EvaluatedNoviceGoal {
  id: string;
  label: string;
  current: number;
  target: number;
  done: boolean;
}

export type NoviceClaimBlockReason =
  | 'already_claimed_day'
  | 'already_claimed_today'
  | 'future_day'
  | 'incomplete'
  | null;

export interface EvaluatedNoviceDay {
  config: NoviceDayConfig;
  goals: EvaluatedNoviceGoal[];
  allGoalsDone: boolean;
  isUnlockedByDay: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  blockReason: NoviceClaimBlockReason;
}

export function evaluateNoviceGoalProgress(
  goalId: string,
  target: number,
  game: GameState,
  hasSharedRoom: boolean
): number {
  const stats = game.noviceGrowth;
  const equippedCount = Object.values(game.pet.accessories).filter(Boolean).length;

  switch (goalId) {
    case 'hatch_and_name':
      return game.pet.hatched && game.pet.name.trim().length > 0 ? 1 : 0;
    case 'feed_1':
      return Math.min(target, Math.max(stats.feedCount, game.feedLogs.length));
    case 'pet_3':
      return Math.min(target, stats.petCount);
    case 'plant_carrot':
      return Math.min(
        target,
        Math.max(
          stats.plantedCarrotCount,
          game.farmPlots.some((p) => p.cropId === 'carrot') ? 1 : 0
        )
      );
    case 'minigame_1':
      return Math.min(target, stats.minigameCount);
    case 'cook_1':
      return Math.min(target, stats.cookedCount);
    case 'weigh_1':
      return Math.min(
        target,
        Math.max(
          stats.weightRecordCount,
          game.weightLogs.some((w) => w.foodName === '手動紀錄') ? 1 : 0
        )
      );
    case 'buy_accessory_1':
      return Math.min(
        target,
        Math.max(stats.boughtAccessoryCount, game.accessories.length > 4 ? 1 : 0)
      );
    case 'equip_2':
      return Math.min(target, equippedCount);
    case 'daily_tasks_3':
    case 'daily_tasks_5':
      return Math.min(target, stats.completedDailyTasksCount);
    case 'walk_1':
      return Math.min(target, stats.walkCount);
    case 'reach_lv2':
      return game.pet.level >= 2 ? 1 : 0;
    case 'feed_favorite_1':
      return Math.min(target, stats.fedFavoriteCount);
    case 'shared_room_1':
      return stats.createdSharedRoom || hasSharedRoom ? 1 : 0;
    default:
      return 0;
  }
}

export function evaluateAllNoviceDays(
  game: GameState,
  hasSharedRoom: boolean,
  todayStr: string = getLocalDateString()
): {
  currentDayIndex: number;
  claimedToday: boolean;
  days: EvaluatedNoviceDay[];
  claimableCount: number;
} {
  const stats = game.noviceGrowth;
  const currentDayIndex = getNoviceCurrentDay(stats.startedDate, todayStr);
  const claimedToday = stats.lastClaimDate === todayStr;

  const days: EvaluatedNoviceDay[] = NOVICE_GROWTH_DAYS.map((config) => {
    const goals: EvaluatedNoviceGoal[] = config.goals.map((g) => {
      const current = evaluateNoviceGoalProgress(g.id, g.target, game, hasSharedRoom);
      return {
        id: g.id,
        label: g.label,
        current,
        target: g.target,
        done: current >= g.target,
      };
    });

    const allGoalsDone = config.matchAnyGoal
      ? goals.some((g) => g.done)
      : goals.every((g) => g.done);
    const isClaimed = stats.claimedDays.includes(config.day);
    const isUnlockedByDay = config.day <= currentDayIndex;

    let blockReason: NoviceClaimBlockReason = null;
    if (isClaimed) {
      blockReason = 'already_claimed_day';
    } else if (!isUnlockedByDay) {
      blockReason = 'future_day';
    } else if (!allGoalsDone) {
      blockReason = 'incomplete';
    } else if (claimedToday) {
      blockReason = 'already_claimed_today';
    }

    return {
      config,
      goals,
      allGoalsDone,
      isUnlockedByDay,
      isClaimed,
      canClaim: blockReason === null,
      blockReason,
    };
  });

  const claimableCount = claimedToday
    ? 0
    : Math.min(1, days.filter((d) => d.canClaim).length);

  return {
    currentDayIndex,
    claimedToday,
    days,
    claimableCount,
  };
}

export function saveNoviceGrowthMirror(stats: NoviceGrowthStats): void {
  try {
    localStorage.setItem(NOVICE_GROWTH_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage errors gracefully
  }
}

export function clearNoviceGrowthMirror(): void {
  try {
    localStorage.removeItem(NOVICE_GROWTH_STORAGE_KEY);
  } catch {
    // Ignore storage errors gracefully
  }
}
