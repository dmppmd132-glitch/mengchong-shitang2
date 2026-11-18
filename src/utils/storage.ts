import { INITIAL_UNLOCKED_ACCESSORIES } from '../data/accessories';
import { INITIAL_FOOD_INVENTORY } from '../data/foods';
import { getGrowthStage } from '../data/growth';
import {
  FARM_DECORATION_BY_ID,
  FLOORING_BY_ID,
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEM_BY_ID,
  SHARED_GOAL_BY_ID,
  WALLPAPER_BY_ID,
  getZoneForCell,
} from '../data/house';
import {
  INGREDIENT_IDS,
  INGREDIENTS,
  createInitialFarmPlots,
  createInitialIngredients,
} from '../data/kitchen';
import { createInitialDailyTasks } from '../data/quests';
import { isValidStickerId } from '../data/stickers';
import { PERSONALITY_IDS } from '../data/personality';
import { COOP_BADGES, COOP_FARM_DAILY_ORDERS } from '../data/coop';
import { WEATHER_META } from '../data/dialogue';
import {
  AccessorySlot,
  CoopBadgeId,
  CoopFarmOrderState,
  CoopGameType,
  CoopHubState,
  CoopMessageCard,
  CoopOfflineEvent,
  CoopReward,
  CoopRoomCandidate,
  CoopSession,
  CropPlot,
  DailyTask,
  DialogueCategory,
  DialogueLine,
  DialogueResponse,
  DialogueState,
  EncyclopediaState,
  FarmDecorationId,
  FeedLog,
  FlooringId,
  FurnitureNote,
  GameState,
  IngredientId,
  NoviceGrowthStats,
  PersonalityId,
  Pet,
  PetMemoryEvent,
  PetMemoryEventType,
  PetMessage,
  PetPersonality,
  PetSpecies,
  PlacedRoomItem,
  RoomPhotoPoseId,
  RoomPhotoRecord,
  SharedGoalId,
  SharedHouse,
  SharedMilestoneId,
  StageBackgroundId,
  ThemeSetId,
  TimePeriodId,
  TitleId,
  TreasuryContribution,
  WallpaperId,
  WeatherCondition,
  WeatherState,
  WeightLog,
} from '../types';
import {
  MinigameBadgeId,
  MinigameHubState,
  MinigameId,
  MinigameWeeklyChallengeId,
} from '../types/minigame';
import {
  createDailyFarmOrder,
  createInitialCoopHubState,
  createZeroWarehouse,
  syncCoopHubState,
} from './coop';
import {
  createInitialDialogueState,
  createInitialWeatherState,
  getRandomProactiveCooldownMs,
  syncDialogueDaily,
} from './dialogue';
import { createInitialEncyclopediaState } from './encyclopedia';
import { createInitialSharedHouse, syncHouseProgress } from './house';
import {
  createInitialMinigameHubState,
  createZeroRecord,
  getLocalDateKey,
  getLocalWeekKey,
  isMinigameBadgeId,
  isMinigameId,
  isWeeklyChallengeId,
  syncMinigameHubState,
} from './minigame';
import {
  clearNoviceGrowthMirror,
  createInitialNoviceGrowthStats,
  saveNoviceGrowthMirror,
} from './noviceGrowth';
import { createInitialPetPersonality } from './personality';

export const STORAGE_KEY = 'mengchong_canteen_save_v2';
const LEGACY_STORAGE_KEY = 'mengchong_canteen_save_v1';

export function formatLocalDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatLocalTime(date: Date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function roundWeight(val: number): number {
  return Math.round(val * 10) / 10;
}

export function clampWeight(val: number): number {
  return Math.min(30, Math.max(0.5, roundWeight(val)));
}

export function clampStat(val: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(val)));
}

export function createInitialPet(): Pet {
  return {
    id: 'pet_1',
    name: '布丁',
    species: 'pig',
    level: 1,
    growth: 0,
    intimacy: 10,
    hunger: 72,
    mood: 82,
    cleanliness: 88,
    energy: 85,
    weight: 8.5,
    roundness: 28,
    accessories: {
      head: 'pink_bow',
      face: null,
      neck: null,
      body: null,
    },
    hatched: false,
    consecutiveFastFood: 0,
  };
}

export function createInitialGameState(): GameState {
  const today = formatLocalDate();
  return {
    version: 2,
    pet: createInitialPet(),
    coins: 120,
    furnitureShards: 0,
    foods: { ...INITIAL_FOOD_INVENTORY },
    ingredients: createInitialIngredients(),
    farmPlots: createInitialFarmPlots(4),
    accessories: [...INITIAL_UNLOCKED_ACCESSORIES],
    weightLogs: [],
    feedLogs: [],
    dailyTasks: createInitialDailyTasks(),
    dailyTasksDate: today,
    messages: [],
    soundEnabled: true,
    lastSavedAt: Date.now(),
    noviceGrowth: createInitialNoviceGrowthStats(today),
    encyclopedia: createInitialEncyclopediaState(),
    unlockedBackgrounds: ['default'],
    activeBackground: 'default',
    minigameHub: createInitialMinigameHubState(today),
    house: createInitialSharedHouse(),
    personality: createInitialPetPersonality('pig'),
    coop: createInitialCoopHubState(today),
    dialogue: createInitialDialogueState(today),
  };
}

export function applyTimeDecay(pet: Pet, elapsedMs: number): Pet {
  if (elapsedMs <= 0) return pet;
  const elapsedMinutes = Math.min(elapsedMs / 60000, 720);
  const hungerLoss = elapsedMinutes * 0.14;
  const moodLoss = elapsedMinutes * 0.09;
  const cleanLoss = elapsedMinutes * 0.08;
  const energyLoss = elapsedMinutes * 0.1;

  return {
    ...pet,
    hunger: clampStat(pet.hunger - hungerLoss, 0, 100),
    mood: clampStat(pet.mood - moodLoss, 0, 100),
    cleanliness: clampStat(pet.cleanliness - cleanLoss, 0, 100),
    energy: clampStat(pet.energy - energyLoss, 0, 100),
  };
}

export function syncDailyTasks(
  tasks: DailyTask[],
  tasksDate: string
): { dailyTasks: DailyTask[]; dailyTasksDate: string } {
  const today = formatLocalDate();
  if (tasksDate === today && tasks.length > 0) {
    return { dailyTasks: tasks, dailyTasksDate: tasksDate };
  }
  return {
    dailyTasks: createInitialDailyTasks(),
    dailyTasksDate: today,
  };
}

