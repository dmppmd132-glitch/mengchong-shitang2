import {
  COOP_FARM_DAILY_ORDERS,
  COOP_ROOM_THEMES,
  buildFarmRelayReward,
  buildRoomDecorReward,
} from '../data/coop';
import { getTitleDefinition } from '../data/encyclopedia';
import {
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEM_BY_ID,
  ROOM_ZONES,
  getZoneForCell,
} from '../data/house';
import {
  INGREDIENT_IDS,
  INGREDIENTS,
  KITCHEN_RECIPES,
  createInitialFarmPlots,
} from '../data/kitchen';
import {
  CoopBadgeId,
  CoopFarmOrderState,
  CoopGameType,
  CoopHubState,
  CoopMessageCard,
  CoopOfflineEvent,
  CoopReward,
  CoopSession,
  GameState,
  IngredientId,
  KitchenRecipe,
  PlacedRoomItem,
  ThemeSetId,
} from '../types';
import { mergeDialogueRemoteState } from './dialogue';
import { getEffectiveGrowDurationMs, getEffectiveHarvestYield, syncHouseProgress } from './house';

export function getCoopDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getEndOfDayTimestamp(dateStr: string): number {
  const parsed = new Date(`${dateStr}T23:59:59`);
  if (Number.isNaN(parsed.getTime())) {
    return Date.now() + 86400000;
  }
  return parsed.getTime();
}

function getDayIndexFromKey(dateKey: string): number {
  const parts = dateKey.split('-').map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;
  const utc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.floor(utc / 86400000);
}

export function createZeroWarehouse(): Record<IngredientId, number> {
  return {
    carrot: 0,
    corn: 0,
    strawberry: 0,
    pumpkin: 0,
    blueberry: 0,
    mint: 0,
    sunflower: 0,
  };
}

export function createDailyFarmOrder(dateKey: string = getCoopDateKey()): CoopFarmOrderState {
  const dayIdx = getDayIndexFromKey(dateKey);
  const template =
    COOP_FARM_DAILY_ORDERS[Math.abs(dayIdx) % COOP_FARM_DAILY_ORDERS.length];
  const craftTarget = Object.values(template.requiredFoodCounts ?? {}).reduce(
    (sum, qty) => sum + qty,
    0
  );
  const harvestTarget = template.requiredHarvestTotal ?? 4;

  return {
    dateKey,
    goal: {
      ...template,
      requiredHarvestTotal: harvestTarget,
      requiredCraftTotal: craftTarget,
    },
    progress: {
      completedCount: 0,
      targetCount: craftTarget,
      harvestedCount: 0,
      harvestTarget,
      craftedCount: 0,
      craftTarget,
      foodsDone: {},
    },
    expiresAt: getEndOfDayTimestamp(dateKey),
    completed: false,
    overdue: false,
    rewardClaimed: false,
    rewardId: null,
  };
}

export function createInitialCoopHubState(dateKey: string = getCoopDateKey()): CoopHubState {
  return {
    activeRoomSession: null,
    dailyFarmOrder: createDailyFarmOrder(dateKey),
    sharedWarehouse: createZeroWarehouse(),
    coopFarmPlots: createInitialFarmPlots(4),
    pendingRewards: [],
    unlockedBadges: [],
    earnedCards: [],
    streakDays: 0,
    lastCoopCompletedDate: null,
    offlineEvents: [],
    lastSeenByUserId: {},
  };
}

