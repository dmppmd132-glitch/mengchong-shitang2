import type { MinigameHubState } from './minigame';

export type TabKey = 'home' | 'canteen' | 'wardrobe' | 'journal' | 'quests';

export type PetSpecies = 'pig' | 'rabbit' | 'dog';

export type FoodCategory = 'meal' | 'snack' | 'fastFood';

export type AccessorySlot = 'head' | 'face' | 'neck' | 'body';

export type PiggyActionState =
  | 'idle'
  | 'petted'
  | 'opening'
  | 'eating'
  | 'sleeping'
  | 'bathing'
  | 'walking'
  | 'stuffed';

export type PetTouchZone = 'head' | 'cheek' | 'belly' | 'paw';

export type PetExpression =
  | 'normal'
  | 'wink'
  | 'sparkle'
  | 'shy'
  | 'happyTongue'
  | 'ticklish';

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  level: number;
  growth: number;
  intimacy: number;
  hunger: number;
  mood: number;
  cleanliness: number;
  energy: number;
  weight: number;
  roundness: number;
  accessories: Record<AccessorySlot, string | null>;
  hatched: boolean;
  consecutiveFastFood: number;
}

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  hunger: number;
  mood: number;
  weightGain: number;
  roundness: number;
  price: number;
  emoji: string;
  description: string;
  growthGain: number;
}

export interface Accessory {
  id: string;
  name: string;
  slot: AccessorySlot;
  price: number;
  emoji: string;
  description: string;
  initialUnlocked: boolean;
}

export interface WeightLog {
  id: string;
  date: string;
  weight: number;
  foodName: string;
  note: string;
  weightDelta: number;
  timeStr: string;
  timestamp: number;
}

export interface FeedLog {
  id: string;
  date: string;
  foodId: string;
  weightChange: number;
}

export interface TaskReward {
  coins: number;
  foodId: string;
  foodQty: number;
}

export interface DailyTask {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  reward: TaskReward;
}

export interface GrowthStageInfo {
  level: number;
  name: string;
  minGrowth: number;
  nextGrowth: number | null;
  tagline: string;
  unlockFeature: string;
  bodyScaleX: number;
  bodyScaleY: number;
  unlockedSlots: AccessorySlot[];
}

export type PetStickerId =
  | 'heart'
  | 'hungry'
  | 'happy'
  | 'sleepy'
  | 'cheers'
  | 'hug'
  | 'walk'
  | 'thankyou';

export interface PetStickerInfo {
  id: PetStickerId;
  label: string;
  caption: string;
  bgClass: string;
}

export interface PetMessage {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  stickerId: PetStickerId | null;
  createdAt: number;
}

export type IngredientId =
  | 'carrot'
  | 'corn'
  | 'strawberry'
  | 'pumpkin'
  | 'blueberry'
  | 'mint'
  | 'sunflower';

export interface IngredientInfo {
  id: IngredientId;
  name: string;
  emoji: string;
  growSeconds: number;
  seedCost: number;
  harvestYield: number;
  description: string;
}

export interface CropPlot {
  id: number;
  cropId: IngredientId | null;
  plantedAt: number | null;
  durationMs: number;
}

export interface KitchenRecipe {
  id: string;
  outputFoodId: string;
  name: string;
  emoji: string;
  description: string;
  ingredients: Partial<Record<IngredientId, number>>;
  bonusGrowth: number;
}

export interface PetSpeciesInfo {
  id: PetSpecies;
  label: string;
  shortName: string;
  eggColor: string;
  accentColor: string;
  favoriteFoodIds: string[];
  greeting: string;
  pettedSpeech: string;
  favoriteFoodReaction: string;
  zoneSpeeches: Record<PetTouchZone, string[]>;
}

export type CatchGameMode = 'apple' | 'fries';

export type TitleId =
  | 'gourmet_owner'
  | 'fashion_stylist'
  | 'strawberry_dreamer'
  | 'forest_camper'
  | 'cloud_napper'
  | 'coop_partner';

export type PersonalityId =
  | 'greedy'
  | 'sleepy'
  | 'mischievous'
  | 'clingy'
  | 'elegant'
  | 'curious'
  | 'lively'
  | 'shy';

export interface PetPersonality {
  primary: PersonalityId;
  secondary: PersonalityId;
  scores: Record<PersonalityId, number>;
  careActionCounts: Record<string, number>;
  lastUpdatedAt: number;
}

export interface PetPreference {
  species: PetSpecies;
  favoriteFoodIds: string[];
  favoriteToyIds: string[];
  favoriteFurnitureIds: string[];
  dislikedFoodIds: string[];
  dislikedToyIds: string[];
  dislikedFurnitureIds: string[];
}