export function incrementTaskProgress(
  tasks: DailyTask[],
  taskId: string,
  amount = 1
): DailyTask[] {
  return tasks.map((task) => {
    if (task.id !== taskId) return task;
    const nextProgress = Math.min(task.target, task.progress + amount);
    return {
      ...task,
      progress: nextProgress,
      completed: nextProgress >= task.target,
    };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function asSpecies(value: unknown): PetSpecies {
  if (value === 'pig' || value === 'rabbit' || value === 'dog') {
    return value;
  }
  return 'pig';
}

function parseAccessoriesRecord(
  raw: unknown,
  fallback: Record<AccessorySlot, string | null>
): Record<AccessorySlot, string | null> {
  if (!isRecord(raw)) return { ...fallback };
  return {
    head: asNullableString(raw.head ?? raw['頭部']) ?? null,
    face: asNullableString(raw.face ?? raw['臉部']) ?? null,
    neck: asNullableString(raw.neck ?? raw['脖子']) ?? null,
    body: asNullableString(raw.body ?? raw['身體']) ?? null,
  };
}

function parseStringNumberRecord(
  raw: unknown,
  fallback: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = { ...fallback };
  if (!isRecord(raw)) return result;
  for (const [key, val] of Object.entries(raw)) {
    if (typeof val === 'number' && Number.isFinite(val)) {
      result[key] = val;
    }
  }
  return result;
}

function asIngredientId(value: unknown): IngredientId | null {
  if (
    value === 'carrot' ||
    value === 'corn' ||
    value === 'strawberry' ||
    value === 'pumpkin' ||
    value === 'blueberry' ||
    value === 'mint' ||
    value === 'sunflower'
  ) {
    return value;
  }
  return null;
}

function parseIngredients(
  raw: unknown,
  fallback: Record<IngredientId, number>
): Record<IngredientId, number> {
  const result: Record<IngredientId, number> = { ...fallback };
  if (!isRecord(raw)) return result;
  INGREDIENT_IDS.forEach((key) => {
    const val = raw[key];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      result[key] = Math.floor(val);
    }
  });
  return result;
}

function parseFarmPlots(raw: unknown, unlockedFarmPlots = 4): CropPlot[] {
  const safePlotCount = Math.min(8, Math.max(4, unlockedFarmPlots));
  const defaults = createInitialFarmPlots(safePlotCount);
  if (!Array.isArray(raw)) return defaults;

  const byId = new Map<number, Record<string, unknown>>();
  for (const item of raw) {
    if (isRecord(item) && typeof item.id === 'number' && Number.isInteger(item.id)) {
      byId.set(item.id, item);
    }
  }

  return defaults.map((template) => {
    const saved = byId.get(template.id);
    if (!saved) return template;
    const cropId = asIngredientId(saved.cropId);
    if (!cropId) return template;
    const defaultDuration = INGREDIENTS[cropId].growSeconds * 1000;
    const plantedAt =
      typeof saved.plantedAt === 'number' && Number.isFinite(saved.plantedAt)
        ? saved.plantedAt
        : Date.now();
    const durationMs =
      typeof saved.durationMs === 'number' && Number.isFinite(saved.durationMs) && saved.durationMs > 0
        ? saved.durationMs
        : defaultDuration;
    return {
      id: template.id,
      cropId,
      plantedAt,
      durationMs,
    };
  });
}

function parseWeightLogs(raw: unknown): WeightLog[] {
  if (!Array.isArray(raw)) return [];
  const logs: WeightLog[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = asString(item.id, '');
    if (!id) continue;
    logs.push({
      id,
      date: asString(item.date ?? item.dateStr, formatLocalDate()),
      weight: asNumber(item.weight ?? item.weightAfter, 8.5),
      foodName: asString(item.foodName ?? item.sourceName, '紀錄'),
      note: asString(item.note, ''),
      weightDelta: asNumber(item.weightDelta, 0),
      timeStr: asString(item.timeStr, '00:00'),
      timestamp: asNumber(item.timestamp, Date.now()),
    });
  }
  return logs;
}

function parseFeedLogs(raw: unknown): FeedLog[] {
  if (!Array.isArray(raw)) return [];
  const logs: FeedLog[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = asString(item.id, '');
    if (!id) continue;
    logs.push({
      id,
      date: asString(item.date, formatLocalDate()),
      foodId: asString(item.foodId, ''),
      weightChange: asNumber(item.weightChange, 0),
    });
  }
  return logs;
}

function parsePetMessages(raw: unknown): PetMessage[] {
  if (!Array.isArray(raw)) return [];
  const messages: PetMessage[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const id = asString(item.id, '');
    if (!id) continue;
    const content = asString(item.content, '');
    const stickerId = isValidStickerId(item.stickerId) ? item.stickerId : null;
    if (!content && !stickerId) continue;
    messages.push({
      id,
      authorId: asString(item.authorId, 'local'),
      authorName: asString(item.authorName, '飼主'),
      content,
      stickerId,
      createdAt: asNumber(item.createdAt, Date.now()),
    });
  }
  return messages.slice(-80);
}

function parseDailyTasks(raw: unknown): DailyTask[] {
  const defaults = createInitialDailyTasks();
  if (!Array.isArray(raw)) return defaults;
  const byId = new Map<string, Record<string, unknown>>();
  for (const item of raw) {
    if (isRecord(item) && typeof item.id === 'string') {
      byId.set(item.id, item);
    }
  }
  return defaults.map((template) => {
    const saved = byId.get(template.id);
    if (!saved) return template;
    const progress = Math.min(template.target, asNumber(saved.progress, 0));
    return {
      ...template,
      progress,
      completed: typeof saved.completed === 'boolean' ? saved.completed : progress >= template.target,
      claimed: typeof saved.claimed === 'boolean' ? saved.claimed : false,
    };
  });
}

function parseNoviceGrowth(
  raw: unknown,
  fallbackDate: string,
  seedFeedCount: number,
  seedWeightCount: number,
  seedUnlockedAccessoriesCount: number,
  seedClaimedDailyCount: number
): NoviceGrowthStats {
  const defaults = createInitialNoviceGrowthStats(fallbackDate);
  if (!isRecord(raw)) {
    return {
      ...defaults,
      feedCount: seedFeedCount,
      weightRecordCount: seedWeightCount,
      boughtAccessoryCount: Math.max(0, seedUnlockedAccessoriesCount - 4),
      completedDailyTasksCount: seedClaimedDailyCount,
    };
  }
  const claimedDays = Array.isArray(raw.claimedDays)
    ? Array.from(
        new Set(
          raw.claimedDays.filter(
            (d): d is number => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 7
          )
        )
      ).sort((a, b) => a - b)
    : [];

  return {
    startedDate: asString(raw.startedDate, fallbackDate),
    claimedDays,
    lastClaimDate: typeof raw.lastClaimDate === 'string' ? raw.lastClaimDate : null,
    feedCount: Math.max(seedFeedCount, Math.floor(asNumber(raw.feedCount, 0))),
    petCount: Math.max(0, Math.floor(asNumber(raw.petCount, 0))),
    plantedCarrotCount: Math.max(0, Math.floor(asNumber(raw.plantedCarrotCount, 0))),
    minigameCount: Math.max(0, Math.floor(asNumber(raw.minigameCount, 0))),
    cookedCount: Math.max(0, Math.floor(asNumber(raw.cookedCount, 0))),
    weightRecordCount: Math.max(seedWeightCount, Math.floor(asNumber(raw.weightRecordCount, 0))),
    boughtAccessoryCount: Math.max(
      Math.max(0, seedUnlockedAccessoriesCount - 4),
      Math.floor(asNumber(raw.boughtAccessoryCount, 0))
    ),
    walkCount: Math.max(0, Math.floor(asNumber(raw.walkCount, 0))),
    fedFavoriteCount: Math.max(0, Math.floor(asNumber(raw.fedFavoriteCount, 0))),
    completedDailyTasksCount: Math.max(
      seedClaimedDailyCount,
      Math.floor(asNumber(raw.completedDailyTasksCount, 0))
    ),
    createdSharedRoom: typeof raw.createdSharedRoom === 'boolean' ? raw.createdSharedRoom : false,
  };
}

function asTitleId(value: unknown): TitleId | null {
  if (
    value === 'gourmet_owner' ||
    value === 'fashion_stylist' ||
    value === 'strawberry_dreamer' ||
    value === 'forest_camper' ||
    value === 'cloud_napper' ||
    value === 'coop_partner'
  ) {
    return value;
  }
  return null;
}

function parseEncyclopedia(raw: unknown, seedFoodIds: string[]): EncyclopediaState {
  const defaults = createInitialEncyclopediaState(seedFoodIds);
  if (!isRecord(raw)) return defaults;

  const rawFoods = Array.isArray(raw.collectedFoodIds)
    ? raw.collectedFoodIds.filter((x): x is string => typeof x === 'string')
    : [];
  const mergedFoods = Array.from(new Set([...defaults.collectedFoodIds, ...rawFoods]));

  const claimedAccessoryMilestones = Array.isArray(raw.claimedAccessoryMilestones)
    ? Array.from(
        new Set(
          raw.claimedAccessoryMilestones.filter(
            (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 5
          )
        )
      ).sort((a, b) => a - b)
    : [];

  const unlockedTitles = Array.isArray(raw.unlockedTitles)
    ? Array.from(
        new Set(raw.unlockedTitles.map(asTitleId).filter((t): t is TitleId => t !== null))
      )
    : [];

  const candidateActive = asTitleId(raw.activeTitle);
  const activeTitle =
    candidateActive && unlockedTitles.includes(candidateActive)
      ? candidateActive
      : unlockedTitles[0] ?? null;

  return {
    collectedFoodIds: mergedFoods,
    claimedAccessoryMilestones,
    unlockedTitles,
    activeTitle,
  };
}

function asStageBackgroundId(value: unknown): StageBackgroundId {
  if (value === 'starlight_garden') return 'starlight_garden';
  return 'default';
}

function parseMinigameRecord(raw: unknown): Record<MinigameId, number> {
  const base = createZeroRecord();
  if (!isRecord(raw)) return base;
  (Object.keys(base) as MinigameId[]).forEach((key) => {
    const val = raw[key];
    if (typeof val === 'number' && Number.isFinite(val) && val >= 0) {
      base[key] = Math.floor(val);
    }
  });
  return base;
}

function parseMinigameHub(raw: unknown): MinigameHubState {
  const todayStr = getLocalDateKey();
  const weekKey = getLocalWeekKey();
  const defaults = createInitialMinigameHubState(todayStr, weekKey);
  if (!isRecord(raw)) return defaults;

  const weeklyPlayedGameIds = Array.isArray(raw.weeklyPlayedGameIds)
    ? Array.from(new Set(raw.weeklyPlayedGameIds.filter(isMinigameId)))
    : [];

  const weeklyClaimedIds = Array.isArray(raw.weeklyClaimedIds)
    ? Array.from(new Set(raw.weeklyClaimedIds.filter(isWeeklyChallengeId)))
    : [];

  const unlockedBadges = Array.from(
    new Set(
      (Array.isArray(raw.unlockedBadges) ? raw.unlockedBadges : []).filter(
        (b): b is MinigameBadgeId => isMinigameBadgeId(b)
      )
    )
  );

  const parsed: MinigameHubState = {
    highScores: parseMinigameRecord(raw.highScores),
    playCounts: parseMinigameRecord(raw.playCounts),
    dailyDate: asString(raw.dailyDate, todayStr),
    dailyPlays: parseMinigameRecord(raw.dailyPlays),
    weekKey: asString(raw.weekKey, weekKey),
    weeklyPlayedGameIds,
    weeklyTotalScore: Math.max(0, Math.floor(asNumber(raw.weeklyTotalScore, 0))),
    weeklyRewardCount: Math.max(0, Math.floor(asNumber(raw.weeklyRewardCount, 0))),
    weeklyClaimedIds,
    unlockedBadges,
  };

  return syncMinigameHubState(parsed, todayStr, weekKey);
}

function parseStageBackgrounds(raw: unknown): StageBackgroundId[] {
  const result = new Set<StageBackgroundId>(['default']);
  if (Array.isArray(raw)) {
    for (const item of raw) {
      result.add(asStageBackgroundId(item));
    }
  }
  return Array.from(result);
}

function asWallpaperId(value: unknown): WallpaperId {
  if (typeof value === 'string' && value in WALLPAPER_BY_ID) {
    return value as WallpaperId;
  }
  return 'cream_warm';
}

function asFlooringId(value: unknown): FlooringId {
  if (typeof value === 'string' && value in FLOORING_BY_ID) {
    return value as FlooringId;
  }
  return 'oak_wood';
}

function asThemeSetId(value: unknown): ThemeSetId | null {
  if (value === 'strawberry_sweet' || value === 'forest_camp' || value === 'cloud_nap') {
    return value;
  }
  return null;
}

function asPhotoPoseId(value: unknown): RoomPhotoPoseId {
  if (
    value === 'normal' ||
    value === 'happy_jump' ||
    value === 'sleepy_cozy' ||
    value === 'berry_heart' ||
    value === 'camp_cheer' ||
    value === 'cloud_float'
  ) {
    return value;
  }
  return 'normal';
}

function asFarmDecorationId(value: unknown): FarmDecorationId | null {
  if (typeof value === 'string' && value in FARM_DECORATION_BY_ID) {
    return value as FarmDecorationId;
  }
  return null;
}

function asSharedGoalId(value: unknown): SharedGoalId {
  if (typeof value === 'string' && value in SHARED_GOAL_BY_ID) {
    return value as SharedGoalId;
  }
  return 'goal_cloud_bed';
}

function asSharedMilestoneId(value: unknown): SharedMilestoneId | null {
  if (
    value === 'first_furniture' ||
    value === 'four_zones_filled' ||
    value === 'theme_room_complete' ||
    value === 'farm_expanded' ||
    value === 'shared_goal_completed' ||
    value === 'first_room_photo'
  ) {
    return value;
  }
  return null;
}

function parsePlacedItems(raw: unknown): PlacedRoomItem[] {
  if (!Array.isArray(raw)) return [];
  const occupied = new Set<string>();
  const list: PlacedRoomItem[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const itemId = asString(item.itemId, '');
    if (!itemId || !(itemId in ROOM_ITEM_BY_ID)) continue;
    const x = Math.floor(asNumber(item.x, -1));
    const y = Math.floor(asNumber(item.y, -1));
    if (x < 0 || x >= ROOM_GRID_COLS || y < 0 || y >= ROOM_GRID_ROWS) continue;
    const cellKey = `${x}_${y}`;
    if (occupied.has(cellKey)) continue;
    occupied.add(cellKey);
    list.push({
      instanceId: asString(item.instanceId, `rm_${Date.now()}_${x}_${y}`),
      itemId,
      x,
      y,
      zone: getZoneForCell(x, y),
      placedBy: typeof item.placedBy === 'string' ? item.placedBy : undefined,
      updatedAt: asNumber(item.updatedAt, Date.now()),
    });
  }
  return list;
}

function parseSharedHouse(raw: unknown): SharedHouse {
  const defaults = createInitialSharedHouse();
  if (!isRecord(raw)) return defaults;

  const rawLayout = isRecord(raw.roomLayout) ? raw.roomLayout : {};
  const unlockedWallpapers = Array.from(
    new Set<WallpaperId>([
      'cream_warm',
      ...(Array.isArray(raw.unlockedWallpapers) ? raw.unlockedWallpapers.map(asWallpaperId) : []),
    ])
  );
  const unlockedFloorings = Array.from(
    new Set<FlooringId>([
      'oak_wood',
      ...(Array.isArray(raw.unlockedFloorings) ? raw.unlockedFloorings.map(asFlooringId) : []),
    ])
  );
  const reqWall = asWallpaperId(rawLayout.wallpaperId);
  const reqFloor = asFlooringId(rawLayout.flooringId);

  const ownedFurnitureCounts: Record<string, number> = {};
  if (isRecord(raw.ownedFurnitureCounts)) {
    for (const [k, v] of Object.entries(raw.ownedFurnitureCounts)) {
      if (k in ROOM_ITEM_BY_ID && typeof v === 'number' && Number.isFinite(v) && v > 0) {
        ownedFurnitureCounts[k] = Math.floor(v);
      }
    }
  }

  const placedItems = parsePlacedItems(rawLayout.placedItems);
  const collectedSet = new Set<string>(
    Array.isArray(raw.collectedFurnitureIds)
      ? raw.collectedFurnitureIds.filter((id): id is string => typeof id === 'string' && id in ROOM_ITEM_BY_ID)
      : []
  );
  Object.keys(ownedFurnitureCounts).forEach((id) => collectedSet.add(id));

  const claimedFurnitureMilestones = Array.isArray(raw.claimedFurnitureMilestones)
    ? Array.from(
        new Set(
          raw.claimedFurnitureMilestones.filter(
            (n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 5
          )
        )
      ).sort((a, b) => a - b)
    : [];

  const completedThemeSets = Array.isArray(raw.completedThemeSets)
    ? Array.from(new Set(raw.completedThemeSets.map(asThemeSetId).filter((t): t is ThemeSetId => t !== null)))
    : [];

  const unlockedPhotoPoses = Array.from(
    new Set<RoomPhotoPoseId>([
      'normal',
      'happy_jump',
      'sleepy_cozy',
      ...(Array.isArray(raw.unlockedPhotoPoses) ? raw.unlockedPhotoPoses.map(asPhotoPoseId) : []),
    ])
  );

  const rawUpgrades = isRecord(raw.farmUpgrades) ? raw.farmUpgrades : {};
  const ownedFarmDecorations = Array.isArray(raw.ownedFarmDecorations)
    ? Array.from(
        new Set(
          raw.ownedFarmDecorations
            .map(asFarmDecorationId)
            .filter((d): d is FarmDecorationId => d !== null)
        )
      )
    : [];

  const rawActiveDecor = isRecord(raw.activeFarmDecor) ? raw.activeFarmDecor : {};
  const fenceId = asFarmDecorationId(rawActiveDecor.fenceId);
  const flowerbedId = asFarmDecorationId(rawActiveDecor.flowerbedId);
  const signId = asFarmDecorationId(rawActiveDecor.signId);

  const treasuryHistory: TreasuryContribution[] = Array.isArray(raw.treasuryHistory)
    ? raw.treasuryHistory
        .filter((h): h is Record<string, unknown> => isRecord(h))
        .map((h) => ({
          id: asString(h.id, `tr_${Date.now()}`),
          authorName: asString(h.authorName, '飼主'),
          amount: Math.max(0, Math.floor(asNumber(h.amount, 0))),
          createdAt: asNumber(h.createdAt, Date.now()),
        }))
        .slice(0, 20)
    : [];

  const completedGoalIds = Array.isArray(raw.completedGoalIds)
    ? Array.from(
        new Set(
          raw.completedGoalIds
            .map((g) => (typeof g === 'string' && g in SHARED_GOAL_BY_ID ? (g as SharedGoalId) : null))
            .filter((g): g is SharedGoalId => g !== null)
        )
      )
    : [];

  const furnitureNotes: FurnitureNote[] = Array.isArray(raw.furnitureNotes)
    ? raw.furnitureNotes
        .filter((n): n is Record<string, unknown> => isRecord(n))
        .map((n) => ({
          id: asString(n.id, `fn_${Date.now()}`),
          itemId: asString(n.itemId, ''),
          authorName: asString(n.authorName, '飼主'),
          content: asString(n.content, ''),
          createdAt: asNumber(n.createdAt, Date.now()),
        }))
        .filter((n) => n.itemId && n.content)
        .slice(0, 60)
    : [];

  const achievedMilestones = Array.isArray(raw.achievedMilestones)
    ? Array.from(
        new Set(
          raw.achievedMilestones
            .map(asSharedMilestoneId)
            .filter((m): m is SharedMilestoneId => m !== null)
        )
      )
    : [];

  const claimedMilestones = Array.isArray(raw.claimedMilestones)
    ? Array.from(
        new Set(
          raw.claimedMilestones
            .map(asSharedMilestoneId)
            .filter((m): m is SharedMilestoneId => m !== null)
        )
      )
    : [];

  const photos: RoomPhotoRecord[] = Array.isArray(raw.photos)
    ? raw.photos
        .filter((p): p is Record<string, unknown> => isRecord(p))
        .map((p) => ({
          id: asString(p.id, `photo_${Date.now()}`),
          title: asString(p.title, '小屋合照'),
          caption: asString(p.caption, ''),
          createdAt: asNumber(p.createdAt, Date.now()),
          houseName: asString(p.houseName, '萌寵暖暖小屋'),
          species: asSpecies(p.species),
          petName: asString(p.petName, '布丁'),
          equipped: parseAccessoriesRecord(p.equipped, {
            head: null,
            face: null,
            neck: null,
            body: null,
          }),
          poseId: asPhotoPoseId(p.poseId),
          wallpaperId: asWallpaperId(p.wallpaperId),
          flooringId: asFlooringId(p.flooringId),
          placedItems: parsePlacedItems(p.placedItems),
          noteHighlight: typeof p.noteHighlight === 'string' ? p.noteHighlight : undefined,
        }))
        .slice(0, 24)
    : [];

  return {
    houseName: asString(raw.houseName, defaults.houseName).slice(0, 14) || defaults.houseName,
    roomLayout: {
      cols: ROOM_GRID_COLS,
      rows: ROOM_GRID_ROWS,
      wallpaperId: unlockedWallpapers.includes(reqWall) ? reqWall : 'cream_warm',
      flooringId: unlockedFloorings.includes(reqFloor) ? reqFloor : 'oak_wood',
      placedItems,
    },
    ownedFurnitureCounts,
    collectedFurnitureIds: Array.from(collectedSet),
    unlockedWallpapers,
    unlockedFloorings,
    claimedFurnitureMilestones,
    completedThemeSets,
    unlockedPhotoPoses,
    unlockedFarmPlots: Math.min(8, Math.max(4, Math.floor(asNumber(raw.unlockedFarmPlots, 4)))),
    farmUpgrades: {
      sprinklerLevel: Math.min(1, Math.max(0, Math.floor(asNumber(rawUpgrades.sprinklerLevel, 0)))),
      greenhouseLevel: Math.min(1, Math.max(0, Math.floor(asNumber(rawUpgrades.greenhouseLevel, 0)))),
      storageLevel: Math.min(3, Math.max(0, Math.floor(asNumber(rawUpgrades.storageLevel, 0)))),
    },
    ownedFarmDecorations,
    activeFarmDecor: {
      fenceId: fenceId && ownedFarmDecorations.includes(fenceId) ? fenceId : null,
      flowerbedId: flowerbedId && ownedFarmDecorations.includes(flowerbedId) ? flowerbedId : null,
      signId: signId && ownedFarmDecorations.includes(signId) ? signId : null,
    },
    treasuryCoins: Math.max(0, Math.floor(asNumber(raw.treasuryCoins, 0))),
    treasuryHistory,
    activeGoalId: asSharedGoalId(raw.activeGoalId),
    completedGoalIds,
    furnitureNotes,
    achievedMilestones,
    claimedMilestones,
    photos,
  };
}

function asPersonalityId(value: unknown): PersonalityId | null {
  if (typeof value === 'string' && PERSONALITY_IDS.includes(value as PersonalityId)) {
    return value as PersonalityId;
  }
  return null;
}

function parsePetPersonality(raw: unknown, species: PetSpecies): PetPersonality {
  const defaults = createInitialPetPersonality(species);
  if (!isRecord(raw)) return defaults;

  const scores: Record<PersonalityId, number> = { ...defaults.scores };
  if (isRecord(raw.scores)) {
    for (const id of PERSONALITY_IDS) {
      const val = raw.scores[id];
      if (typeof val === 'number' && Number.isFinite(val)) {
        scores[id] = clampStat(val, 0, 100);
      }
    }
  }

  const primary = asPersonalityId(raw.primary) ?? defaults.primary;
  let secondary = asPersonalityId(raw.secondary) ?? defaults.secondary;
  if (secondary === primary) {
    secondary = PERSONALITY_IDS.find((id) => id !== primary) ?? defaults.secondary;
  }

  const careActionCounts: Record<string, number> = {};
  if (isRecord(raw.careActionCounts)) {
    for (const [k, v] of Object.entries(raw.careActionCounts)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        careActionCounts[k] = Math.floor(v);
      }
    }
  }

  return {
    primary,
    secondary,
    scores,
    careActionCounts,
    lastUpdatedAt: asNumber(raw.lastUpdatedAt, defaults.lastUpdatedAt),
  };
}

function asCoopBadgeId(value: unknown): CoopBadgeId | null {
  if (typeof value === 'string' && value in COOP_BADGES) {
    return value as CoopBadgeId;
  }
  return null;
}

function asCoopGameType(value: unknown): CoopGameType {
  return value === 'farm_relay' ? 'farm_relay' : 'room_decor';
}

function parseCoopSession(raw: unknown): CoopSession | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id, '');
  if (!id) return null;

  const statusRaw = raw.status;
  const status: CoopSession['status'] =
    statusRaw === 'active' ||
    statusRaw === 'completed' ||
    statusRaw === 'expired'
      ? statusRaw
      : 'idle';

  const themeId = asThemeSetId(raw.themeId) ?? 'strawberry_sweet';
  const rawGoal = isRecord(raw.goal) ? raw.goal : {};
  const rawProgress = isRecord(raw.progress) ? raw.progress : {};

  const candidateQueue: CoopRoomCandidate[] = Array.isArray(raw.candidateQueue)
    ? raw.candidateQueue
        .filter((c): c is Record<string, unknown> => isRecord(c))
        .map((c) => ({
          queueId: asString(c.queueId, `q_${Date.now()}`),
          itemId: asString(c.itemId, ''),
          selectedByUserId: asString(c.selectedByUserId, 'local'),
          selectedByName: asString(c.selectedByName, '夥伴'),
          selectedAt: asNumber(c.selectedAt, Date.now()),
          placed: typeof c.placed === 'boolean' ? c.placed : false,
        }))
        .filter((c) => c.itemId in ROOM_ITEM_BY_ID)
    : [];

  const placedInstanceIds = Array.isArray(raw.placedInstanceIds)
    ? raw.placedInstanceIds.filter((x): x is string => typeof x === 'string')
    : [];

  return {
    id,
    gameType: 'room_decor',
    status,
    themeId,
    goal: {
      id: asString(rawGoal.id, `goal_${themeId}`),
      gameType: 'room_decor',
      title: asString(rawGoal.title, '合作房間佈置'),
      description: asString(rawGoal.description, ''),
      themeId,
      targetItemCount: Math.max(1, Math.floor(asNumber(rawGoal.targetItemCount, 6))),
    },
    progress: {
      completedCount: Math.max(0, Math.floor(asNumber(rawProgress.completedCount, 0))),
      targetCount: Math.max(1, Math.floor(asNumber(rawProgress.targetCount, 6))),
      harvestedCount: 0,
      harvestTarget: 0,
      craftedCount: 0,
      craftTarget: 0,
      foodsDone: {},
    },
    startedAt: asNumber(raw.startedAt, Date.now()),
    expiresAt: asNumber(raw.expiresAt, Date.now()),
    durationSeconds: Math.max(30, Math.floor(asNumber(raw.durationSeconds, 90))),
    candidateQueue,
    placedInstanceIds,
    settled: typeof raw.settled === 'boolean' ? raw.settled : false,
    rewardId: typeof raw.rewardId === 'string' ? raw.rewardId : null,
  };
}

function parseCoopFarmOrder(raw: unknown, todayStr: string): CoopFarmOrderState {
  const defaults = createDailyFarmOrder(todayStr);
  if (!isRecord(raw)) return defaults;

  const dateKey = asString(raw.dateKey, todayStr);
  if (dateKey !== todayStr) return defaults;

  const rawGoal = isRecord(raw.goal) ? raw.goal : {};
  const goalTemplate =
    COOP_FARM_DAILY_ORDERS.find((o) => o.id === rawGoal.id) ?? defaults.goal;
  const rawProgress = isRecord(raw.progress) ? raw.progress : {};

  const foodsDone: Record<string, number> = {};
  if (isRecord(rawProgress.foodsDone)) {
    for (const [k, v] of Object.entries(rawProgress.foodsDone)) {
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) {
        foodsDone[k] = Math.floor(v);
      }
    }
  }

  const craftTarget =
    defaults.progress.craftTarget ||
    Object.values(goalTemplate.requiredFoodCounts ?? {}).reduce((s, n) => s + n, 0);
  const harvestTarget = defaults.progress.harvestTarget;

  return {
    dateKey,
    goal: {
      ...goalTemplate,
      requiredHarvestTotal: harvestTarget,
      requiredCraftTotal: craftTarget,
    },
    progress: {
      completedCount: Math.max(0, Math.floor(asNumber(rawProgress.completedCount, 0))),
      targetCount: craftTarget,
      harvestedCount: Math.max(0, Math.floor(asNumber(rawProgress.harvestedCount, 0))),
      harvestTarget,
      craftedCount: Math.max(0, Math.floor(asNumber(rawProgress.craftedCount, 0))),
      craftTarget,
      foodsDone,
    },
    expiresAt: asNumber(raw.expiresAt, defaults.expiresAt),
    completed: typeof raw.completed === 'boolean' ? raw.completed : false,
    overdue: typeof raw.overdue === 'boolean' ? raw.overdue : false,
    rewardClaimed: typeof raw.rewardClaimed === 'boolean' ? raw.rewardClaimed : false,
    rewardId: typeof raw.rewardId === 'string' ? raw.rewardId : null,
  };
}