export function syncCoopHubState(
  coop: CoopHubState,
  todayKey: string = getCoopDateKey(),
  now: number = Date.now()
): CoopHubState {
  let nextFarmOrder = coop.dailyFarmOrder;
  if (coop.dailyFarmOrder.dateKey !== todayKey) {
    nextFarmOrder = createDailyFarmOrder(todayKey);
  } else if (!nextFarmOrder.completed && now > nextFarmOrder.expiresAt) {
    nextFarmOrder = {
      ...nextFarmOrder,
      overdue: true,
    };
  }

  let nextSession = coop.activeRoomSession;
  if (
    nextSession &&
    nextSession.status === 'active' &&
    now >= nextSession.expiresAt
  ) {
    nextSession = {
      ...nextSession,
      status: 'expired',
    };
  }

  // Keep streak accurate: if lastCoopCompletedDate was more than 1 day before today, reset streak
  let streakDays = coop.streakDays;
  if (coop.lastCoopCompletedDate) {
    const diff = getDayIndexFromKey(todayKey) - getDayIndexFromKey(coop.lastCoopCompletedDate);
    if (diff > 1) {
      streakDays = 0;
    }
  }

  if (
    nextFarmOrder === coop.dailyFarmOrder &&
    nextSession === coop.activeRoomSession &&
    streakDays === coop.streakDays
  ) {
    return coop;
  }

  return {
    ...coop,
    dailyFarmOrder: nextFarmOrder,
    activeRoomSession: nextSession,
    streakDays,
  };
}

