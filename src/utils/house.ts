import {
  FURNITURE_MILESTONE_COINS,
  FURNITURE_MILESTONE_GROWTH,
  FURNITURE_MILESTONE_STEP,
  TITLE_DEFINITIONS,
} from '../data/encyclopedia';
import { getGrowthStage } from '../data/growth';
import {
  FARM_DECORATION_BY_ID,
  FARM_PLOT_EXPANSION_COSTS,
  FARM_UPGRADES,
  FLOORING_BY_ID,
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEMS,
  ROOM_ITEM_BY_ID,
  SHARED_GOAL_BY_ID,
  SHARED_MILESTONES,
  STORAGE_CAPS_BY_LEVEL,
  THEME_SETS,
  WALLPAPER_BY_ID,
  getZoneForCell,
} from '../data/house';
import { INGREDIENTS } from '../data/kitchen';
import { FAVORITE_ITEM_BUBBLE_SPEECHES } from '../data/personality';
import {
  CropPlot,
  FarmDecorationId,
  FarmUpgradeId,
  FlooringId,
  FurnitureNote,
  GameState,
  IngredientId,
  PetExpression,
  PetSpecies,
  PiggyActionState,
  PlacedRoomItem,
  RoomItem,
  RoomPhotoPoseId,
  RoomPhotoRecord,
  RoomZone,
  SharedGoalId,
  SharedHouse,
  SharedMilestoneId,
  ThemeSetId,
  TitleId,
  WallpaperId,
} from '../types';
import {
  PreferenceMatch,
  applyPersonalityDevelopment,
  evaluateItemPreference,
} from './personality';

export type PaymentSource = 'personal' | 'treasury';

export interface HouseActionOutcome {
  nextState: GameState;
  ok: boolean;
  error?: string;
  notice?: string;
}

export function createInitialSharedHouse(): SharedHouse {
  return {
    houseName: '萌寵暖暖小屋',
    roomLayout: {
      cols: ROOM_GRID_COLS,
      rows: ROOM_GRID_ROWS,
      wallpaperId: 'cream_warm',
      flooringId: 'oak_wood',
      placedItems: [],
    },
    ownedFurnitureCounts: {},
    collectedFurnitureIds: [],
    unlockedWallpapers: ['cream_warm'],
    unlockedFloorings: ['oak_wood'],
    claimedFurnitureMilestones: [],
    completedThemeSets: [],
    unlockedPhotoPoses: ['normal', 'happy_jump', 'sleepy_cozy'],
    unlockedFarmPlots: 4,
    farmUpgrades: {
      sprinklerLevel: 0,
      greenhouseLevel: 0,
      storageLevel: 0,
    },
    ownedFarmDecorations: [],
    activeFarmDecor: {
      fenceId: null,
      flowerbedId: null,
      signId: null,
    },
    treasuryCoins: 0,
    treasuryHistory: [],
    activeGoalId: 'goal_cloud_bed',
    completedGoalIds: [],
    furnitureNotes: [],
    achievedMilestones: [],
    claimedMilestones: [],
    photos: [],
  };
}

export function getIngredientStorageCap(house: SharedHouse): number {
  const lvl = Math.min(STORAGE_CAPS_BY_LEVEL.length - 1, Math.max(0, house.farmUpgrades.storageLevel));
  return STORAGE_CAPS_BY_LEVEL[lvl] ?? 15;
}

export function getEffectiveGrowDurationMs(baseSeconds: number, house: SharedHouse): number {
  let multiplier = 1;
  if (house.farmUpgrades.sprinklerLevel >= 1) {
    multiplier *= 0.7;
  }
  if (house.farmUpgrades.greenhouseLevel >= 1) {
    multiplier *= 0.75;
  }
  return Math.max(3000, Math.round(baseSeconds * 1000 * multiplier));
}

export function getEffectiveHarvestYield(baseYield: number, house: SharedHouse): number {
  return baseYield + (house.farmUpgrades.greenhouseLevel >= 1 ? 1 : 0);
}

export function getPlacedCountByItem(house: SharedHouse, itemId: string): number {
  return house.roomLayout.placedItems.filter((p) => p.itemId === itemId).length;
}

export function getStowedCountByItem(house: SharedHouse, itemId: string): number {
  const owned = house.ownedFurnitureCounts[itemId] ?? 0;
  const placed = getPlacedCountByItem(house, itemId);
  return Math.max(0, owned - placed);
}

export function getFurnitureMilestoneThresholds(): number[] {
  const list: number[] = [];
  for (let n = FURNITURE_MILESTONE_STEP; n <= ROOM_ITEMS.length; n += FURNITURE_MILESTONE_STEP) {
    list.push(n);
  }
  return list;
}