function parseCoopHubState(raw: unknown): CoopHubState {
  const todayStr = formatLocalDate();
  const defaults = createInitialCoopHubState(todayStr);
  if (!isRecord(raw)) return defaults;

  const pendingRewards: CoopReward[] = Array.isArray(raw.pendingRewards)
    ? raw.pendingRewards
        .filter((r): r is Record<string, unknown> => isRecord(r))
        .map((r) => {
          const rareIngredients: Partial<Record<IngredientId, number>> = {};
          if (isRecord(r.rareIngredients)) {
            for (const ingId of INGREDIENT_IDS) {
              const v = r.rareIngredients[ingId];
              if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
                rareIngredients[ingId] = Math.floor(v);
              }
            }
          }
          const badgeId = asCoopBadgeId(r.badgeId);
          return {
            id: asString(r.id, `rw_${Date.now()}`),
            gameType: asCoopGameType(r.gameType),
            title: asString(r.title, '合作遊戲獎勵'),
            coins: Math.max(0, Math.floor(asNumber(r.coins, 0))),
            furnitureShards: Math.max(0, Math.floor(asNumber(r.furnitureShards, 0))),
            intimacy: Math.max(0, Math.floor(asNumber(r.intimacy, 0))),
            rareIngredients,
            badgeId: badgeId ?? undefined,
            messageCardTitle:
              typeof r.messageCardTitle === 'string' ? r.messageCardTitle : undefined,
            messageCardBody:
              typeof r.messageCardBody === 'string' ? r.messageCardBody : undefined,
            claimedByUserIds: Array.isArray(r.claimedByUserIds)
              ? r.claimedByUserIds.filter((u): u is string => typeof u === 'string')
              : [],
            createdAt: asNumber(r.createdAt, Date.now()),
          };
        })
        .slice(0, 12)
    : [];

  const unlockedBadges = Array.isArray(raw.unlockedBadges)
    ? Array.from(
        new Set(
          raw.unlockedBadges
            .map(asCoopBadgeId)
            .filter((b): b is CoopBadgeId => b !== null)
        )
      )
    : [];

  const earnedCards: CoopMessageCard[] = Array.isArray(raw.earnedCards)
    ? raw.earnedCards
        .filter((c): c is Record<string, unknown> => isRecord(c))
        .map((c) => ({
          id: asString(c.id, `card_${Date.now()}`),
          title: asString(c.title, '合作紀念卡'),
          body: asString(c.body, ''),
          emoji: asString(c.emoji, '💌'),
          earnedDate: asString(c.earnedDate, todayStr),
          createdAt: asNumber(c.createdAt, Date.now()),
        }))
        .filter((c) => Boolean(c.body))
        .slice(0, 20)
    : [];

  const offlineEvents: CoopOfflineEvent[] = Array.isArray(raw.offlineEvents)
    ? raw.offlineEvents
        .filter((e): e is Record<string, unknown> => isRecord(e))
        .map((e) => ({
          id: asString(e.id, `coev_${Date.now()}`),
          actorUserId: asString(e.actorUserId, 'partner'),
          actorName: asString(e.actorName, '夥伴'),
          gameType: asCoopGameType(e.gameType),
          summary: asString(e.summary, ''),
          createdAt: asNumber(e.createdAt, Date.now()),
        }))
        .filter((e) => Boolean(e.summary))
        .slice(0, 20)
    : [];

  const lastSeenByUserId: Record<string, number> = {};
  if (isRecord(raw.lastSeenByUserId)) {
    for (const [k, v] of Object.entries(raw.lastSeenByUserId)) {
      if (typeof v === 'number' && Number.isFinite(v)) {
        lastSeenByUserId[k] = v;
      }
    }
  }

  return syncCoopHubState(
    {
      activeRoomSession: parseCoopSession(raw.activeRoomSession),
      dailyFarmOrder: parseCoopFarmOrder(raw.dailyFarmOrder, todayStr),
      sharedWarehouse: parseIngredients(raw.sharedWarehouse, createZeroWarehouse()),
      coopFarmPlots: parseFarmPlots(raw.coopFarmPlots, 4),
      pendingRewards,
      unlockedBadges,
      earnedCards,
      streakDays: Math.max(0, Math.floor(asNumber(raw.streakDays, 0))),
      lastCoopCompletedDate:
        typeof raw.lastCoopCompletedDate === 'string' ? raw.lastCoopCompletedDate : null,
      offlineEvents,
      lastSeenByUserId,
    },
    todayStr
  );
}