export interface Toy {
  id: string;
  name: string;
  emoji: string;
  category: 'toy';
  zone: 'play';
  price: number;
  sellPrice: number;
  description: string;
  petReactionText: string;
  petAction: PiggyActionState;
}

export type CoopGameType = 'room_decor' | 'farm_relay';

export type CoopRole = 'selector' | 'placer' | 'farmer' | 'chef';

export type CoopBadgeId = 'best_partner' | 'room_stylist' | 'farm_relay_master';

export interface CoopGoal {
  id: string;
  gameType: CoopGameType;
  title: string;
  description: string;
  themeId?: ThemeSetId;
  targetItemCount?: number;
  requiredFoodCounts?: Record<string, number>;
  requiredHarvestTotal?: number;
  requiredCraftTotal?: number;
}

export interface CoopProgress {
  completedCount: number;
  targetCount: number;
  harvestedCount: number;
  harvestTarget: number;
  craftedCount: number;
  craftTarget: number;
  foodsDone: Record<string, number>;
}

export interface CoopReward {
  id: string;
  gameType: CoopGameType;
  title: string;
  coins: number;
  furnitureShards: number;
  intimacy: number;
  rareIngredients: Partial<Record<IngredientId, number>>;
  badgeId?: CoopBadgeId;
  messageCardTitle?: string;
  messageCardBody?: string;
  claimedByUserIds: string[];
  createdAt: number;
}

export interface CoopRoomCandidate {
  queueId: string;
  itemId: string;
  selectedByUserId: string;
  selectedByName: string;
  selectedAt: number;
  placed: boolean;
}

export interface CoopOfflineEvent {
  id: string;
  actorUserId: string;
  actorName: string;
  gameType: CoopGameType;
  summary: string;
  createdAt: number;
}

export interface CoopMessageCard {
  id: string;
  title: string;
  body: string;
  emoji: string;
  earnedDate: string;
  createdAt: number;
}

export interface CoopSession {
  id: string;
  gameType: CoopGameType;
  status: 'idle' | 'active' | 'completed' | 'expired';
  themeId: ThemeSetId;
  goal: CoopGoal;
  progress: CoopProgress;
  startedAt: number;
  expiresAt: number;
  durationSeconds: number;
  candidateQueue: CoopRoomCandidate[];
  placedInstanceIds: string[];
  settled: boolean;
  rewardId: string | null;
}

export interface CoopFarmOrderState {
  dateKey: string;
  goal: CoopGoal;
  progress: CoopProgress;
  expiresAt: number;
  completed: boolean;
  overdue: boolean;
  rewardClaimed: boolean;
  rewardId: string | null;
}

export interface CoopHubState {
  activeRoomSession: CoopSession | null;
  dailyFarmOrder: CoopFarmOrderState;
  sharedWarehouse: Record<IngredientId, number>;
  coopFarmPlots: CropPlot[];
  pendingRewards: CoopReward[];
  unlockedBadges: CoopBadgeId[];
  earnedCards: CoopMessageCard[];
  streakDays: number;
  lastCoopCompletedDate: string | null;
  offlineEvents: CoopOfflineEvent[];
  lastSeenByUserId: Record<string, number>;
}

export type DialogueId = string;

export type DialogueCategory =
  | 'urgent'
  | 'memory'
  | 'special'
  | 'personality'
  | 'time'
  | 'weather'
  | 'daily'
  | 'coop';

export type WeatherCondition =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'snow'
  | 'storm'
  | 'hot'
  | 'windy';

export interface WeatherState {
  condition: WeatherCondition;
  temperatureC: number;
  label: string;
  emoji: string;
  source: 'fixed' | 'api_ready';
  updatedAt: number;
}

export type TimePeriodId =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'late_night';

export type PetMemoryEventType =
  | 'fedFavoriteFood'
  | 'fedDislikedFood'
  | 'petted'
  | 'bathed'
  | 'walked'
  | 'slept'
  | 'newAccessory'
  | 'newRoomItem'
  | 'partnerMessage'
  | 'partnerFed'
  | 'weightLogged'
  | 'stuffed'
  | 'milestone';

export interface PetMemoryEvent {
  id: string;
  type: PetMemoryEventType;
  detail: string;
  createdAt: number;
  dateKey: string;
  actorId?: string;
  actorName?: string;
  foodId?: string;
  itemId?: string;
  mentionedAt?: number | null;
  isCoopHighlight?: boolean;
}

export type DialogueActionType =
  | 'walk'
  | 'feed_pudding'
  | 'feed_meal'
  | 'hug'
  | 'sleep'
  | 'bath'
  | 'ack';