function appendOfflineEvent(
  events: CoopOfflineEvent[],
  actorUserId: string,
  actorName: string,
  gameType: CoopGameType,
  summary: string
): CoopOfflineEvent[] {
  const entry: CoopOfflineEvent = {
    id: `coev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    actorUserId,
    actorName: actorName.trim() || '夥伴',
    gameType,
    summary,
    createdAt: Date.now(),
  };
  return [entry, ...events].slice(0, 20);
}

function advanceCoopStreak(
  coop: CoopHubState,
  todayKey: string
): {
  streakDays: number;
  lastCoopCompletedDate: string;
  newlyUnlockedBestPartner: boolean;
  newlyUnlockedPartnerTitle: boolean;
} {
  let nextStreak = coop.streakDays;
  if (coop.lastCoopCompletedDate === todayKey) {
    nextStreak = Math.max(1, coop.streakDays);
  } else if (coop.lastCoopCompletedDate) {
    const diff = getDayIndexFromKey(todayKey) - getDayIndexFromKey(coop.lastCoopCompletedDate);
    nextStreak = diff === 1 ? coop.streakDays + 1 : 1;
  } else {
    nextStreak = 1;
  }

  return {
    streakDays: nextStreak,
    lastCoopCompletedDate: todayKey,
    newlyUnlockedBestPartner:
      nextStreak >= 3 && !coop.unlockedBadges.includes('best_partner'),
    newlyUnlockedPartnerTitle: nextStreak >= 7,
  };
}

export interface CoopActionResult {
  nextState: GameState;
  ok: boolean;
  error?: string;
  notice?: string;
}

// =========================================================================
// Game 1: 一起布置房間 (90s Co-op Room Decorating)
// =========================================================================

export function startRoomDecorSession(
  state: GameState,
  requestedThemeId?: ThemeSetId
): CoopActionResult {
  const now = Date.now();
  const theme =
    (requestedThemeId
      ? COOP_ROOM_THEMES.find((t) => t.themeId === requestedThemeId)
      : undefined) ??
    COOP_ROOM_THEMES[Math.floor(Math.random() * COOP_ROOM_THEMES.length)];

  const durationSeconds = theme.durationSeconds;
  const session: CoopSession = {
    id: `csess_${now}_${Math.random().toString(36).slice(2, 6)}`,
    gameType: 'room_decor',
    status: 'active',
    themeId: theme.themeId,
    goal: {
      id: `goal_${theme.themeId}`,
      gameType: 'room_decor',
      title: `主題挑戰：${theme.name}`,
      description: theme.description,
      themeId: theme.themeId,
      targetItemCount: theme.targetItemCount,
    },
    progress: {
      completedCount: 0,
      targetCount: theme.targetItemCount,
      harvestedCount: 0,
      harvestTarget: 0,
      craftedCount: 0,
      craftTarget: 0,
      foodsDone: {},
    },
    startedAt: now,
    expiresAt: now + durationSeconds * 1000,
    durationSeconds,
    candidateQueue: [],
    placedInstanceIds: [],
    settled: false,
    rewardId: null,
  };

  return {
    nextState: {
      ...state,
      coop: {
        ...state.coop,
        activeRoomSession: session,
      },
    },
    ok: true,
    notice: `開始 90 秒「${theme.name}」合作佈置！`,
  };
}

export function selectCoopFurnitureForQueue(
  state: GameState,
  itemId: string,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const session = state.coop.activeRoomSession;
  if (!session || session.status !== 'active') {
    return { nextState: state, ok: false, error: '目前沒有進行中的佈置回合，請先開局！' };
  }
  if (Date.now() >= session.expiresAt) {
    return { nextState: state, ok: false, error: '90 秒時間已經到了，請先結算本回合！' };
  }

  const theme = COOP_ROOM_THEMES.find((t) => t.themeId === session.themeId);
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item) {
    return { nextState: state, ok: false, error: '找不到這件家具' };
  }
  if (theme && !theme.eligibleItemIds.includes(itemId)) {
    return {
      nextState: state,
      ok: false,
      error: `「${item.name}」不符合本回合「${theme.name}」主題清單喔！`,
    };
  }

  const pendingCount = session.candidateQueue.filter((c) => !c.placed).length;
  if (pendingCount >= 6) {
    return {
      nextState: state,
      ok: false,
      error: '候選清單已滿 6 件，請等夥伴先擺放幾件到房間裡！',
    };
  }

  const candidate = {
    queueId: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId,
    selectedByUserId: actorUserId,
    selectedByName: actorName.trim() || '夥伴',
    selectedAt: Date.now(),
    placed: false,
  };

  const nextSession: CoopSession = {
    ...session,
    candidateQueue: [...session.candidateQueue, candidate],
  };

  return {
    nextState: {
      ...state,
      coop: {
        ...state.coop,
        activeRoomSession: nextSession,
        offlineEvents: appendOfflineEvent(
          state.coop.offlineEvents,
          actorUserId,
          actorName,
          'room_decor',
          `挑選了「${item.name}」進入合作候選清單`
        ),
      },
    },
    ok: true,
    notice: `已把「${item.name}」送進夥伴的擺放候選清單！`,
  };
}

export function placeCoopCandidateInRoom(
  state: GameState,
  queueId: string,
  x: number,
  y: number,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const session = state.coop.activeRoomSession;
  if (!session || session.status !== 'active') {
    return { nextState: state, ok: false, error: '目前沒有進行中的佈置回合' };
  }
  if (Date.now() >= session.expiresAt) {
    return { nextState: state, ok: false, error: '時間已結束，請進行結算' };
  }
  if (x < 0 || x >= ROOM_GRID_COLS || y < 0 || y >= ROOM_GRID_ROWS) {
    return { nextState: state, ok: false, error: '超出房間格子範圍' };
  }

  const candidate = session.candidateQueue.find((c) => c.queueId === queueId && !c.placed);
  if (!candidate) {
    return { nextState: state, ok: false, error: '這件家具已經擺放完成囉' };
  }

  const item = ROOM_ITEM_BY_ID[candidate.itemId];
  if (!item) {
    return { nextState: state, ok: false, error: '找不到此家具資料' };
  }

  // Conflict check: single item per cell
  const occupied = state.house.roomLayout.placedItems.some(
    (p) => p.x === x && p.y === y
  );
  if (occupied) {
    return {
      nextState: state,
      ok: false,
      error: '發生位置衝突：同一格只能放置一件家具，請換一格！',
    };
  }

  const cellZone = getZoneForCell(x, y);
  if (cellZone !== item.zone) {
    return {
      nextState: state,
      ok: false,
      error: `「${item.name}」屬於「${ROOM_ZONES[item.zone].name}」，請放到對應區域的格子！`,
    };
  }

  const newPlaced: PlacedRoomItem = {
    instanceId: `coop_rm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    itemId: item.id,
    x,
    y,
    zone: cellZone,
    placedBy: actorName.trim() || '合作夥伴',
    updatedAt: Date.now(),
  };

  const nextCompleted = session.progress.completedCount + 1;
  const isAllDone = nextCompleted >= session.progress.targetCount;
  const nextQueue = session.candidateQueue.map((c) =>
    c.queueId === queueId ? { ...c, placed: true } : c
  );

  const curHouse = state.house;
  const nextCollected = curHouse.collectedFurnitureIds.includes(item.id)
    ? curHouse.collectedFurnitureIds
    : [...curHouse.collectedFurnitureIds, item.id];

  const draft: GameState = {
    ...state,
    house: {
      ...curHouse,
      ownedFurnitureCounts: {
        ...curHouse.ownedFurnitureCounts,
        [item.id]: (curHouse.ownedFurnitureCounts[item.id] ?? 0) + 1,
      },
      collectedFurnitureIds: nextCollected,
      roomLayout: {
        ...curHouse.roomLayout,
        placedItems: [...curHouse.roomLayout.placedItems, newPlaced],
      },
    },
    coop: {
      ...state.coop,
      activeRoomSession: {
        ...session,
        status: isAllDone ? 'completed' : 'active',
        candidateQueue: nextQueue,
        placedInstanceIds: [...session.placedInstanceIds, newPlaced.instanceId],
        progress: {
          ...session.progress,
          completedCount: nextCompleted,
        },
      },
      offlineEvents: appendOfflineEvent(
        state.coop.offlineEvents,
        actorUserId,
        actorName,
        'room_decor',
        `將「${item.name}」擺放到${ROOM_ZONES[cellZone].name} (${nextCompleted}/${session.progress.targetCount})`
      ),
    },
  };

  const synced = syncHouseProgress(draft).nextState;

  if (isAllDone) {
    return settleRoomDecorSession(synced);
  }

  return {
    nextState: synced,
    ok: true,
    notice: `成功擺放「${item.name}」！目前進度 ${nextCompleted} / ${session.progress.targetCount}`,
  };
}