function asWeatherCondition(value: unknown): WeatherCondition {
  if (typeof value === 'string' && value in WEATHER_META) {
    return value as WeatherCondition;
  }
  return 'clear';
}

function asDialogueCategory(value: unknown): DialogueCategory {
  if (
    value === 'urgent' ||
    value === 'memory' ||
    value === 'special' ||
    value === 'personality' ||
    value === 'time' ||
    value === 'weather' ||
    value === 'daily' ||
    value === 'coop'
  ) {
    return value;
  }
  return 'daily';
}

function asTimePeriodId(value: unknown): TimePeriodId | null {
  if (
    value === 'dawn' ||
    value === 'morning' ||
    value === 'noon' ||
    value === 'afternoon' ||
    value === 'evening' ||
    value === 'night' ||
    value === 'late_night'
  ) {
    return value;
  }
  return null;
}

function asMemoryEventType(value: unknown): PetMemoryEventType | null {
  if (
    value === 'fedFavoriteFood' ||
    value === 'fedDislikedFood' ||
    value === 'petted' ||
    value === 'bathed' ||
    value === 'walked' ||
    value === 'slept' ||
    value === 'newAccessory' ||
    value === 'newRoomItem' ||
    value === 'partnerMessage' ||
    value === 'partnerFed' ||
    value === 'weightLogged' ||
    value === 'stuffed' ||
    value === 'milestone'
  ) {
    return value;
  }
  return null;
}