export function getHouseEncyclopediaCounts(house: SharedHouse): {
  collectedFurniture: number;
  totalFurniture: number;
  collectedWallpapers: number;
  totalWallpapers: number;
  collectedFloorings: number;
  totalFloorings: number;
  collectedFarmDecor: number;
  totalFarmDecor: number;
  totalCollected: number;
  totalItems: number;
} {
  const validFurnitureIds = new Set(ROOM_ITEMS.map((i) => i.id));
  const collectedFurniture = house.collectedFurnitureIds.filter((id) =>
    validFurnitureIds.has(id)
  ).length;
  const collectedWallpapers = house.unlockedWallpapers.length;
  const collectedFloorings = house.unlockedFloorings.length;
  const farmFacilitiesCount =
    (house.farmUpgrades.sprinklerLevel > 0 ? 1 : 0) +
    (house.farmUpgrades.greenhouseLevel > 0 ? 1 : 0) +
    (house.farmUpgrades.storageLevel > 0 ? 1 : 0);
  const collectedFarmDecor = house.ownedFarmDecorations.length + farmFacilitiesCount;
  const totalFarmDecor = 6 + 3; // 6 decorations + 3 upgradeable facilities

  return {
    collectedFurniture,
    totalFurniture: ROOM_ITEMS.length,
    collectedWallpapers,
    totalWallpapers: 4,
    collectedFloorings,
    totalFloorings: 4,
    collectedFarmDecor,
    totalFarmDecor,
    totalCollected:
      collectedFurniture + collectedWallpapers + collectedFloorings + collectedFarmDecor,
    totalItems: ROOM_ITEMS.length + 4 + 4 + totalFarmDecor,
  };
}

function spendFromSource(
  state: GameState,
  cost: number,
  source: PaymentSource
): { nextState: GameState; ok: boolean; error?: string } {
  if (cost <= 0) return { nextState: state, ok: true };
  if (source === 'treasury') {
    if (state.house.treasuryCoins < cost) {
      return { nextState: state, ok: false, error: `共同金庫金幣不足 ${cost}` };
    }
    return {
      nextState: {
        ...state,
        house: {
          ...state.house,
          treasuryCoins: state.house.treasuryCoins - cost,
        },
      },
      ok: true,
    };
  }

  if (state.coins < cost) {
    return { nextState: state, ok: false, error: `個人金幣不足 ${cost}` };
  }
  return {
    nextState: {
      ...state,
      coins: state.coins - cost,
    },
    ok: true,
  };
}

export function syncHouseProgress(state: GameState): {
  nextState: GameState;
  notices: string[];
} {
  const notices: string[] = [];
  let house = state.house;
  let coins = state.coins;
  let growth = state.pet.growth;
  let unlockedTitles: TitleId[] = [...state.encyclopedia.unlockedTitles];
  let activeTitle = state.encyclopedia.activeTitle;

  const validFurnitureIds = new Set(ROOM_ITEMS.map((i) => i.id));
  const collectedCount = house.collectedFurnitureIds.filter((id) =>
    validFurnitureIds.has(id)
  ).length;

  // 1. Every 5 unique furniture items milestone reward
  const thresholds = getFurnitureMilestoneThresholds();
  const newFurnitureMilestones = thresholds.filter(
    (t) => collectedCount >= t && !house.claimedFurnitureMilestones.includes(t)
  );
  if (newFurnitureMilestones.length > 0) {
    const bonusCoins = newFurnitureMilestones.length * FURNITURE_MILESTONE_COINS;
    const bonusGrowth = newFurnitureMilestones.length * FURNITURE_MILESTONE_GROWTH;
    coins += bonusCoins;
    growth += bonusGrowth;
    house = {
      ...house,
      claimedFurnitureMilestones: [
        ...house.claimedFurnitureMilestones,
        ...newFurnitureMilestones,
      ].sort((a, b) => a - b),
    };
    const latest = newFurnitureMilestones[newFurnitureMilestones.length - 1];
    notices.push(`收集 ${latest} 件家具里程碑！+${bonusCoins} 金幣、+${bonusGrowth} 成長值`);
  }

  // 2. Theme set completions -> Title + Special Photo Pose
  const nextCompletedThemes: ThemeSetId[] = [...house.completedThemeSets];
  const nextPoses: RoomPhotoPoseId[] = [...house.unlockedPhotoPoses];
  for (const theme of THEME_SETS) {
    const hasWall = house.unlockedWallpapers.includes(theme.wallpaperId);
    const hasFloor = house.unlockedFloorings.includes(theme.flooringId);
    const hasAllItems = theme.itemIds.every((id) => house.collectedFurnitureIds.includes(id));

    if (hasWall && hasFloor && hasAllItems) {
      if (!nextCompletedThemes.includes(theme.id)) {
        nextCompletedThemes.push(theme.id);
        notices.push(`完成「${theme.name}」主題套裝！解鎖限定稱號與專屬拍照姿勢`);
      }
      if (!unlockedTitles.includes(theme.rewardTitleId)) {
        unlockedTitles = [...unlockedTitles, theme.rewardTitleId];
        if (!activeTitle) activeTitle = theme.rewardTitleId;
      }
      if (!nextPoses.includes(theme.rewardPoseId)) {
        nextPoses.push(theme.rewardPoseId);
      }
    }
  }

  // 3. Shared milestones
  const achievedSet = new Set<SharedMilestoneId>(house.achievedMilestones);
  if (collectedCount >= 1) achievedSet.add('first_furniture');

  const zonesFilled = new Set<RoomZone>();
  for (const placed of house.roomLayout.placedItems) {
    zonesFilled.add(getZoneForCell(placed.x, placed.y));
  }
  if (zonesFilled.size >= 4) achievedSet.add('four_zones_filled');
  if (nextCompletedThemes.length >= 1) achievedSet.add('theme_room_complete');
  if (
    house.unlockedFarmPlots > 4 ||
    house.farmUpgrades.sprinklerLevel > 0 ||
    house.farmUpgrades.greenhouseLevel > 0 ||
    house.farmUpgrades.storageLevel > 0 ||
    house.ownedFarmDecorations.length > 0
  ) {
    achievedSet.add('farm_expanded');
  }
  if (house.completedGoalIds.length > 0) achievedSet.add('shared_goal_completed');
  if (house.photos.length > 0) achievedSet.add('first_room_photo');

  const nextAchieved = Array.from(achievedSet);

  const nextState: GameState = {
    ...state,
    coins,
    pet: {
      ...state.pet,
      growth,
      level: getGrowthStage(growth).level,
    },
    encyclopedia: {
      ...state.encyclopedia,
      unlockedTitles,
      activeTitle,
    },
    house: {
      ...house,
      completedThemeSets: nextCompletedThemes,
      unlockedPhotoPoses: nextPoses,
      achievedMilestones: nextAchieved,
    },
  };

  return { nextState, notices };
}