export function settleRoomDecorSession(state: GameState): CoopActionResult {
  const session = state.coop.activeRoomSession;
  if (!session) {
    return { nextState: state, ok: false, error: '目前沒有需要結算的佈置回合' };
  }
  if (session.settled) {
    return { nextState: state, ok: true, notice: '本回合已完成結算' };
  }

  const theme = COOP_ROOM_THEMES.find((t) => t.themeId === session.themeId);
  const completedCount = session.progress.completedCount;
  const targetCount = session.progress.targetCount;
  const isCompleted = completedCount >= targetCount;

  // Failed / 0 items still causes zero penalties and keeps placed furniture in room
  if (completedCount === 0) {
    return {
      nextState: {
        ...state,
        coop: {
          ...state.coop,
          activeRoomSession: {
            ...session,
            status: 'expired',
            settled: true,
          },
        },
      },
      ok: true,
      notice: '時間結束囉！雖然這次尚未完成擺放，但不扣任何資源，隨時可再挑戰！',
    };
  }

  const rewardDraft = buildRoomDecorReward(
    completedCount,
    targetCount,
    theme?.name ?? '主題小屋'
  );
  const rewardId = `rw_room_${session.id}`;
  const reward: CoopReward = {
    ...rewardDraft,
    id: rewardId,
    claimedByUserIds: [],
    createdAt: Date.now(),
  };

  const todayKey = getCoopDateKey();
  let nextStreak = state.coop.streakDays;
  let nextLastCompleted = state.coop.lastCoopCompletedDate;
  const nextBadges: CoopBadgeId[] = [...state.coop.unlockedBadges];
  let nextUnlockedTitles = [...state.encyclopedia.unlockedTitles];
  let nextActiveTitle = state.encyclopedia.activeTitle;

  if (isCompleted) {
    const streakRes = advanceCoopStreak(state.coop, todayKey);
    nextStreak = streakRes.streakDays;
    nextLastCompleted = streakRes.lastCoopCompletedDate;
    if (reward.badgeId && !nextBadges.includes(reward.badgeId)) {
      nextBadges.push(reward.badgeId);
    }
    if (streakRes.newlyUnlockedBestPartner && !nextBadges.includes('best_partner')) {
      nextBadges.push('best_partner');
    }
    if (
      streakRes.newlyUnlockedPartnerTitle &&
      !nextUnlockedTitles.includes('coop_partner')
    ) {
      nextUnlockedTitles = [...nextUnlockedTitles, 'coop_partner'];
      if (!nextActiveTitle) nextActiveTitle = 'coop_partner';
    }
  }

  return {
    nextState: {
      ...state,
      encyclopedia: {
        ...state.encyclopedia,
        unlockedTitles: nextUnlockedTitles,
        activeTitle: nextActiveTitle,
      },
      coop: {
        ...state.coop,
        activeRoomSession: {
          ...session,
          status: isCompleted ? 'completed' : 'expired',
          settled: true,
          rewardId,
        },
        pendingRewards: [reward, ...state.coop.pendingRewards].slice(0, 12),
        unlockedBadges: nextBadges,
        streakDays: nextStreak,
        lastCoopCompletedDate: nextLastCompleted,
      },
    },
    ok: true,
    notice: isCompleted
      ? `完成 ${completedCount}/${targetCount} 件家具！兩人都能領取相同獎勵！`
      : `時間到！完成了 ${completedCount}/${targetCount} 件家具（家具已保留在小屋，依完成度發放獎勵）`,
  };
}