function parseDialogueResponses(raw: unknown): DialogueResponse[] {
  if (!Array.isArray(raw)) return [];
  const list: DialogueResponse[] = [];
  for (const r of raw) {
    if (!isRecord(r)) continue;
    const id = asString(r.id, '');
    const label = asString(r.label, '');
    if (!id || !label) continue;
    const act = r.actionType;
    const actionType: DialogueResponse['actionType'] =
      act === 'walk' ||
      act === 'feed_pudding' ||
      act === 'feed_meal' ||
      act === 'hug' ||
      act === 'sleep' ||
      act === 'bath'
        ? act
        : 'ack';
    const petAct = r.petAction;
    const petAction: DialogueResponse['petAction'] =
      petAct === 'petted' ||
      petAct === 'opening' ||
      petAct === 'eating' ||
      petAct === 'sleeping' ||
      petAct === 'bathing' ||
      petAct === 'walking' ||
      petAct === 'stuffed'
        ? petAct
        : 'idle';
    const expr = r.expression;
    const expression: DialogueResponse['expression'] =
      expr === 'wink' ||
      expr === 'sparkle' ||
      expr === 'shy' ||
      expr === 'happyTongue' ||
      expr === 'ticklish'
        ? expr
        : 'normal';

    list.push({
      id,
      label,
      emoji: asString(r.emoji, '💬'),
      actionType,
      replyText: asString(r.replyText, ''),
      intimacyGain: Math.max(0, Math.floor(asNumber(r.intimacyGain, 1))),
      moodGain: Math.max(0, Math.floor(asNumber(r.moodGain, 2))),
      petAction,
      expression,
    });
  }
  return list;
}