export function buyFurnitureItem(
  state: GameState,
  itemId: string,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item) return { nextState: state, ok: false, error: '找不到此家具' };

  const paid = spendFromSource(state, item.price, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const curHouse = paid.nextState.house;
  const nextCollected = curHouse.collectedFurnitureIds.includes(item.id)
    ? curHouse.collectedFurnitureIds
    : [...curHouse.collectedFurnitureIds, item.id];

  const nextPersonality = applyPersonalityDevelopment(
    paid.nextState.personality,
    'buy_furniture'
  ).nextPersonality;

  const draft: GameState = {
    ...paid.nextState,
    personality: nextPersonality,
    house: {
      ...curHouse,
      ownedFurnitureCounts: {
        ...curHouse.ownedFurnitureCounts,
        [item.id]: (curHouse.ownedFurnitureCounts[item.id] ?? 0) + 1,
      },
      collectedFurnitureIds: nextCollected,
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? `購入「${item.name}」！點擊房間空格即可擺放`,
  };
}

export function craftFurnitureItem(state: GameState, itemId: string): HouseActionOutcome {
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item || !item.craftIngredients) {
    return { nextState: state, ok: false, error: '此家具無法以作物材料製作' };
  }

  const reqEntries = Object.entries(item.craftIngredients) as [IngredientId, number][];
  const hasAll = reqEntries.every(([id, need]) => (state.ingredients[id] ?? 0) >= need);
  if (!hasAll) {
    const missingText = reqEntries
      .filter(([id, need]) => (state.ingredients[id] ?? 0) < need)
      .map(([id, need]) => `${INGREDIENTS[id].name}需${need}`)
      .join('、');
    return { nextState: state, ok: false, error: `農場作物材料不足（${missingText}）` };
  }

  const nextIngredients = { ...state.ingredients };
  for (const [id, need] of reqEntries) {
    nextIngredients[id] = Math.max(0, (nextIngredients[id] ?? 0) - need);
  }

  const curHouse = state.house;
  const nextCollected = curHouse.collectedFurnitureIds.includes(item.id)
    ? curHouse.collectedFurnitureIds
    : [...curHouse.collectedFurnitureIds, item.id];

  const draft: GameState = {
    ...state,
    ingredients: nextIngredients,
    house: {
      ...curHouse,
      ownedFurnitureCounts: {
        ...curHouse.ownedFurnitureCounts,
        [item.id]: (curHouse.ownedFurnitureCounts[item.id] ?? 0) + 1,
      },
      collectedFurnitureIds: nextCollected,
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? `用農場作物手作完成「${item.name}」！`,
  };
}

export function placeFurnitureItem(
  state: GameState,
  itemId: string,
  x: number,
  y: number,
  placedBy = '飼主'
): HouseActionOutcome {
  if (x < 0 || x >= ROOM_GRID_COLS || y < 0 || y >= ROOM_GRID_ROWS) {
    return { nextState: state, ok: false, error: '超出房間格子範圍' };
  }
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item) return { nextState: state, ok: false, error: '找不到此家具' };

  const stowed = getStowedCountByItem(state.house, itemId);
  if (stowed <= 0) {
    return { nextState: state, ok: false, error: '庫存中沒有可擺放的該家具' };
  }

  const occupied = state.house.roomLayout.placedItems.some((p) => p.x === x && p.y === y);
  if (occupied) {
    return { nextState: state, ok: false, error: '這一格已經有其他家具了（每格限放 1 件）' };
  }

  const newPlaced: PlacedRoomItem = {
    instanceId: `rm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId,
    x,
    y,
    zone: getZoneForCell(x, y),
    placedBy,
    updatedAt: Date.now(),
  };

  const draft: GameState = {
    ...state,
    house: {
      ...state.house,
      roomLayout: {
        ...state.house.roomLayout,
        placedItems: [...state.house.roomLayout.placedItems, newPlaced],
      },
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? `已將「${item.name}」擺放到房間中！`,
  };
}

export function moveFurnitureItem(
  state: GameState,
  instanceId: string,
  targetX: number,
  targetY: number
): HouseActionOutcome {
  if (targetX < 0 || targetX >= ROOM_GRID_COLS || targetY < 0 || targetY >= ROOM_GRID_ROWS) {
    return { nextState: state, ok: false, error: '超出房間範圍' };
  }
  const existing = state.house.roomLayout.placedItems.find((p) => p.instanceId === instanceId);
  if (!existing) return { nextState: state, ok: false, error: '找不到要移動的家具' };

  if (existing.x === targetX && existing.y === targetY) {
    return { nextState: state, ok: true };
  }

  const targetOccupied = state.house.roomLayout.placedItems.some(
    (p) => p.instanceId !== instanceId && p.x === targetX && p.y === targetY
  );
  if (targetOccupied) {
    return { nextState: state, ok: false, error: '目標格子已經擺放了家具！' };
  }

  const draft: GameState = {
    ...state,
    house: {
      ...state.house,
      roomLayout: {
        ...state.house.roomLayout,
        placedItems: state.house.roomLayout.placedItems.map((p) =>
          p.instanceId === instanceId
            ? {
                ...p,
                x: targetX,
                y: targetY,
                zone: getZoneForCell(targetX, targetY),
                updatedAt: Date.now(),
              }
            : p
        ),
      },
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? '已移動家具位置！',
  };
}

export function stowFurnitureItem(state: GameState, instanceId: string): HouseActionOutcome {
  const target = state.house.roomLayout.placedItems.find((p) => p.instanceId === instanceId);
  if (!target) return { nextState: state, ok: false, error: '找不到此家具' };

  const item = ROOM_ITEM_BY_ID[target.itemId];
  return {
    nextState: {
      ...state,
      house: {
        ...state.house,
        roomLayout: {
          ...state.house.roomLayout,
          placedItems: state.house.roomLayout.placedItems.filter((p) => p.instanceId !== instanceId),
        },
      },
    },
    ok: true,
    notice: `已收起「${item?.name ?? '家具'}」到收納袋`,
  };
}

export function sellFurnitureItem(state: GameState, itemId: string): HouseActionOutcome {
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item) return { nextState: state, ok: false, error: '找不到此家具' };

  const ownedCount = state.house.ownedFurnitureCounts[itemId] ?? 0;
  if (ownedCount <= 0) {
    return { nextState: state, ok: false, error: '目前沒有這件家具可以出售' };
  }

  const stowedCount = getStowedCountByItem(state.house, itemId);
  let nextPlaced = state.house.roomLayout.placedItems;
  if (stowedCount <= 0) {
    const idx = nextPlaced.findIndex((p) => p.itemId === itemId);
    if (idx >= 0) {
      nextPlaced = [...nextPlaced.slice(0, idx), ...nextPlaced.slice(idx + 1)];
    }
  }

  const nextCounts = { ...state.house.ownedFurnitureCounts };
  if (ownedCount <= 1) {
    delete nextCounts[itemId];
  } else {
    nextCounts[itemId] = ownedCount - 1;
  }

  return {
    nextState: {
      ...state,
      coins: state.coins + item.sellPrice,
      house: {
        ...state.house,
        ownedFurnitureCounts: nextCounts,
        roomLayout: {
          ...state.house.roomLayout,
          placedItems: nextPlaced,
        },
      },
    },
    ok: true,
    notice: `已出售「${item.name}」，回收 +${item.sellPrice} 金幣`,
  };
}

export function buyOrApplyWallpaper(
  state: GameState,
  wallpaperId: WallpaperId,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const wall = WALLPAPER_BY_ID[wallpaperId];
  if (!wall) return { nextState: state, ok: false, error: '找不到此壁紙' };

  const owned = state.house.unlockedWallpapers.includes(wallpaperId);
  if (owned) {
    return {
      nextState: {
        ...state,
        house: {
          ...state.house,
          roomLayout: { ...state.house.roomLayout, wallpaperId },
        },
      },
      ok: true,
      notice: `已換上「${wall.name}」`,
    };
  }

  const paid = spendFromSource(state, wall.price, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const draft: GameState = {
    ...paid.nextState,
    house: {
      ...paid.nextState.house,
      unlockedWallpapers: [...paid.nextState.house.unlockedWallpapers, wallpaperId],
      roomLayout: {
        ...paid.nextState.house.roomLayout,
        wallpaperId,
      },
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? `購入並貼上「${wall.name}」！`,
  };
}

export function buyOrApplyFlooring(
  state: GameState,
  flooringId: FlooringId,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const floor = FLOORING_BY_ID[flooringId];
  if (!floor) return { nextState: state, ok: false, error: '找不到此地板' };

  const owned = state.house.unlockedFloorings.includes(flooringId);
  if (owned) {
    return {
      nextState: {
        ...state,
        house: {
          ...state.house,
          roomLayout: { ...state.house.roomLayout, flooringId },
        },
      },
      ok: true,
      notice: `已鋪上「${floor.name}」`,
    };
  }

  const paid = spendFromSource(state, floor.price, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const draft: GameState = {
    ...paid.nextState,
    house: {
      ...paid.nextState.house,
      unlockedFloorings: [...paid.nextState.house.unlockedFloorings, flooringId],
      roomLayout: {
        ...paid.nextState.house.roomLayout,
        flooringId,
      },
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: synced.notices[0] ?? `購入並鋪設「${floor.name}」！`,
  };
}

export function buyThemeSetBundle(
  state: GameState,
  themeId: ThemeSetId,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const theme = THEME_SETS.find((t) => t.id === themeId);
  if (!theme) return { nextState: state, ok: false, error: '找不到此主題套裝' };

  if (state.house.completedThemeSets.includes(themeId)) {
    return {
      nextState: {
        ...state,
        house: {
          ...state.house,
          roomLayout: {
            ...state.house.roomLayout,
            wallpaperId: theme.wallpaperId,
            flooringId: theme.flooringId,
          },
        },
      },
      ok: true,
      notice: `已為房間套用「${theme.name}」壁紙與地板！`,
    };
  }

  const paid = spendFromSource(state, theme.bundlePrice, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const curHouse = paid.nextState.house;
  const nextCounts = { ...curHouse.ownedFurnitureCounts };
  const collectedSet = new Set(curHouse.collectedFurnitureIds);

  for (const itemId of theme.itemIds) {
    if ((nextCounts[itemId] ?? 0) === 0) {
      nextCounts[itemId] = 1;
    }
    collectedSet.add(itemId);
  }

  const nextWalls = curHouse.unlockedWallpapers.includes(theme.wallpaperId)
    ? curHouse.unlockedWallpapers
    : [...curHouse.unlockedWallpapers, theme.wallpaperId];

  const nextFloors = curHouse.unlockedFloorings.includes(theme.flooringId)
    ? curHouse.unlockedFloorings
    : [...curHouse.unlockedFloorings, theme.flooringId];

  const draft: GameState = {
    ...paid.nextState,
    house: {
      ...curHouse,
      ownedFurnitureCounts: nextCounts,
      collectedFurnitureIds: Array.from(collectedSet),
      unlockedWallpapers: nextWalls,
      unlockedFloorings: nextFloors,
      roomLayout: {
        ...curHouse.roomLayout,
        wallpaperId: theme.wallpaperId,
        flooringId: theme.flooringId,
      },
    },
  };

  const synced = syncHouseProgress(draft);
  const titleName = TITLE_DEFINITIONS[theme.rewardTitleId].name;
  return {
    nextState: synced.nextState,
    ok: true,
    notice: `解鎖「${theme.name}」套裝！獲得稱號「${titleName}」與限定拍照姿勢`,
  };
}

export function addFurnitureNote(
  state: GameState,
  itemId: string,
  authorName: string,
  content: string
): HouseActionOutcome {
  const clean = content.trim();
  if (!clean) return { nextState: state, ok: false, error: '請先輸入想留給夥伴的話' };

  const note: FurnitureNote = {
    id: `fnote_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId,
    authorName: authorName.trim() || '飼主',
    content: clean.slice(0, 80),
    createdAt: Date.now(),
  };

  return {
    nextState: {
      ...state,
      house: {
        ...state.house,
        furnitureNotes: [note, ...state.house.furnitureNotes].slice(0, 60),
      },
    },
    ok: true,
    notice: '已把悄悄話貼在家具上！',
  };
}