export interface DialogueResponse {
  id: string;
  label: string;
  emoji: string;
  actionType: DialogueActionType;
  replyText: string;
  intimacyGain: number;
  moodGain: number;
  petAction: PiggyActionState;
  expression: PetExpression;
}

export interface DialogueLine {
  id: DialogueId;
  category: DialogueCategory;
  text: string;
  priority: number;
  createdAt: number;
  memoryEventId?: string;
  memoryEventType?: PetMemoryEventType;
  timePeriod?: TimePeriodId;
  weatherCondition?: WeatherCondition;
  responses: DialogueResponse[];
  respondedId?: string | null;
  respondedLabel?: string;
  isCoopHighlight?: boolean;
  actorId?: string;
}

export interface DialogueSettings {
  muteWeatherChat: boolean;
  muteNightNotice: boolean;
  muteAllProactive: boolean;
}

export interface DialogueState {
  activeBubble: DialogueLine | null;
  history: DialogueLine[];
  memoryEvents: PetMemoryEvent[];
  settings: DialogueSettings;
  weather: WeatherState;
  lastProactiveAt: number;
  nextCooldownMs: number;
  dailyKey: string;
  urgentRemindersToday: number;
  lastUrgentAtByStat: Partial<Record<'hunger' | 'mood' | 'cleanliness' | 'energy', number>>;
  greetedPeriodsToday: TimePeriodId[];
  consecutiveCareDays: number;
  lastCareDate: string | null;
  announcedWeightMilestones: number[];
}

export type StageBackgroundId = 'default' | 'starlight_garden';

export type NoviceDayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface NoviceGrowthStats {
  startedDate: string;
  claimedDays: number[];
  lastClaimDate: string | null;
  feedCount: number;
  petCount: number;
  plantedCarrotCount: number;
  minigameCount: number;
  cookedCount: number;
  weightRecordCount: number;
  boughtAccessoryCount: number;
  walkCount: number;
  fedFavoriteCount: number;
  completedDailyTasksCount: number;
  createdSharedRoom: boolean;
}

export interface EncyclopediaState {
  collectedFoodIds: string[];
  claimedAccessoryMilestones: number[];
  unlockedTitles: TitleId[];
  activeTitle: TitleId | null;
}

export type FeedingVisualEffect = 'none' | 'hearts' | 'favoriteJump' | 'stuffed';

export interface FeedingReactionRule {
  speeches: string[];
  feedbackText: string;
  feedbackEmoji: string;
  expression: PetExpression;
  particleEmojis: string[];
}

import type { SharedHouse, ThemeSetId } from './house';

export type {
  RoomZone,
  FurnitureCategory,
  FurnitureTier,
  ThemeSetId,
  WallpaperId,
  FlooringId,
  RoomPhotoPoseId,
  RoomItem,
  PlacedRoomItem,
  FurnitureNote,
  RoomLayout,
  FarmUpgradeId,
  FarmUpgrade,
  FarmDecorationCategory,
  FarmDecorationId,
  FarmDecoration,
  SharedGoalId,
  SharedGoal,
  SharedMilestoneId,
  RoomPhotoRecord,
  TreasuryContribution,
  SharedHouse,
} from './house';

export interface GameState {
  version: number;
  pet: Pet;
  coins: number;
  furnitureShards: number;
  foods: Record<string, number>;
  ingredients: Record<IngredientId, number>;
  farmPlots: CropPlot[];
  accessories: string[];
  weightLogs: WeightLog[];
  feedLogs: FeedLog[];
  dailyTasks: DailyTask[];
  dailyTasksDate: string;
  messages: PetMessage[];
  soundEnabled: boolean;
  lastSavedAt: number;
  noviceGrowth: NoviceGrowthStats;
  encyclopedia: EncyclopediaState;
  unlockedBackgrounds: StageBackgroundId[];
  activeBackground: StageBackgroundId;
  minigameHub: MinigameHubState;
  house: SharedHouse;
  personality: PetPersonality;
  coop: CoopHubState;
  dialogue: DialogueState;
}

export interface FloatingFeedback {
  id: string;
  text: string;
  emoji?: string;
}

export type CloudSyncStatus = 'local' | 'syncing' | 'synced' | 'error';

export interface CloudUser {
  id: string;
  email: string;
}

export interface CloudSavePayload {
  state: GameState;
  updatedAt: string;
}

export interface SharedPetRoom {
  id: string;
  inviteCode: string;
  ownerId: string;
  ownerEmail: string;
  partnerId: string | null;
  partnerEmail: string | null;
  lastActorId: string | null;
  lastActorEmail: string | null;
  updatedAt: string;
}