function parseDialogueLine(raw: unknown): DialogueLine | null {
  if (!isRecord(raw)) return null;
  const id = asString(raw.id, '');
  const text = asString(raw.text, '');
  if (!id || !text) return null;

  const memType = asMemoryEventType(raw.memoryEventType);
  const tp = asTimePeriodId(raw.timePeriod);

  return {
    id,
    category: asDialogueCategory(raw.category),
    text,
    priority: Math.max(1, Math.min(7, Math.floor(asNumber(raw.priority, 7)))),
    createdAt: asNumber(raw.createdAt, Date.now()),
    memoryEventId: typeof raw.memoryEventId === 'string' ? raw.memoryEventId : undefined,
    memoryEventType: memType ?? undefined,
    timePeriod: tp ?? undefined,
    weatherCondition:
      typeof raw.weatherCondition === 'string'
        ? asWeatherCondition(raw.weatherCondition)
        : undefined,
    responses: parseDialogueResponses(raw.responses),
    respondedId: typeof raw.respondedId === 'string' ? raw.respondedId : null,
    respondedLabel:
      typeof raw.respondedLabel === 'string' ? raw.respondedLabel : undefined,
    isCoopHighlight:
      typeof raw.isCoopHighlight === 'boolean' ? raw.isCoopHighlight : undefined,
    actorId: typeof raw.actorId === 'string' ? raw.actorId : undefined,
  };
}