// =========================================================================
// Game 2: 農場訂單接力 (Daily Co-op Farm & Kitchen Relay)
// =========================================================================

export function plantCoopCrop(
  state: GameState,
  plotId: number,
  ingredientId: IngredientId,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const info = INGREDIENTS[ingredientId];
  if (state.coins < info.seedCost) {
    return { nextState: state, ok: false, error: `金幣不足 ${info.seedCost}` };
  }
  const targetPlot = state.coop.coopFarmPlots.find((p) => p.id === plotId);
  if (!targetPlot || targetPlot.cropId !== null) {
    return { nextState: state, ok: false, error: '這塊共同農地已經種植作物囉' };
  }

  const plantedAt = Date.now();
  const durationMs = getEffectiveGrowDurationMs(info.growSeconds, state.house);

  return {
    nextState: {
      ...state,
      coins: state.coins - info.seedCost,
      coop: {
        ...state.coop,
        coopFarmPlots: state.coop.coopFarmPlots.map((p) =>
          p.id === plotId
            ? { ...p, cropId: ingredientId, plantedAt, durationMs }
            : p
        ),
        offlineEvents: appendOfflineEvent(
          state.coop.offlineEvents,
          actorUserId,
          actorName,
          'farm_relay',
          `在接力農地種下了「${info.name}」`
        ),
      },
    },
    ok: true,
    notice: `在共同農地種下${info.name}，成熟後會自動收進共同倉庫！`,
  };
}

export function harvestCoopCropToWarehouse(
  state: GameState,
  plotId: number,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const targetPlot = state.coop.coopFarmPlots.find((p) => p.id === plotId);
  if (!targetPlot || !targetPlot.cropId || targetPlot.plantedAt === null) {
    return { nextState: state, ok: false, error: '這裡還沒有種植作物' };
  }
  if (Date.now() < targetPlot.plantedAt + targetPlot.durationMs) {
    return { nextState: state, ok: false, error: '作物還在成長中，再等一下下喔！' };
  }

  const cropId = targetPlot.cropId;
  const cropInfo = INGREDIENTS[cropId];
  const yieldQty = getEffectiveHarvestYield(cropInfo.harvestYield, state.house);
  const nextWarehouse: Record<IngredientId, number> = {
    ...state.coop.sharedWarehouse,
    [cropId]: (state.coop.sharedWarehouse[cropId] ?? 0) + yieldQty,
  };

  const order = state.coop.dailyFarmOrder;
  const nextHarvested = order.progress.harvestedCount + yieldQty;

  return {
    nextState: {
      ...state,
      coop: {
        ...state.coop,
        sharedWarehouse: nextWarehouse,
        coopFarmPlots: state.coop.coopFarmPlots.map((p) =>
          p.id === plotId
            ? { ...p, cropId: null, plantedAt: null, durationMs: 0 }
            : p
        ),
        dailyFarmOrder: {
          ...order,
          progress: {
            ...order.progress,
            harvestedCount: nextHarvested,
          },
        },
        offlineEvents: appendOfflineEvent(
          state.coop.offlineEvents,
          actorUserId,
          actorName,
          'farm_relay',
          `收成 ${yieldQty} 份${cropInfo.name}進入共同倉庫`
        ),
      },
    },
    ok: true,
    notice: `採收 ${cropInfo.name} +${yieldQty} 存入共同倉庫！`,
  };
}

