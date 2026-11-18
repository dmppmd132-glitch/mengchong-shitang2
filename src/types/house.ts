import type { PetSpecies, PiggyActionState, AccessorySlot } from './index';

export type RoomZone = 'sleep' | 'play' | 'dining' | 'decor';

export type FurnitureCategory =
  | 'bed'
  | 'pillow'
  | 'blanket'
  | 'rug'
  | 'toyBall'
  | 'toy'
  | 'diningTable'
  | 'placemat'
  | 'snackRack'
  | 'plant'
  | 'curtain'
  | 'painting'
  | 'stringLights'
  | 'sign';

export type FurnitureTier = 'normal' | 'advanced';

export type ThemeSetId = 'strawberry_sweet' | 'forest_camp' | 'cloud_nap';

export type WallpaperId =
  | 'cream_warm'
  | 'strawberry_pink'
  | 'forest_pine'
  | 'cloud_sky';

export type FlooringId =
  | 'oak_wood'
  | 'strawberry_check'
  | 'forest_moss'
  | 'cloud_plush';

export type RoomPhotoPoseId =
  | 'normal'
  | 'happy_jump'
  | 'sleepy_cozy'
  | 'berry_heart'
  | 'camp_cheer'
  | 'cloud_float';

export interface RoomItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  zone: RoomZone;
  tier: FurnitureTier;
  price: number;
  sellPrice: number;
  themeId: ThemeSetId | null;
  emoji: string;
  description: string;
  petReactionText: string;
  petAction: PiggyActionState;
  craftIngredients?: Record<string, number>;
}

export interface PlacedRoomItem {
  instanceId: string;
  itemId: string;
  x: number;
  y: number;
  zone: RoomZone;
  placedBy?: string;
  updatedAt: number;
}

export interface FurnitureNote {
  id: string;
  itemId: string;
  authorName: string;
  content: string;
  createdAt: number;
}

export interface RoomLayout {
  cols: 6;
  rows: 4;
  wallpaperId: WallpaperId;
  flooringId: FlooringId;
  placedItems: PlacedRoomItem[];
}

export type FarmUpgradeId = 'sprinkler' | 'greenhouse' | 'storage';

export interface FarmUpgrade {
  id: FarmUpgradeId;
  name: string;
  emoji: string;
  description: string;
  prices: number[];
  maxLevel: number;
  effectSummaries: string[];
}

export type FarmDecorationCategory = 'fence' | 'flowerbed' | 'sign';

export type FarmDecorationId =
  | 'wooden_fence'
  | 'white_picket_fence'
  | 'daisy_flowerbed'
  | 'lavender_flowerbed'
  | 'farm_welcome_sign'
  | 'berry_arch_sign';

export interface FarmDecoration {
  id: FarmDecorationId;
  name: string;
  category: FarmDecorationCategory;
  price: number;
  emoji: string;
  description: string;
}

export type SharedGoalId =
  | 'goal_cloud_bed'
  | 'goal_sprinkler'
  | 'goal_farm_6'
  | 'goal_cozy_6_items';

export interface SharedGoal {
  id: SharedGoalId;
  title: string;
  description: string;
  targetCoins: number;
  rewardSummary: string;
  rewardCoinsBonus: number;
  rewardGrowthBonus: number;
  rewardItemId?: string;
}

export type SharedMilestoneId =
  | 'first_furniture'
  | 'four_zones_filled'
  | 'theme_room_complete'
  | 'farm_expanded'
  | 'shared_goal_completed'
  | 'first_room_photo';

export interface RoomPhotoRecord {
  id: string;
  title: string;
  caption: string;
  createdAt: number;
  houseName: string;
  species: PetSpecies;
  petName: string;
  equipped: Record<AccessorySlot, string | null>;
  poseId: RoomPhotoPoseId;
  wallpaperId: WallpaperId;
  flooringId: FlooringId;
  placedItems: PlacedRoomItem[];
  noteHighlight?: string;
}

export interface TreasuryContribution {
  id: string;
  authorName: string;
  amount: number;
  createdAt: number;
}

export interface SharedHouse {
  houseName: string;
  roomLayout: RoomLayout;
  ownedFurnitureCounts: Record<string, number>;
  collectedFurnitureIds: string[];
  unlockedWallpapers: WallpaperId[];
  unlockedFloorings: FlooringId[];
  claimedFurnitureMilestones: number[];
  completedThemeSets: ThemeSetId[];
  unlockedPhotoPoses: RoomPhotoPoseId[];
  unlockedFarmPlots: number;
  farmUpgrades: {
    sprinklerLevel: number;
    greenhouseLevel: number;
    storageLevel: number;
  };
  ownedFarmDecorations: FarmDecorationId[];
  activeFarmDecor: {
    fenceId: FarmDecorationId | null;
    flowerbedId: FarmDecorationId | null;
    signId: FarmDecorationId | null;
  };
  treasuryCoins: number;
  treasuryHistory: TreasuryContribution[];
  activeGoalId: SharedGoalId;
  completedGoalIds: SharedGoalId[];
  furnitureNotes: FurnitureNote[];
  achievedMilestones: SharedMilestoneId[];
  claimedMilestones: SharedMilestoneId[];
  photos: RoomPhotoRecord[];
}