function parseDialogueState(raw: unknown): DialogueState {
  const todayStr = formatLocalDate();
  const defaults = createInitialDialogueState(todayStr);
  if (!isRecord(raw)) return defaults;

  const rawSettings = isRecord(raw.settings) ? raw.settings : {};
  const rawWeather = isRecord(raw.weather) ? raw.weather : {};
  const weatherCond = asWeatherCondition(rawWeather.condition);
  const weatherFallback = createInitialWeatherState(weatherCond);
  const weather: WeatherState = {
    condition: weatherCond,
    temperatureC: asNumber(rawWeather.temperatureC, weatherFallback.temperatureC),
    label: asString(rawWeather.label, weatherFallback.label),
    emoji: asString(rawWeather.emoji, weatherFallback.emoji),
    source: rawWeather.source === 'api_ready' ? 'api_ready' : 'fixed',
    updatedAt: asNumber(rawWeather.updatedAt, weatherFallback.updatedAt),
  };

  const memoryEvents: PetMemoryEvent[] = Array.isArray(raw.memoryEvents)
    ? raw.memoryEvents
        .filter((ev): ev is Record<string, unknown> => isRecord(ev))
        .map((ev) => {
          const type = asMemoryEventType(ev.type);
          if (!type) return null;
          return {
            id: asString(ev.id, `mem_${Date.now()}`),
            type,
            detail: asString(ev.detail, ''),
            createdAt: asNumber(ev.createdAt, Date.now()),
            dateKey: asString(ev.dateKey, todayStr),
            actorId: typeof ev.actorId === 'string' ? ev.actorId : undefined,
            actorName: typeof ev.actorName === 'string' ? ev.actorName : undefined,
            foodId: typeof ev.foodId === 'string' ? ev.foodId : undefined,
            itemId: typeof ev.itemId === 'string' ? ev.itemId : undefined,
            mentionedAt: typeof ev.mentionedAt === 'number' ? ev.mentionedAt : null,
            isCoopHighlight:
              typeof ev.isCoopHighlight === 'boolean' ? ev.isCoopHighlight : undefined,
          } as PetMemoryEvent;
        })
        .filter((ev): ev is PetMemoryEvent => ev !== null)
        .slice(0, 20)
    : [];

  const history: DialogueLine[] = Array.isArray(raw.history)
    ? raw.history
        .map(parseDialogueLine)
        .filter((line): line is DialogueLine => line !== null)
        .slice(0, 60)
    : [];

  const greetedPeriodsToday = Array.isArray(raw.greetedPeriodsToday)
    ? Array.from(
        new Set(
          raw.greetedPeriodsToday
            .map(asTimePeriodId)
            .filter((p): p is TimePeriodId => p !== null)
        )
      )
    : [];

  const lastUrgentAtByStat: DialogueState['lastUrgentAtByStat'] = {};
  if (isRecord(raw.lastUrgentAtByStat)) {
    const keys: Array<'hunger' | 'mood' | 'cleanliness' | 'energy'> = [
      'hunger',
      'mood',
      'cleanliness',
      'energy',
    ];
    for (const key of keys) {
      const val = raw.lastUrgentAtByStat[key];
      if (typeof val === 'number' && Number.isFinite(val)) {
        lastUrgentAtByStat[key] = val;
      }
    }
  }

  const announcedWeightMilestones = Array.isArray(raw.announcedWeightMilestones)
    ? Array.from(
        new Set(
          raw.announcedWeightMilestones.filter(
            (n): n is number => typeof n === 'number' && Number.isFinite(n)
          )
        )
      )
    : [];

  return syncDialogueDaily(
    {
      activeBubble: parseDialogueLine(raw.activeBubble),
      history,
      memoryEvents,
      settings: {
        muteWeatherChat:
          typeof rawSettings.muteWeatherChat === 'boolean'
            ? rawSettings.muteWeatherChat
            : false,
        muteNightNotice:
          typeof rawSettings.muteNightNotice === 'boolean'
            ? rawSettings.muteNightNotice
            : false,
        muteAllProactive:
          typeof rawSettings.muteAllProactive === 'boolean'
            ? rawSettings.muteAllProactive
            : false,
      },
      weather,
      lastProactiveAt: Math.max(0, asNumber(raw.lastProactiveAt, 0)),
      nextCooldownMs: Math.max(
        60000,
        asNumber(raw.nextCooldownMs, getRandomProactiveCooldownMs())
      ),
      dailyKey: asString(raw.dailyKey, todayStr),
      urgentRemindersToday: Math.max(
        0,
        Math.floor(asNumber(raw.urgentRemindersToday, 0))
      ),
      lastUrgentAtByStat,
      greetedPeriodsToday,
      consecutiveCareDays: Math.max(
        1,
        Math.floor(asNumber(raw.consecutiveCareDays, 1))
      ),
      lastCareDate:
        typeof raw.lastCareDate === 'string' ? raw.lastCareDate : todayStr,
      announcedWeightMilestones,
    },
    todayStr
  );
}