export function depositIngredientToCoopWarehouse(
  state: GameState,
  ingredientId: IngredientId,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const qty = state.ingredients[ingredientId] ?? 0;
  if (qty <= 0) {
    return { nextState: state, ok: false, error: '個人倉庫沒有這個食材可支援' };
  }
  const info = INGREDIENTS[ingredientId];
  return {
    nextState: {
      ...state,
      ingredients: {
        ...state.ingredients,
        [ingredientId]: qty - 1,
      },
      coop: {
        ...state.coop,
        sharedWarehouse: {
          ...state.coop.sharedWarehouse,
          [ingredientId]: (state.coop.sharedWarehouse[ingredientId] ?? 0) + 1,
        },
        offlineEvents: appendOfflineEvent(
          state.coop.offlineEvents,
          actorUserId,
          actorName,
          'farm_relay',
          `從個人庫存支援了 1 份${info.name}進共同倉庫`
        ),
      },
    },
    ok: true,
    notice: `已支援 1 份${info.name}到共同倉庫！`,
  };
}

export function cookCoopOrderRecipe(
  state: GameState,
  recipe: KitchenRecipe,
  actorUserId: string,
  actorName: string
): CoopActionResult {
  const order = syncCoopHubState(state.coop).dailyFarmOrder;
  const reqEntries = Object.entries(recipe.ingredients) as [IngredientId, number][];
  const hasAll = reqEntries.every(
    ([id, need]) => (state.coop.sharedWarehouse[id] ?? 0) >= need
  );

  if (!hasAll) {
    return {
      nextState: state,
      ok: false,
      error: '共同倉庫食材還不夠，請農夫先收成或支援食材！',
    };
  }

  const nextWarehouse: Record<IngredientId, number> = {
    ...state.coop.sharedWarehouse,
  };
  for (const [id, need] of reqEntries) {
    nextWarehouse[id] = Math.max(0, (nextWarehouse[id] ?? 0) - need);
  }

  const requiredFoods = order.goal.requiredFoodCounts ?? {};
  const targetForFood = requiredFoods[recipe.outputFoodId] ?? 0;
  const prevDoneForFood = order.progress.foodsDone[recipe.outputFoodId] ?? 0;
  const countsTowardOrder =
    !order.completed && targetForFood > 0 && prevDoneForFood < targetForFood;

  const nextFoodsDone = countsTowardOrder
    ? {
        ...order.progress.foodsDone,
        [recipe.outputFoodId]: prevDoneForFood + 1,
      }
    : order.progress.foodsDone;

  const nextCraftedCount = Object.entries(requiredFoods).reduce((sum, [foodId, req]) => {
    return sum + Math.min(req, nextFoodsDone[foodId] ?? 0);
  }, 0);

  const isOrderNowCompleted =
    !order.completed &&
    Object.entries(requiredFoods).every(
      ([foodId, req]) => (nextFoodsDone[foodId] ?? 0) >= req
    );

  const nextFoodsInventory = {
    ...state.foods,
    [recipe.outputFoodId]: (state.foods[recipe.outputFoodId] ?? 0) + 1,
  };

  let nextCoop: CoopHubState = {
    ...state.coop,
    sharedWarehouse: nextWarehouse,
    dailyFarmOrder: {
      ...order,
      completed: order.completed || isOrderNowCompleted,
      progress: {
        ...order.progress,
        craftedCount: nextCraftedCount,
        completedCount: nextCraftedCount,
        foodsDone: nextFoodsDone,
      },
    },
    offlineEvents: appendOfflineEvent(
      state.coop.offlineEvents,
      actorUserId,
      actorName,
      'farm_relay',
      `在合作廚房合成了「${recipe.name}」`
    ),
  };

  let nextUnlockedTitles = [...state.encyclopedia.unlockedTitles];
  let nextActiveTitle = state.encyclopedia.activeTitle;

  // Complete within deadline -> generate identical reward for both partners
  if (isOrderNowCompleted && !order.overdue) {
    const todayKey = getCoopDateKey();
    const dayIdx = getDayIndexFromKey(todayKey);
    const rewardDraft = buildFarmRelayReward(order.goal.title, dayIdx);
    const rewardId = `rw_farm_${order.dateKey}_${Date.now()}`;
    const reward: CoopReward = {
      ...rewardDraft,
      id: rewardId,
      claimedByUserIds: [],
      createdAt: Date.now(),
    };

    const streakRes = advanceCoopStreak(nextCoop, todayKey);
    const nextBadges = [...nextCoop.unlockedBadges];
    if (reward.badgeId && !nextBadges.includes(reward.badgeId)) {
      nextBadges.push(reward.badgeId);
    }
    if (streakRes.newlyUnlockedBestPartner && !nextBadges.includes('best_partner')) {
      nextBadges.push('best_partner');
    }
    if (
      streakRes.newlyUnlockedPartnerTitle &&
      !nextUnlockedTitles.includes('coop_partner')
    ) {
      nextUnlockedTitles = [...nextUnlockedTitles, 'coop_partner'];
      if (!nextActiveTitle) nextActiveTitle = 'coop_partner';
    }

    const earnedCard: CoopMessageCard | null =
      reward.messageCardTitle && reward.messageCardBody
        ? {
            id: `card_${todayKey}_${Date.now()}`,
            title: reward.messageCardTitle,
            body: reward.messageCardBody,
            emoji: '💌',
            earnedDate: todayKey,
            createdAt: Date.now(),
          }
        : null;

    nextCoop = {
      ...nextCoop,
      dailyFarmOrder: {
        ...nextCoop.dailyFarmOrder,
        rewardId,
      },
      pendingRewards: [reward, ...nextCoop.pendingRewards].slice(0, 12),
      unlockedBadges: nextBadges,
      earnedCards: earnedCard
        ? [earnedCard, ...nextCoop.earnedCards].slice(0, 20)
        : nextCoop.earnedCards,
      streakDays: streakRes.streakDays,
      lastCoopCompletedDate: streakRes.lastCoopCompletedDate,
    };
  }

  return {
    nextState: {
      ...state,
      foods: nextFoodsInventory,
      encyclopedia: {
        ...state.encyclopedia,
        unlockedTitles: nextUnlockedTitles,
        activeTitle: nextActiveTitle,
      },
      coop: nextCoop,
    },
    ok: true,
    notice: isOrderNowCompleted
      ? order.overdue
        ? `已完成今日料理，雖然超過期限無額外禮包，但不扣任何資源喔！`
        : `🎉 共同訂單達成！兩位夥伴都可領取完全相同的豐厚獎勵！`
      : `合成「${recipe.name}」！訂單進度 ${nextCraftedCount} / ${order.progress.craftTarget}`,
  };
}