export function expandNextFarmPlot(
  state: GameState,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const currentPlots = state.house.unlockedFarmPlots;
  if (currentPlots >= 8) {
    return { nextState: state, ok: false, error: '已擴建至全部 8 塊農地囉！' };
  }

  const nextPlotNumber = currentPlots + 1; // 5, 6, 7, 8
  const cost = FARM_PLOT_EXPANSION_COSTS[nextPlotNumber];
  if (!cost) return { nextState: state, ok: false, error: '無法擴建農地' };

  const paid = spendFromSource(state, cost, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const newPlot: CropPlot = {
    id: nextPlotNumber - 1,
    cropId: null,
    plantedAt: null,
    durationMs: 0,
  };

  const existingPlots = paid.nextState.farmPlots;
  const nextPlots =
    existingPlots.length >= nextPlotNumber ? existingPlots : [...existingPlots, newPlot];

  const draft: GameState = {
    ...paid.nextState,
    farmPlots: nextPlots,
    house: {
      ...paid.nextState.house,
      unlockedFarmPlots: nextPlotNumber,
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: `成功開墾第 ${nextPlotNumber} 塊農地！`,
  };
}

export function upgradeFarmFacility(
  state: GameState,
  upgradeId: FarmUpgradeId,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const def = FARM_UPGRADES.find((u) => u.id === upgradeId);
  if (!def) return { nextState: state, ok: false, error: '找不到此農場設施' };

  const curUpgrades = state.house.farmUpgrades;
  const curLevel =
    upgradeId === 'sprinkler'
      ? curUpgrades.sprinklerLevel
      : upgradeId === 'greenhouse'
      ? curUpgrades.greenhouseLevel
      : curUpgrades.storageLevel;

  if (curLevel >= def.maxLevel) {
    return { nextState: state, ok: false, error: `${def.name}已達最高等級！` };
  }

  const cost = def.prices[curLevel] ?? def.prices[def.prices.length - 1];
  const paid = spendFromSource(state, cost, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const nextUpgrades = {
    ...paid.nextState.house.farmUpgrades,
    sprinklerLevel:
      upgradeId === 'sprinkler' ? curLevel + 1 : paid.nextState.house.farmUpgrades.sprinklerLevel,
    greenhouseLevel:
      upgradeId === 'greenhouse' ? curLevel + 1 : paid.nextState.house.farmUpgrades.greenhouseLevel,
    storageLevel:
      upgradeId === 'storage' ? curLevel + 1 : paid.nextState.house.farmUpgrades.storageLevel,
  };

  const draft: GameState = {
    ...paid.nextState,
    house: {
      ...paid.nextState.house,
      farmUpgrades: nextUpgrades,
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: `已升級「${def.name}」！${def.effectSummaries[curLevel] ?? ''}`,
  };
}

export function buyOrToggleFarmDecoration(
  state: GameState,
  decorId: FarmDecorationId,
  paySource: PaymentSource = 'personal'
): HouseActionOutcome {
  const decor = FARM_DECORATION_BY_ID[decorId];
  if (!decor) return { nextState: state, ok: false, error: '找不到此農場裝飾' };

  const owned = state.house.ownedFarmDecorations.includes(decorId);
  const slotKey =
    decor.category === 'fence'
      ? 'fenceId'
      : decor.category === 'flowerbed'
      ? 'flowerbedId'
      : 'signId';

  if (owned) {
    const isCurrentlyActive = state.house.activeFarmDecor[slotKey] === decorId;
    return {
      nextState: {
        ...state,
        house: {
          ...state.house,
          activeFarmDecor: {
            ...state.house.activeFarmDecor,
            [slotKey]: isCurrentlyActive ? null : decorId,
          },
        },
      },
      ok: true,
      notice: isCurrentlyActive ? `已收起「${decor.name}」` : `農場已換上「${decor.name}」！`,
    };
  }

  const paid = spendFromSource(state, decor.price, paySource);
  if (!paid.ok) return { nextState: state, ok: false, error: paid.error };

  const draft: GameState = {
    ...paid.nextState,
    house: {
      ...paid.nextState.house,
      ownedFarmDecorations: [...paid.nextState.house.ownedFarmDecorations, decorId],
      activeFarmDecor: {
        ...paid.nextState.house.activeFarmDecor,
        [slotKey]: decorId,
      },
    },
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: `購入並佈置「${decor.name}」！`,
  };
}

export function updateHouseName(state: GameState, rawName: string): HouseActionOutcome {
  const clean = rawName.trim().slice(0, 14);
  if (!clean) {
    return { nextState: state, ok: false, error: '請輸入 1～14 字的小屋名稱' };
  }
  return {
    nextState: {
      ...state,
      house: {
        ...state.house,
        houseName: clean,
      },
    },
    ok: true,
    notice: `小屋招牌已更新為「${clean}」！`,
  };
}

export function depositToSharedTreasury(
  state: GameState,
  amount: number,
  authorName: string
): HouseActionOutcome {
  const cleanAmount = Math.floor(amount);
  if (cleanAmount <= 0) {
    return { nextState: state, ok: false, error: '請選擇大於 0 的存入金額' };
  }
  if (state.coins < cleanAmount) {
    return { nextState: state, ok: false, error: `個人金幣不足 ${cleanAmount}` };
  }

  return {
    nextState: {
      ...state,
      coins: state.coins - cleanAmount,
      house: {
        ...state.house,
        treasuryCoins: state.house.treasuryCoins + cleanAmount,
        treasuryHistory: [
          {
            id: `tr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            authorName: authorName.trim() || '飼主',
            amount: cleanAmount,
            createdAt: Date.now(),
          },
          ...state.house.treasuryHistory,
        ].slice(0, 20),
      },
    },
    ok: true,
    notice: `已存入 ${cleanAmount} 金幣到共同金庫！`,
  };
}

export function selectActiveSharedGoal(state: GameState, goalId: SharedGoalId): GameState {
  return {
    ...state,
    house: {
      ...state.house,
      activeGoalId: goalId,
    },
  };
}

export function completeActiveSharedGoal(state: GameState): HouseActionOutcome {
  const goal = SHARED_GOAL_BY_ID[state.house.activeGoalId];
  if (!goal) return { nextState: state, ok: false, error: '找不到共同目標' };

  if (state.house.completedGoalIds.includes(goal.id)) {
    return { nextState: state, ok: false, error: '此共同目標已經完成過囉！' };
  }

  if (state.house.treasuryCoins < goal.targetCoins) {
    return {
      nextState: state,
      ok: false,
      error: `共同金庫還差 ${goal.targetCoins - state.house.treasuryCoins} 金幣`,
    };
  }

  if (goal.id === 'goal_cozy_6_items' && state.house.roomLayout.placedItems.length < 6) {
    return {
      nextState: state,
      ok: false,
      error: `房間目前擺放 ${state.house.roomLayout.placedItems.length}/6 件家具，先放滿 6 件吧！`,
    };
  }

  let curHouse = {
    ...state.house,
    treasuryCoins: state.house.treasuryCoins - goal.targetCoins,
    completedGoalIds: [...state.house.completedGoalIds, goal.id],
  };

  let nextPlots = state.farmPlots;

  if (goal.id === 'goal_cloud_bed') {
    curHouse = {
      ...curHouse,
      ownedFurnitureCounts: {
        ...curHouse.ownedFurnitureCounts,
        cloud_big_bed: (curHouse.ownedFurnitureCounts.cloud_big_bed ?? 0) + 1,
      },
      collectedFurnitureIds: curHouse.collectedFurnitureIds.includes('cloud_big_bed')
        ? curHouse.collectedFurnitureIds
        : [...curHouse.collectedFurnitureIds, 'cloud_big_bed'],
    };
  } else if (goal.id === 'goal_sprinkler') {
    curHouse = {
      ...curHouse,
      farmUpgrades: {
        ...curHouse.farmUpgrades,
        sprinklerLevel: Math.max(1, curHouse.farmUpgrades.sprinklerLevel),
      },
    };
  } else if (goal.id === 'goal_farm_6') {
    const targetCount = Math.max(6, curHouse.unlockedFarmPlots);
    const expanded: CropPlot[] = [...state.farmPlots];
    while (expanded.length < targetCount) {
      expanded.push({
        id: expanded.length,
        cropId: null,
        plantedAt: null,
        durationMs: 0,
      });
    }
    nextPlots = expanded;
    curHouse = {
      ...curHouse,
      unlockedFarmPlots: targetCount,
    };
  }

  const nextGrowth = state.pet.growth + goal.rewardGrowthBonus;
  const draft: GameState = {
    ...state,
    coins: state.coins + goal.rewardCoinsBonus,
    farmPlots: nextPlots,
    pet: {
      ...state.pet,
      growth: nextGrowth,
      level: getGrowthStage(nextGrowth).level,
    },
    house: curHouse,
  };

  const synced = syncHouseProgress(draft);
  return {
    nextState: synced.nextState,
    ok: true,
    notice: `共同目標「${goal.title}」達成！`,
  };
}

export function claimSharedMilestoneReward(
  state: GameState,
  milestoneId: SharedMilestoneId
): HouseActionOutcome {
  if (!state.house.achievedMilestones.includes(milestoneId)) {
    return { nextState: state, ok: false, error: '尚未達成此佈置里程碑' };
  }
  if (state.house.claimedMilestones.includes(milestoneId)) {
    return { nextState: state, ok: false, error: '已經領取過獎勵囉' };
  }

  const def = SHARED_MILESTONES.find((m) => m.id === milestoneId);
  if (!def) return { nextState: state, ok: false, error: '找不到里程碑定義' };

  const nextGrowth = state.pet.growth + def.rewardGrowth;
  return {
    nextState: {
      ...state,
      coins: state.coins + def.rewardCoins,
      pet: {
        ...state.pet,
        growth: nextGrowth,
        level: getGrowthStage(nextGrowth).level,
      },
      house: {
        ...state.house,
        claimedMilestones: [...state.house.claimedMilestones, milestoneId],
      },
    },
    ok: true,
    notice: `領取里程碑「${def.title}」：+${def.rewardCoins} 金幣、+${def.rewardGrowth} 成長值`,
  };
}

export function saveRoomSnapshotPhoto(
  state: GameState,
  params: {
    title: string;
    caption: string;
    poseId: RoomPhotoPoseId;
  }
): { nextState: GameState; photo: RoomPhotoRecord } {
  const latestNote = state.house.furnitureNotes[0]?.content;
  const photo: RoomPhotoRecord = {
    id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: params.title.trim() || `${state.house.houseName}紀念照`,
    caption: params.caption.trim() || `${state.pet.name}在溫暖的小窩裡留下可愛身影！`,
    createdAt: Date.now(),
    houseName: state.house.houseName,
    species: state.pet.species,
    petName: state.pet.name,
    equipped: { ...state.pet.accessories },
    poseId: params.poseId,
    wallpaperId: state.house.roomLayout.wallpaperId,
    flooringId: state.house.roomLayout.flooringId,
    placedItems: state.house.roomLayout.placedItems.map((p) => ({ ...p })),
    noteHighlight: latestNote,
  };

  const draft: GameState = {
    ...state,
    house: {
      ...state.house,
      photos: [photo, ...state.house.photos].slice(0, 24),
    },
  };

  const synced = syncHouseProgress(draft);
  return { nextState: synced.nextState, photo };
}

export type HousePetReactionType = 'sleep' | 'play';

export interface HousePetCoordinates {
  cellX: number;
  cellY: number;
  xPercent: number;
  yPercent: number;
}

export interface HousePetInteractionTarget {
  placedItem: PlacedRoomItem;
  item: RoomItem;
  reactionType: HousePetReactionType;
  preferenceMatch: PreferenceMatch;
  petAction: PiggyActionState;
  expression: PetExpression;
  reactionText: string;
  approachText: string;
  furnitureCoordinates: HousePetCoordinates;
  targetCoordinates: HousePetCoordinates;
  entryCoordinates: HousePetCoordinates;
}

export function getHouseFurnitureReactionType(
  item: RoomItem,
  species?: PetSpecies
): HousePetReactionType | null {
  if (item.category === 'bed' || item.category === 'pillow' || item.category === 'blanket') {
    return 'sleep';
  }
  if (item.category === 'toyBall' || item.category === 'toy' || item.category === 'rug') {
    return 'play';
  }
  if (
    species &&
    (item.category === 'snackRack' || item.category === 'plant') &&
    evaluateItemPreference(species, item.id) === 'favorite'
  ) {
    return 'play';
  }
  return null;
}

export function calculateRoomCellCoordinates(
  cellX: number,
  cellY: number,
  cols = ROOM_GRID_COLS,
  rows = ROOM_GRID_ROWS
): HousePetCoordinates {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);
  const clampedX = Math.max(0, Math.min(safeCols - 1, cellX));
  const clampedY = Math.max(0, Math.min(safeRows - 1, cellY));

  return {
    cellX: clampedX,
    cellY: clampedY,
    xPercent: Number((((clampedX + 0.5) / safeCols) * 100).toFixed(2)),
    yPercent: Number((((clampedY + 0.5) / safeRows) * 100).toFixed(2)),
  };
}

export function calculatePetInteractionCoordinates(
  placedItem: PlacedRoomItem,
  reactionType: HousePetReactionType,
  cols = ROOM_GRID_COLS,
  rows = ROOM_GRID_ROWS
): HousePetCoordinates {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);

  if (reactionType === 'sleep') {
    // 睡覺時貼近／窩在床鋪正上方一點的位置
    const targetCellX = placedItem.x;
    const targetCellY = Math.max(0, placedItem.y - 0.14);
    return {
      cellX: targetCellX,
      cellY: targetCellY,
      xPercent: Number((((targetCellX + 0.5) / safeCols) * 100).toFixed(2)),
      yPercent: Number(
        Math.max(14, Math.min(86, ((targetCellY + 0.45) / safeRows) * 100)).toFixed(2)
      ),
    };
  }

  // 玩耍時站在玩具旁側邊互動，避免完全遮住玩具
  const offsetDirection = placedItem.x >= safeCols / 2 ? -0.36 : 0.36;
  const targetCellX = Math.max(0.1, Math.min(safeCols - 1.1, placedItem.x + offsetDirection));
  const targetCellY = placedItem.y;

  return {
    cellX: targetCellX,
    cellY: targetCellY,
    xPercent: Number(
      Math.max(10, Math.min(90, ((targetCellX + 0.5) / safeCols) * 100)).toFixed(2)
    ),
    yPercent: Number(
      Math.max(14, Math.min(86, ((targetCellY + 0.52) / safeRows) * 100)).toFixed(2)
    ),
  };
}

export function getHouseEntryCoordinates(
  cols = ROOM_GRID_COLS,
  rows = ROOM_GRID_ROWS
): HousePetCoordinates {
  const safeCols = Math.max(1, cols);
  const safeRows = Math.max(1, rows);
  const entryCellX = (safeCols - 1) / 2;
  const entryCellY = safeRows - 0.25;
  return {
    cellX: entryCellX,
    cellY: entryCellY,
    xPercent: 50,
    yPercent: 90,
  };
}

export function selectRandomHouseInteraction(
  house: SharedHouse,
  options?: {
    excludeInstanceId?: string;
    preferredInstanceId?: string;
    species?: PetSpecies;
  }
): HousePetInteractionTarget | null {
  const cols = house.roomLayout.cols || ROOM_GRID_COLS;
  const rows = house.roomLayout.rows || ROOM_GRID_ROWS;
  const placedItems = house.roomLayout.placedItems;
  const species = options?.species;

  if (placedItems.length === 0) return null;

  const entryCoordinates = getHouseEntryCoordinates(cols, rows);

  const buildTarget = (placedItem: PlacedRoomItem): HousePetInteractionTarget | null => {
    const item = ROOM_ITEM_BY_ID[placedItem.itemId];
    if (!item) return null;
    const reactionType = getHouseFurnitureReactionType(item, species);
    if (!reactionType) return null;

    const preferenceMatch: PreferenceMatch = species
      ? evaluateItemPreference(species, item.id)
      : 'neutral';

    const furnitureCoordinates = calculateRoomCellCoordinates(
      placedItem.x,
      placedItem.y,
      cols,
      rows
    );
    const targetCoordinates = calculatePetInteractionCoordinates(
      placedItem,
      reactionType,
      cols,
      rows
    );

    const petAction: PiggyActionState =
      reactionType === 'sleep' ? 'sleeping' : 'walking';
    const expression: PetExpression =
      preferenceMatch === 'favorite'
        ? 'sparkle'
        : reactionType === 'sleep'
        ? 'shy'
        : item.category === 'toyBall' || item.category === 'toy'
        ? 'sparkle'
        : 'happyTongue';

    const favPool = species ? FAVORITE_ITEM_BUBBLE_SPEECHES[species] : [];
    const favoriteReaction =
      preferenceMatch === 'favorite' && favPool.length > 0
        ? `${item.petReactionText}（${favPool[Math.floor(Math.random() * favPool.length)]}）`
        : preferenceMatch === 'disliked'
        ? `雖然「${item.name}」普通，還是散步經過看一眼～`
        : item.petReactionText;

    const approachText =
      preferenceMatch === 'favorite'
        ? `眼睛發亮！發現最愛的「${item.name}」跑過去囉！`
        : `正走向「${item.name}」…`;

    return {
      placedItem,
      item,
      reactionType,
      preferenceMatch,
      petAction,
      expression,
      reactionText: favoriteReaction,
      approachText,
      furnitureCoordinates,
      targetCoordinates,
      entryCoordinates,
    };
  };

  if (options?.preferredInstanceId) {
    const preferred = placedItems.find((p) => p.instanceId === options.preferredInstanceId);
    if (preferred) {
      const built = buildTarget(preferred);
      if (built) return built;
    }
  }

  // 優先從已放置的「床 (bed)」、「玩具 (toy / toyBall)」或偏好家具中選取
  const allTargets = placedItems
    .map(buildTarget)
    .filter((t): t is HousePetInteractionTarget => t !== null);

  if (allTargets.length === 0) return null;

  // 若有最愛家具或玩具，優先提高寵物主動走向偏好物品的機率 (約 72%)
  const favoriteTargets = allTargets.filter((t) => t.preferenceMatch === 'favorite');
  const nonDislikedTargets = allTargets.filter((t) => t.preferenceMatch !== 'disliked');
  const primaryInteractiveTargets = nonDislikedTargets.filter(
    (t) =>
      t.item.category === 'bed' ||
      t.item.category === 'toy' ||
      t.item.category === 'toyBall'
  );

  let chosenPool: HousePetInteractionTarget[];
  if (favoriteTargets.length > 0 && Math.random() < 0.72) {
    chosenPool = favoriteTargets;
  } else if (primaryInteractiveTargets.length > 0) {
    chosenPool = primaryInteractiveTargets;
  } else if (nonDislikedTargets.length > 0) {
    chosenPool = nonDislikedTargets;
  } else {
    chosenPool = allTargets;
  }

  const filteredPool =
    options?.excludeInstanceId && chosenPool.length > 1
      ? chosenPool.filter((t) => t.placedItem.instanceId !== options.excludeInstanceId)
      : chosenPool;

  const pool = filteredPool.length > 0 ? filteredPool : chosenPool;
  const chosenIndex = Math.floor(Math.random() * pool.length);
  return pool[chosenIndex] ?? null;
}