function migrateLegacyV1(raw: Record<string, unknown>): GameState {
  const base = createInitialGameState();
  const now = Date.now();
  const rawPet = isRecord(raw.pet) ? raw.pet : {};
  const rawStats = isRecord(rawPet.stats) ? rawPet.stats : {};
  const growth = asNumber(rawPet.growth, base.pet.growth);
  const lastSavedAt = asNumber(raw.lastUpdatedAt, now);

  let pet: Pet = {
    id: 'pet_1',
    name: asString(rawPet.name, base.pet.name),
    species: 'pig',
    level: getGrowthStage(growth).level,
    growth,
    intimacy: clampStat(asNumber(rawPet.intimacy, base.pet.intimacy), 0, 99999),
    hunger: clampStat(asNumber(rawStats.satiety, base.pet.hunger)),
    mood: clampStat(asNumber(rawStats.mood, base.pet.mood)),
    cleanliness: clampStat(asNumber(rawStats.cleanliness, base.pet.cleanliness)),
    energy: clampStat(asNumber(rawStats.energy, base.pet.energy)),
    weight: clampWeight(asNumber(rawPet.weight, base.pet.weight)),
    roundness: clampStat(asNumber(rawPet.chubbiness, base.pet.roundness)),
    accessories: parseAccessoriesRecord(rawPet.equipped, base.pet.accessories),
    hatched: typeof rawPet.hatched === 'boolean' ? rawPet.hatched : false,
    consecutiveFastFood: asNumber(rawPet.consecutiveFastFood, 0),
  };

  if (pet.hatched) {
    pet = applyTimeDecay(pet, now - lastSavedAt);
  }

  const rawUnlocked = Array.isArray(raw.unlockedAccessories)
    ? raw.unlockedAccessories.filter((x): x is string => typeof x === 'string')
    : [];

  const legacyQuests = isRecord(raw.dailyQuests) ? raw.dailyQuests : {};
  const legacyDate = asString(legacyQuests.dateStr, formatLocalDate());
  const legacyProgress = isRecord(legacyQuests.progress) ? legacyQuests.progress : {};
  const legacyClaimed = isRecord(legacyQuests.claimed) ? legacyQuests.claimed : {};

  const migratedTasks: DailyTask[] = createInitialDailyTasks().map((task) => {
    const progress = Math.min(task.target, asNumber(legacyProgress[task.id], 0));
    const rawClaimed = legacyClaimed[task.id];
    return {
      ...task,
      progress,
      completed: progress >= task.target,
      claimed: typeof rawClaimed === 'boolean' ? rawClaimed : false,
    };
  });

  const syncedTasks = syncDailyTasks(migratedTasks, legacyDate);

  return {
    version: 2,
    pet,
    coins: asNumber(raw.coins, base.coins),
    furnitureShards: 0,
    foods: parseStringNumberRecord(raw.foodInventory, base.foods),
    ingredients: createInitialIngredients(),
    farmPlots: createInitialFarmPlots(4),
    accessories: Array.from(new Set([...INITIAL_UNLOCKED_ACCESSORIES, ...rawUnlocked])),
    weightLogs: parseWeightLogs(raw.records),
    feedLogs: [],
    dailyTasks: syncedTasks.dailyTasks,
    dailyTasksDate: syncedTasks.dailyTasksDate,
    messages: [],
    soundEnabled: typeof raw.soundEnabled === 'boolean' ? raw.soundEnabled : true,
    lastSavedAt: now,
    noviceGrowth: createInitialNoviceGrowthStats(formatLocalDate()),
    encyclopedia: createInitialEncyclopediaState(),
    unlockedBackgrounds: ['default'],
    activeBackground: 'default',
    minigameHub: createInitialMinigameHubState(),
    house: createInitialSharedHouse(),
    personality: createInitialPetPersonality('pig'),
    coop: createInitialCoopHubState(formatLocalDate()),
    dialogue: createInitialDialogueState(formatLocalDate()),
  };
}

export function normalizeGameState(parsed: unknown): GameState | null {
  if (!isRecord(parsed)) return null;
  const base = createInitialGameState();
  const now = Date.now();
  const lastSavedAt = asNumber(parsed.lastSavedAt, now);
  const rawPet = isRecord(parsed.pet) ? parsed.pet : {};
  const growth = asNumber(rawPet.growth, base.pet.growth);

  let pet: Pet = {
    id: asString(rawPet.id, base.pet.id),
    name: asString(rawPet.name, base.pet.name),
    species: asSpecies(rawPet.species),
    level: getGrowthStage(growth).level,
    growth,
    intimacy: Math.max(0, asNumber(rawPet.intimacy, base.pet.intimacy)),
    hunger: clampStat(asNumber(rawPet.hunger, base.pet.hunger)),
    mood: clampStat(asNumber(rawPet.mood, base.pet.mood)),
    cleanliness: clampStat(asNumber(rawPet.cleanliness, base.pet.cleanliness)),
    energy: clampStat(asNumber(rawPet.energy, base.pet.energy)),
    weight: clampWeight(asNumber(rawPet.weight, base.pet.weight)),
    roundness: clampStat(asNumber(rawPet.roundness, base.pet.roundness)),
    accessories: parseAccessoriesRecord(rawPet.accessories, base.pet.accessories),
    hatched: typeof rawPet.hatched === 'boolean' ? rawPet.hatched : false,
    consecutiveFastFood: asNumber(rawPet.consecutiveFastFood, 0),
  };

  if (pet.hatched) {
    pet = applyTimeDecay(pet, now - lastSavedAt);
  }

  const rawUnlocked = Array.isArray(parsed.accessories)
    ? parsed.accessories.filter((x): x is string => typeof x === 'string')
    : [];

  const syncedTasks = syncDailyTasks(
    parseDailyTasks(parsed.dailyTasks),
    asString(parsed.dailyTasksDate, formatLocalDate())
  );

  const parsedWeightLogs = parseWeightLogs(parsed.weightLogs);
  const parsedFeedLogs = parseFeedLogs(parsed.feedLogs);
  const mergedAccessories = Array.from(
    new Set([...INITIAL_UNLOCKED_ACCESSORIES, ...rawUnlocked])
  );
  const seedClaimedDailyCount = syncedTasks.dailyTasks.filter((t) => t.claimed).length;
  const seedWeightCount = parsedWeightLogs.filter((w) => w.foodName === '手動紀錄').length;
  const seedFoodIds = parsedFeedLogs.map((l) => l.foodId);
  const unlockedBackgrounds = parseStageBackgrounds(parsed.unlockedBackgrounds);
  const requestedBg = asStageBackgroundId(parsed.activeBackground);
  const activeBackground = unlockedBackgrounds.includes(requestedBg) ? requestedBg : 'default';
  const parsedHouse = parseSharedHouse(parsed.house);

  const draft: GameState = {
    version: 2,
    pet,
    coins: asNumber(parsed.coins, base.coins),
    furnitureShards: Math.max(0, Math.floor(asNumber(parsed.furnitureShards, 0))),
    foods: parseStringNumberRecord(parsed.foods, base.foods),
    ingredients: parseIngredients(parsed.ingredients, base.ingredients),
    farmPlots: parseFarmPlots(parsed.farmPlots, parsedHouse.unlockedFarmPlots),
    accessories: mergedAccessories,
    weightLogs: parsedWeightLogs,
    feedLogs: parsedFeedLogs,
    dailyTasks: syncedTasks.dailyTasks,
    dailyTasksDate: syncedTasks.dailyTasksDate,
    messages: parsePetMessages(parsed.messages),
    soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    lastSavedAt: now,
    noviceGrowth: parseNoviceGrowth(
      parsed.noviceGrowth,
      formatLocalDate(),
      parsedFeedLogs.length,
      seedWeightCount,
      mergedAccessories.length,
      seedClaimedDailyCount
    ),
    encyclopedia: parseEncyclopedia(parsed.encyclopedia, seedFoodIds),
    unlockedBackgrounds,
    activeBackground,
    minigameHub: parseMinigameHub(parsed.minigameHub),
    house: parsedHouse,
    personality: parsePetPersonality(parsed.personality, pet.species),
    coop: parseCoopHubState(parsed.coop),
    dialogue: parseDialogueState(parsed.dialogue),
  };

  return syncHouseProgress(draft).nextState;
}

export function loadGameState(): GameState {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed: unknown = JSON.parse(rawV2);
      const normalized = normalizeGameState(parsed);
      if (normalized) {
        return normalized;
      }
    }

    const rawV1 = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (rawV1) {
      const parsedV1: unknown = JSON.parse(rawV1);
      if (isRecord(parsedV1)) {
        return migrateLegacyV1(parsedV1);
      }
    }

    return createInitialGameState();
  } catch {
    return createInitialGameState();
  }
}

export function saveGameState(state: GameState): void {
  try {
    const toStore: GameState = {
      ...state,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    saveNoviceGrowthMirror(state.noviceGrowth);
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function resetGameState(): GameState {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    clearNoviceGrowthMirror();
  } catch {
    // Ignore storage errors gracefully
  }
  const fresh = createInitialGameState();
  saveGameState(fresh);
  return fresh;
}