// =========================================================================
// Identical Reward Claiming (Equal for Both Partners)
// =========================================================================

export function claimCoopReward(
  state: GameState,
  rewardId: string,
  userId: string
): CoopActionResult {
  const target = state.coop.pendingRewards.find((r) => r.id === rewardId);
  if (!target) {
    return { nextState: state, ok: false, error: '找不到這份合作獎勵' };
  }
  if (target.claimedByUserIds.includes(userId)) {
    return { nextState: state, ok: false, error: '你已經領取過這份獎勵囉！' };
  }

  const nextIngredients = { ...state.ingredients };
  for (const id of INGREDIENT_IDS) {
    const bonus = target.rareIngredients[id] ?? 0;
    if (bonus > 0) {
      nextIngredients[id] = (nextIngredients[id] ?? 0) + bonus;
    }
  }

  const nextRewards = state.coop.pendingRewards.map((r) =>
    r.id === rewardId
      ? { ...r, claimedByUserIds: [...r.claimedByUserIds, userId] }
      : r
  );

  const isFarmOrderReward =
    state.coop.dailyFarmOrder.rewardId === rewardId;

  const unlockedTitleMsg = state.encyclopedia.unlockedTitles.includes('coop_partner')
    ? ` · 稱號「${getTitleDefinition('coop_partner').name}」已解鎖`
    : '';

  return {
    nextState: {
      ...state,
      coins: state.coins + target.coins,
      furnitureShards: state.furnitureShards + target.furnitureShards,
      ingredients: nextIngredients,
      pet: {
        ...state.pet,
        intimacy: state.pet.intimacy + target.intimacy,
      },
      coop: {
        ...state.coop,
        pendingRewards: nextRewards,
        dailyFarmOrder: isFarmOrderReward
          ? { ...state.coop.dailyFarmOrder, rewardClaimed: true }
          : state.coop.dailyFarmOrder,
      },
    },
    ok: true,
    notice: `領取合作獎勵：+${target.coins} 金幣、+${target.furnitureShards} 家具碎片、+${target.intimacy} 親密度${unlockedTitleMsg}`,
  };
}

export function getOfflinePartnerEvents(
  coop: CoopHubState,
  currentUserId: string
): CoopOfflineEvent[] {
  const lastSeen = coop.lastSeenByUserId[currentUserId] ?? 0;
  return coop.offlineEvents.filter(
    (ev) => ev.actorUserId !== currentUserId && ev.createdAt > lastSeen
  );
}

export function acknowledgeOfflinePartnerEvents(
  state: GameState,
  currentUserId: string
): GameState {
  return {
    ...state,
    coop: {
      ...state.coop,
      lastSeenByUserId: {
        ...state.coop.lastSeenByUserId,
        [currentUserId]: Date.now(),
      },
    },
  };
}

export function getRecipeForOutputFood(foodId: string): KitchenRecipe | undefined {
  return KITCHEN_RECIPES.find((r) => r.outputFoodId === foodId);
}

/**
 * Conflict-safe remote merge for Supabase Realtime updates:
 * - Prevents duplicate cell occupancy in house.roomLayout.placedItems
 * - Preserves each user's local reward claim tracking & avoids losing concurrent queue items
 */
export function mergeCoopRemoteState(
  localState: GameState,
  remoteState: GameState
): GameState {
  const occupiedCells = new Set<string>();
  const mergedPlaced: PlacedRoomItem[] = [];

  for (const item of remoteState.house.roomLayout.placedItems) {
    const key = `${item.x}_${item.y}`;
    if (!occupiedCells.has(key)) {
      occupiedCells.add(key);
      mergedPlaced.push(item);
    }
  }

  for (const localItem of localState.house.roomLayout.placedItems) {
    const key = `${localItem.x}_${localItem.y}`;
    if (
      localItem.instanceId.startsWith('coop_rm_') &&
      !occupiedCells.has(key) &&
      !mergedPlaced.some((m) => m.instanceId === localItem.instanceId)
    ) {
      occupiedCells.add(key);
      mergedPlaced.push(localItem);
    }
  }

  const rewardMap = new Map<string, CoopReward>();
  for (const r of remoteState.coop.pendingRewards) {
    rewardMap.set(r.id, r);
  }
  for (const lr of localState.coop.pendingRewards) {
    const existing = rewardMap.get(lr.id);
    if (existing) {
      rewardMap.set(lr.id, {
        ...existing,
        claimedByUserIds: Array.from(
          new Set([...existing.claimedByUserIds, ...lr.claimedByUserIds])
        ),
      });
    }
  }

  return {
    ...remoteState,
    house: {
      ...remoteState.house,
      roomLayout: {
        ...remoteState.house.roomLayout,
        placedItems: mergedPlaced,
      },
    },
    coop: {
      ...remoteState.coop,
      pendingRewards: Array.from(rewardMap.values()).sort(
        (a, b) => b.createdAt - a.createdAt
      ),
      lastSeenByUserId: {
        ...localState.coop.lastSeenByUserId,
        ...remoteState.coop.lastSeenByUserId,
      },
    },
    dialogue: mergeDialogueRemoteState(localState.dialogue, remoteState.dialogue),
  };
}
