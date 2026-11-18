import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightLeft,
  BookOpen,
  Camera,
  Check,
  Coins,
  Hammer,
  HeartHandshake,
  Home,
  MessageCircleHeart,
  Move,
  Package,
  Pencil,
  PiggyBank,
  Send,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Trophy,
  X,
} from 'lucide-react';
import {
  FLOORING_BY_ID,
  FLOORINGS,
  FURNITURE_CATEGORY_LABELS,
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEMS,
  ROOM_ITEM_BY_ID,
  ROOM_PHOTO_POSES,
  ROOM_ZONES,
  SHARED_GOALS,
  SHARED_GOAL_BY_ID,
  SHARED_MILESTONES,
  THEME_SETS,
  WALLPAPER_BY_ID,
  WALLPAPERS,
  getZoneForCell,
} from '../../data/house';
import { INGREDIENTS } from '../../data/kitchen';
import {
  FlooringId,
  GameState,
  IngredientId,
  PetExpression,
  PiggyActionState,
  PlacedRoomItem,
  RoomPhotoPoseId,
  RoomPhotoRecord,
  RoomZone,
  SharedGoalId,
  SharedMilestoneId,
  SharedPetRoom,
  ThemeSetId,
  WallpaperId,
} from '../../types';
import {
  HouseActionOutcome,
  PaymentSource,
  addFurnitureNote,
  buyFurnitureItem,
  buyOrApplyFlooring,
  buyOrApplyWallpaper,
  buyThemeSetBundle,
  claimSharedMilestoneReward,
  completeActiveSharedGoal,
  craftFurnitureItem,
  depositToSharedTreasury,
  getHouseEncyclopediaCounts,
  getStowedCountByItem,
  moveFurnitureItem,
  placeFurnitureItem,
  saveRoomSnapshotPhoto,
  selectActiveSharedGoal,
  sellFurnitureItem,
  stowFurnitureItem,
  updateHouseName,
} from '../../utils/house';
import { evaluateItemPreference } from '../../utils/personality';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';
import { FurnitureGraphic } from './FurnitureGraphic';
import { RoomPhotoCard } from './RoomPhotoCard';

export type HouseModalTab = 'room' | 'shop' | 'coop' | 'photo';

type ShopFilter =
  | 'all'
  | 'toy'
  | RoomZone
  | 'surfaces'
  | 'themes'
  | 'craft';

interface HouseHubModalProps {
  open: boolean;
  initialTab?: HouseModalTab;
  onClose: () => void;
  game: GameState;
  sharedRoom: SharedPetRoom | null;
  actorName: string;
  onUpdateGame: (updater: (prev: GameState) => GameState) => void;
  onOpenSharedPet: () => void;
  onOpenCoopGames?: () => void;
  onOpenHouseEncyclopedia: () => void;
  onSharePhotoToBoard: (photo: RoomPhotoRecord, caption: string) => Promise<string | null>;
}

const QUICK_NOTE_PRESETS = [
  '這張床是你喜歡的粉紅色！',
  '這個角落佈置起來好溫馨～',
  '下次一起存錢買雲朵大床吧！',
];

export const HouseHubModal: React.FC<HouseHubModalProps> = ({
  open,
  initialTab = 'room',
  onClose,
  game,
  sharedRoom,
  actorName,
  onUpdateGame,
  onOpenSharedPet,
  onOpenCoopGames,
  onOpenHouseEncyclopedia,
  onSharePhotoToBoard,
}) => {
  const [tab, setTab] = useState<HouseModalTab>(initialTab);
  const [shopFilter, setShopFilter] = useState<ShopFilter>('all');
  const [paySource, setPaySource] = useState<PaymentSource>('personal');
  const [notice, setNotice] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Room editing states (one-hand friendly tap workflow)
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [placingItemId, setPlacingItemId] = useState<string | null>(null);
  const [movingInstanceId, setMovingInstanceId] = useState<string | null>(null);
  const [quickPlaceCell, setQuickPlaceCell] = useState<{ x: number; y: number } | null>(null);

  // Live pet interaction in the room
  const [petCell, setPetCell] = useState<{ x: number; y: number }>({ x: 2, y: 1 });
  const [petAction, setPetAction] = useState<PiggyActionState>('idle');
  const [petExpression, setPetExpression] = useState<PetExpression>('normal');
  const [petSpeech, setPetSpeech] = useState<string>('新房間好寬敞！放些家具讓我去玩吧～');

  // House name editor
  const [editingHouseName, setEditingHouseName] = useState<boolean>(false);
  const [houseNameInput, setHouseNameInput] = useState<string>(game.house.houseName);

  // Furniture note input
  const [noteInput, setNoteInput] = useState<string>('');

  // Treasury deposit input
  const [customDepositInput, setCustomDepositInput] = useState<string>('100');

  // Photo mode states
  const [selectedPoseId, setSelectedPoseId] = useState<RoomPhotoPoseId>('normal');
  const [photoTitle, setPhotoTitle] = useState<string>(`${game.house.houseName}的幸福時刻`);
  const [photoCaption, setPhotoCaption] = useState<string>(
    `跟 ${game.pet.name} 一起在親手佈置的小房間拍照留念！`
  );
  const [sharingPhoto, setSharingPhoto] = useState<boolean>(false);

  const house = game.house;
  const wallDef = WALLPAPER_BY_ID[house.roomLayout.wallpaperId] ?? WALLPAPER_BY_ID.cream_warm;
  const floorDef = FLOORING_BY_ID[house.roomLayout.flooringId] ?? FLOORING_BY_ID.oak_wood;
  const encCounts = getHouseEncyclopediaCounts(house);

  useEffect(() => {
    if (!open) return;
    setTab(initialTab);
    setNotice('');
    setErrorMsg('');
  }, [open, initialTab]);

  useEffect(() => {
    setHouseNameInput(game.house.houseName);
  }, [game.house.houseName]);

  // Automatic cozy pet wandering toward favorite placed items (bed, toyBall, snackRack, diningTable)
  useEffect(() => {
    if (!open || tab !== 'room') return;

    const triggerRandomVisit = () => {
      const placed = house.roomLayout.placedItems;
      if (placed.length === 0) {
        setPetCell({ x: 2, y: 1 });
        setPetAction('idle');
        setPetExpression('normal');
        setPetSpeech('房間空空的～快從下方買家具或放進格子裡吧！');
        return;
      }

      const priority = placed.filter((p) => {
        const def = ROOM_ITEM_BY_ID[p.itemId];
        return (
          def &&
          (def.category === 'bed' ||
            def.category === 'toy' ||
            def.category === 'toyBall' ||
            def.category === 'snackRack' ||
            def.category === 'diningTable' ||
            evaluateItemPreference(game.pet.species, def.id) === 'favorite')
        );
      });
      const favPool = priority.filter(
        (p) => evaluateItemPreference(game.pet.species, p.itemId) === 'favorite'
      );
      const basePool =
        favPool.length > 0 && Math.random() < 0.72
          ? favPool
          : priority.length > 0
          ? priority
          : placed;
      const chosen = basePool[Math.floor(Math.random() * basePool.length)];
      const itemDef = ROOM_ITEM_BY_ID[chosen.itemId];
      if (!itemDef) return;

      const match = evaluateItemPreference(game.pet.species, itemDef.id);
      setPetCell({ x: chosen.x, y: chosen.y });
      setPetAction(itemDef.petAction);
      setPetExpression(
        match === 'favorite'
          ? 'sparkle'
          : itemDef.petAction === 'sleeping'
          ? 'shy'
          : 'sparkle'
      );
      setPetSpeech(
        match === 'favorite'
          ? `✨ 最愛這個！${itemDef.petReactionText}`
          : itemDef.petReactionText
      );
    };

    triggerRandomVisit();
    const timer = window.setInterval(triggerRandomVisit, 6500);
    return () => window.clearInterval(timer);
  }, [open, tab, house.roomLayout.placedItems, game.pet.species]);

  const placedCellMap = useMemo(() => {
    const map = new Map<string, PlacedRoomItem>();
    for (const p of house.roomLayout.placedItems) {
      map.set(`${p.x}_${p.y}`, p);
    }
    return map;
  }, [house.roomLayout.placedItems]);

  const stowedItems = useMemo(() => {
    return ROOM_ITEMS.filter((item) => getStowedCountByItem(house, item.id) > 0);
  }, [house]);

  const selectedPlaced = useMemo(
    () => house.roomLayout.placedItems.find((p) => p.instanceId === selectedInstanceId) ?? null,
    [house.roomLayout.placedItems, selectedInstanceId]
  );

  const selectedItemDef = selectedPlaced ? ROOM_ITEM_BY_ID[selectedPlaced.itemId] ?? null : null;

  if (!open) return null;

  const showNotice = (msg?: string) => {
    setErrorMsg('');
    if (msg) setNotice(msg);
  };

  const showError = (msg?: string) => {
    if (msg) setErrorMsg(msg);
  };

  const runHouseAction = (fn: (state: GameState) => HouseActionOutcome): boolean => {
    const res = fn(game);
    if (!res.ok) {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
      return false;
    }
    onUpdateGame(() => res.nextState);
    soundFX.pop(game.soundEnabled);
    triggerHaptic(12);
    showNotice(res.notice);
    return true;
  };

  const handlePlaceAt = (itemId: string, x: number, y: number) => {
    const res = placeFurnitureItem(game, itemId, x, y, actorName);
    setPlacingItemId(null);
    setQuickPlaceCell(null);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      const def = ROOM_ITEM_BY_ID[itemId];
      if (def) {
        setPetCell({ x, y });
        setPetAction(def.petAction);
        setPetExpression(def.petAction === 'sleeping' ? 'shy' : 'sparkle');
        setPetSpeech(def.petReactionText);
      }
      soundFX.heart(game.soundEnabled);
      triggerHaptic(14);
      showNotice(res.notice);
    } else {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
    }
  };

  const handleMoveTo = (instanceId: string, x: number, y: number) => {
    const res = moveFurnitureItem(game, instanceId, x, y);
    setMovingInstanceId(null);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      setPetCell({ x, y });
      soundFX.pop(game.soundEnabled);
      triggerHaptic(12);
      showNotice(res.notice);
    } else {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
    }
  };

  const handleStow = (instanceId: string) => {
    const res = stowFurnitureItem(game, instanceId);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      setSelectedInstanceId(null);
      setMovingInstanceId(null);
      soundFX.pop(game.soundEnabled);
      showNotice(res.notice);
    } else {
      showError(res.error);
    }
  };

  const handleSell = (itemId: string) => {
    const res = sellFurnitureItem(game, itemId);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      setSelectedInstanceId(null);
      soundFX.pop(game.soundEnabled);
      showNotice(res.notice);
    } else {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
    }
  };

  const handleBuyFurniture = (itemId: string) => {
    runHouseAction((state) => buyFurnitureItem(state, itemId, paySource));
  };

  const handleCraftFurniture = (itemId: string) => {
    runHouseAction((state) => craftFurnitureItem(state, itemId));
  };

  const handleWallpaperAction = (wallId: WallpaperId) => {
    runHouseAction((state) => buyOrApplyWallpaper(state, wallId, paySource));
  };

  const handleFlooringAction = (floorId: FlooringId) => {
    runHouseAction((state) => buyOrApplyFlooring(state, floorId, paySource));
  };

  const handleBuyTheme = (themeId: ThemeSetId) => {
    runHouseAction((state) => buyThemeSetBundle(state, themeId, paySource));
  };

  const handleAddFurnitureNote = (textToSave: string) => {
    if (!selectedPlaced) return;
    const res = addFurnitureNote(game, selectedPlaced.itemId, actorName, textToSave);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      setNoteInput('');
      soundFX.heart(game.soundEnabled);
      showNotice(res.notice);
    } else {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
    }
  };

  const handleSaveHouseName = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateHouseName(game, houseNameInput);
    if (res.ok) {
      onUpdateGame(() => res.nextState);
      setEditingHouseName(false);
      soundFX.pop(game.soundEnabled);
      showNotice(res.notice);
    } else {
      soundFX.miss(game.soundEnabled);
      showError(res.error);
    }
  };

  const handleDepositTreasury = (amount: number) => {
    runHouseAction((state) => depositToSharedTreasury(state, amount, actorName));
  };

  const handleCompleteGoal = () => {
    runHouseAction((state) => completeActiveSharedGoal(state));
  };

  const handleSelectGoal = (goalId: SharedGoalId) => {
    onUpdateGame((prev) => selectActiveSharedGoal(prev, goalId));
    soundFX.pop(game.soundEnabled);
  };

  const handleClaimMilestone = (milestoneId: SharedMilestoneId) => {
    runHouseAction((state) => claimSharedMilestoneReward(state, milestoneId));
  };

  const handleCellClick = (x: number, y: number) => {
    const occupant = placedCellMap.get(`${x}_${y}`) ?? null;

    if (movingInstanceId) {
      if (occupant && occupant.instanceId === movingInstanceId) {
        setMovingInstanceId(null);
        return;
      }
      if (occupant) {
        soundFX.miss(game.soundEnabled);
        showError('這一格已經擺放家具，請點擊空格移動！');
        return;
      }
      handleMoveTo(movingInstanceId, x, y);
      return;
    }

    if (placingItemId) {
      if (occupant) {
        soundFX.miss(game.soundEnabled);
        showError('每格只能放置一個家具，請點空白格子擺放！');
        return;
      }
      handlePlaceAt(placingItemId, x, y);
      return;
    }

    if (occupant) {
      setQuickPlaceCell(null);
      setSelectedInstanceId(occupant.instanceId);
      const def = ROOM_ITEM_BY_ID[occupant.itemId];
      if (def) {
        setPetCell({ x, y });
        setPetAction(def.petAction);
        setPetExpression(def.petAction === 'sleeping' ? 'shy' : 'sparkle');
        setPetSpeech(def.petReactionText);
      }
      soundFX.pop(game.soundEnabled);
      return;
    }

    setSelectedInstanceId(null);
    setQuickPlaceCell({ x, y });
    soundFX.pop(game.soundEnabled);
  };

  const handleSavePhoto = (alsoShare: boolean) => {
    const saved = saveRoomSnapshotPhoto(game, {
      title: photoTitle,
      caption: photoCaption,
      poseId: selectedPoseId,
    });
    onUpdateGame(() => saved.nextState);

    soundFX.levelUp(game.soundEnabled);
    triggerHaptic(18);

    if (alsoShare) {
      setSharingPhoto(true);
      void onSharePhotoToBoard(saved.photo, photoCaption).then((err) => {
        setSharingPhoto(false);
        if (err) {
          showError(err);
        } else {
          showNotice('已拍照並分享到留言板與成長手帳相簿！');
        }
      });
    } else {
      showNotice('已拍下小屋合照並儲存到成長手帳相簿！');
    }
  };

  const activeGoal = SHARED_GOAL_BY_ID[house.activeGoalId] ?? SHARED_GOALS[0];
  const goalPct = Math.min(100, Math.round((house.treasuryCoins / activeGoal.targetCoins) * 100));
  const isGoalDone = house.completedGoalIds.includes(activeGoal.id);

  const claimableMilestoneCount = house.achievedMilestones.filter(
    (id) => !house.claimedMilestones.includes(id)
  ).length;

  const filteredShopItems = ROOM_ITEMS.filter((item) => {
    if (shopFilter === 'all') return true;
    if (shopFilter === 'toy') return item.category === 'toy' || item.category === 'toyBall';
    if (shopFilter === 'craft') return Boolean(item.craftIngredients);
    if (shopFilter === 'sleep' || shopFilter === 'play' || shopFilter === 'dining' || shopFilter === 'decor') {
      return item.zone === shopFilter;
    }
    return false;
  });

  const previewPhotoRecord: RoomPhotoRecord = {
    id: 'preview',
    title: photoTitle || `${house.houseName}的幸福時刻`,
    caption: photoCaption,
    createdAt: Date.now(),
    houseName: house.houseName,
    species: game.pet.species,
    petName: game.pet.name,
    equipped: game.pet.accessories,
    poseId: selectedPoseId,
    wallpaperId: house.roomLayout.wallpaperId,
    flooringId: house.roomLayout.flooringId,
    placedItems: house.roomLayout.placedItems,
    noteHighlight: house.furnitureNotes[0]?.content,
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B2621]/55 backdrop-blur-xs flex items-center justify-center p-2 overflow-x-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="house-hub-title"
    >
      <div className="w-full max-w-[420px] max-h-[94dvh] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-[#FFEAF0] via-[#FFF6DA] to-[#E8F8F2] border-b border-[#F2DFD5] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4 text-[#D64470] shrink-0" />
              <h2 id="house-hub-title" className="text-base font-extrabold text-[#4A3531] truncate">
                {house.houseName}
              </h2>
            </div>
            <p className="text-[11px] font-bold text-[#7D635D] tabular-nums">
              個人 {game.coins} 幣 · 金庫 {house.treasuryCoins} 幣 · 碎片 {game.furnitureShards}
              {sharedRoom ? ' · 兩人同步' : ''}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHouseEncyclopedia();
              }}
              aria-label="開啟佈置圖鑑"
              className="min-h-[44px] px-2.5 rounded-2xl bg-white/90 border border-[#EED9D0] text-[11px] font-extrabold text-[#256D57] inline-flex items-center gap-1 hover:bg-white transition"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>圖鑑 {encCounts.totalCollected}/{encCounts.totalItems}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="關閉佈置小屋"
              className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/85 text-[#5A3E36] flex items-center justify-center hover:bg-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* 4 Navigation Tabs */}
        <nav className="px-3 pt-2.5 pb-1.5 bg-[#FFFDF8] border-b border-[#F4EAE4] grid grid-cols-4 gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setTab('room')}
            className={`min-h-[44px] rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'room'
                ? 'bg-[#FF7A9E] text-white shadow-xs'
                : 'bg-[#F7ECE6] text-[#6E544E] hover:bg-[#EFE1D9]'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>寵物房</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('shop')}
            className={`min-h-[44px] rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'shop'
                ? 'bg-[#FF7A9E] text-white shadow-xs'
                : 'bg-[#F7ECE6] text-[#6E544E] hover:bg-[#EFE1D9]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>家具店</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('coop')}
            className={`relative min-h-[44px] rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'coop'
                ? 'bg-[#5CC9A7] text-white shadow-xs'
                : 'bg-[#F7ECE6] text-[#6E544E] hover:bg-[#EFE1D9]'
            }`}
          >
            <PiggyBank className="w-4 h-4" />
            <span>共養金庫</span>
            {claimableMilestoneCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D64470] text-white text-[10px] flex items-center justify-center tabular-nums">
                {claimableMilestoneCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('photo')}
            className={`min-h-[44px] rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 transition ${
              tab === 'photo'
                ? 'bg-[#F8C956] text-[#4A3531] shadow-xs'
                : 'bg-[#F7ECE6] text-[#6E544E] hover:bg-[#EFE1D9]'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>拍照</span>
          </button>
        </nav>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3.5">
          {errorMsg && (
            <div className="rounded-2xl bg-[#FFE9EF] border border-[#F5B4C6] px-3 py-2 text-xs font-extrabold text-[#B83B64] flex items-center justify-between gap-2">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg('')}
                className="text-xs font-extrabold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {notice && (
            <div className="rounded-2xl bg-[#E5F8F0] border border-[#AEE3D0] px-3 py-2 text-xs font-extrabold text-[#1F6B54] flex items-center justify-between gap-2">
              <span>✨ {notice}</span>
              <button
                type="button"
                onClick={() => setNotice('')}
                className="text-xs font-extrabold px-1.5"
              >
                ✕
              </button>
            </div>
          )}

          {/* TAB 1: INTERACTIVE 6x4 PET ROOM */}
          {tab === 'room' && (
            <>
              {/* Editable House Signboard */}
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#FFF6E9] border border-[#F1DAC2] px-3 py-2">
                {!editingHouseName ? (
                  <>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[#957B74]">小屋門牌名稱</p>
                      <p className="text-xs font-extrabold text-[#4A3531] truncate">
                        🪧 {house.houseName}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setHouseNameInput(house.houseName);
                        setEditingHouseName(true);
                      }}
                      className="min-h-[38px] px-3 rounded-xl bg-white border border-[#E9D1BA] text-xs font-extrabold text-[#7A540E] inline-flex items-center gap-1 shrink-0"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>改名</span>
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleSaveHouseName} className="w-full flex items-center gap-1.5">
                    <input
                      type="text"
                      maxLength={14}
                      value={houseNameInput}
                      onChange={(e) => setHouseNameInput(e.target.value)}
                      placeholder="輸入你們的小屋名稱"
                      className="flex-1 min-w-0 min-h-[40px] rounded-xl bg-white border border-[#E5C9B0] px-2.5 text-sm font-bold text-[#4A3531] focus:outline-none focus:border-[#FF7A9E]"
                    />
                    <button
                      type="submit"
                      className="min-h-[40px] px-3 rounded-xl bg-[#5CC9A7] text-white text-xs font-extrabold shrink-0"
                    >
                      儲存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingHouseName(false)}
                      className="min-h-[40px] px-2.5 rounded-xl bg-[#F2E5DE] text-[#6E544E] text-xs font-extrabold shrink-0"
                    >
                      取消
                    </button>
                  </form>
                )}
              </div>

              {/* Active Placement / Move Guidance Banner */}
              {(placingItemId || movingInstanceId) && (
                <div className="rounded-2xl bg-[#FFF0F5] border-2 border-[#FF8AA8] px-3 py-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#B83B64]">
                    {placingItemId
                      ? `請點選下方任一空白格子擺放「${ROOM_ITEM_BY_ID[placingItemId]?.name ?? '家具'}」`
                      : '移動模式：請點選任一空白格子搬移過去'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPlacingItemId(null);
                      setMovingInstanceId(null);
                    }}
                    className="min-h-[36px] px-2.5 rounded-xl bg-white border border-[#F3B8CA] text-xs font-extrabold text-[#B83B64] shrink-0"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* Interactive Room Stage (Wallpaper + 6x4 Quadrant Floor + Live Pet) */}
              <section className="rounded-3xl border-2 border-[#EED8CE] overflow-hidden shadow-xs">
                {/* Wallpaper Header + Pet Reaction Bubble */}
                <div
                  className="px-3 pt-2.5 pb-2 border-b border-[#EAD2C5] flex items-center justify-between gap-2"
                  style={{ background: wallDef.wallBgStyle }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-extrabold text-[#7D635D]">
                      壁紙：{wallDef.name} · 地板：{floorDef.name}
                    </div>
                    <div className="mt-1 rounded-xl bg-white/92 border border-[#F1D5DF] px-2.5 py-1 text-[11px] font-extrabold text-[#4A3531] leading-snug">
                      💬 {petSpeech}
                    </div>
                  </div>
                </div>

                {/* Four Quadrant Zone Labels */}
                <div className="grid grid-cols-2 text-[10px] font-extrabold bg-[#FFF8F2] border-b border-[#EFE0D7]">
                  <div className="px-2.5 py-1 border-r border-[#EFE0D7] text-[#5C459E] flex items-center justify-between">
                    <span>🌙 睡眠區 (左半上)</span>
                    <span>🎀 裝飾區 (右半上)</span>
                  </div>
                  <div className="px-2.5 py-1 text-[#1F6B54] flex items-center justify-between">
                    <span>⚽ 遊玩區 (左半下)</span>
                    <span>🍽️ 用餐區 (右半下)</span>
                  </div>
                </div>

                {/* 6x4 Interactive Furniture Grid */}
                <div
                  className="relative p-2"
                  style={{ background: floorDef.floorBgStyle }}
                >
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: ROOM_GRID_ROWS * ROOM_GRID_COLS }, (_, idx) => {
                      const x = idx % ROOM_GRID_COLS;
                      const y = Math.floor(idx / ROOM_GRID_COLS);
                      const zone = getZoneForCell(x, y);
                      const zoneMeta = ROOM_ZONES[zone];
                      const occupant = placedCellMap.get(`${x}_${y}`) ?? null;
                      const itemDef = occupant ? ROOM_ITEM_BY_ID[occupant.itemId] : null;
                      const isSelected = occupant && selectedInstanceId === occupant.instanceId;
                      const isMovingThis = occupant && movingInstanceId === occupant.instanceId;
                      const hasPetHere = petCell.x === x && petCell.y === y;
                      const noteCount = occupant
                        ? house.furnitureNotes.filter((n) => n.itemId === occupant.itemId).length
                        : 0;

                      const placingItemDef = placingItemId ? ROOM_ITEM_BY_ID[placingItemId] : null;
                      const isTargetZoneHint = placingItemDef ? placingItemDef.zone === zone : false;

                      return (
                        <button
                          key={`${x}_${y}`}
                          type="button"
                          onClick={() => handleCellClick(x, y)}
                          aria-label={
                            itemDef
                              ? `${zoneMeta.name} 已擺放 ${itemDef.name}`
                              : `${zoneMeta.name} 空格 (${x + 1},${y + 1})`
                          }
                          className={`relative min-h-[50px] rounded-xl border flex flex-col items-center justify-center transition active:scale-95 ${
                            isSelected || isMovingThis
                              ? 'bg-[#FFEAF0] border-2 border-[#FF5C8A] ring-2 ring-[#FF8AA8]/40'
                              : occupant
                              ? 'bg-white/80 border-[#E7CFC4] hover:bg-white'
                              : isTargetZoneHint
                              ? 'bg-[#E9FAF2]/80 border-2 border-dashed border-[#49B895] hover:bg-[#D7F4E8]'
                              : placingItemId || movingInstanceId
                              ? 'bg-white/60 border-dashed border-[#FF7A9E] hover:bg-[#FFF0F4]'
                              : `${zoneMeta.cellTintClass} border-white/60 hover:bg-white/75`
                          }`}
                        >
                          {occupant && itemDef ? (
                            <>
                              <FurnitureGraphic itemId={itemDef.id} size={34} />
                              {noteCount > 0 && (
                                <span
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF7A9E] text-white text-[9px] font-extrabold flex items-center justify-center"
                                  title="有家具留言"
                                >
                                  💌
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] font-bold text-[#9E8882]/75">
                              {placingItemId || movingInstanceId ? '＋' : zoneMeta.emoji}
                            </span>
                          )}

                          {hasPetHere && (
                            <div className="pointer-events-none absolute -top-3 z-10 drop-shadow-sm">
                              <PiggyCharacter
                                species={game.pet.species}
                                growth={game.pet.growth}
                                roundness={game.pet.roundness}
                                action={petAction}
                                expression={petExpression}
                                equipped={game.pet.accessories}
                                interactive={false}
                                size={42}
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Selected Placed Furniture Inspector + Notes */}
              {selectedPlaced && selectedItemDef && (
                <section className="rounded-3xl bg-[#FFF6FA] border-2 border-[#F5C6D6] p-3.5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#F2D5DF] flex items-center justify-center shrink-0">
                        <FurnitureGraphic itemId={selectedItemDef.id} size={40} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-[#4A3531] truncate">
                          {selectedItemDef.name}
                        </h3>
                        <p className="text-[11px] font-bold text-[#826862]">
                          {ROOM_ZONES[selectedPlaced.zone].name} ·{' '}
                          {FURNITURE_CATEGORY_LABELS[selectedItemDef.category]}
                          {selectedPlaced.placedBy ? ` · 由 ${selectedPlaced.placedBy} 擺放` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedInstanceId(null)}
                      aria-label="取消選取家具"
                      className="min-h-[36px] min-w-[36px] rounded-xl bg-white text-[#6E544E] flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Furniture Actions */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMovingInstanceId(selectedPlaced.instanceId);
                        setPlacingItemId(null);
                      }}
                      className="min-h-[44px] rounded-xl bg-white border border-[#E7CFD7] text-xs font-extrabold text-[#5A3E36] inline-flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>移動</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleStow(selectedPlaced.instanceId)}
                      className="min-h-[44px] rounded-xl bg-[#EEF8F4] border border-[#B2E3CF] text-xs font-extrabold text-[#256D57] inline-flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Package className="w-3.5 h-3.5" />
                      <span>收起</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleSell(selectedItemDef.id)}
                      className="min-h-[44px] rounded-xl bg-[#FFF3D8] border border-[#F2CE6D] text-xs font-extrabold text-[#8A5610] inline-flex items-center justify-center gap-1 active:scale-95 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>售 +{selectedItemDef.sellPrice}</span>
                    </button>
                  </div>

                  {/* Furniture Notes for Co-op Partners */}
                  <div className="rounded-2xl bg-white border border-[#F3DCE4] p-3 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#B83B64]">
                      <MessageCircleHeart className="w-4 h-4" />
                      <span>家具悄悄話筆記</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_NOTE_PRESETS.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => void handleAddFurnitureNote(preset)}
                          className="min-h-[32px] px-2.5 rounded-xl bg-[#FFF4F8] border border-[#F6CEDB] text-[10px] font-extrabold text-[#B83B64] hover:bg-[#FFE8F0] transition"
                        >
                          ＋「{preset}」
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        maxLength={80}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="在這件家具寫一句話給夥伴…"
                        className="flex-1 min-w-0 min-h-[44px] rounded-xl bg-[#FFFDF8] border border-[#EAD4DC] px-2.5 text-sm font-medium text-[#4A3531] placeholder:text-xs placeholder:text-[#B5A19B] focus:outline-none focus:border-[#FF7A9E]"
                      />
                      <button
                        type="button"
                        onClick={() => void handleAddFurnitureNote(noteInput)}
                        className="min-h-[44px] px-3 rounded-xl bg-[#FF7A9E] text-white text-xs font-extrabold inline-flex items-center gap-1 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>貼上</span>
                      </button>
                    </div>

                    {house.furnitureNotes.filter((n) => n.itemId === selectedItemDef.id).length > 0 && (
                      <div className="space-y-1.5 pt-1 max-h-28 overflow-y-auto">
                        {house.furnitureNotes
                          .filter((n) => n.itemId === selectedItemDef.id)
                          .map((note) => (
                            <div
                              key={note.id}
                              className="rounded-xl bg-[#FFF8F4] border border-[#F3E1DA] px-2.5 py-1.5 text-[11px]"
                            >
                              <span className="font-extrabold text-[#B83B64]">{note.authorName}：</span>
                              <span className="text-[#4A3531] font-medium">{note.content}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Quick Place Sheet when user tapped an empty cell */}
              {quickPlaceCell && (
                <section className="rounded-3xl bg-[#F4FBF8] border-2 border-[#BCE6D5] p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#1F6B54]">
                      選擇要放進 ({quickPlaceCell.x + 1},{quickPlaceCell.y + 1}) 的已擁有家具
                    </h3>
                    <button
                      type="button"
                      onClick={() => setQuickPlaceCell(null)}
                      className="text-xs font-extrabold text-[#6E544E]"
                    >
                      關閉
                    </button>
                  </div>

                  {stowedItems.length === 0 ? (
                    <div className="text-center py-2 space-y-2">
                      <p className="text-xs text-[#6E544E]">
                        收納袋裡目前沒有尚未擺放的家具喔！
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setQuickPlaceCell(null);
                          setTab('shop');
                        }}
                        className="min-h-[44px] px-4 rounded-xl bg-[#FF7A9E] text-white text-xs font-extrabold"
                      >
                        前往家具店挑選
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {stowedItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            void handlePlaceAt(item.id, quickPlaceCell.x, quickPlaceCell.y)
                          }
                          className="min-h-[72px] rounded-2xl bg-white border border-[#CFECE0] p-2 flex flex-col items-center justify-center gap-1 hover:border-[#5CC9A7] active:scale-95 transition"
                        >
                          <FurnitureGraphic itemId={item.id} size={32} />
                          <span className="text-[11px] font-extrabold text-[#4A3531] truncate w-full text-center">
                            {item.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Stowed Inventory Bar */}
              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE2DC] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-[#4A3531]">
                    收納袋家具（點擊後點房間空格擺放）
                  </h3>
                  <button
                    type="button"
                    onClick={() => setTab('shop')}
                    className="text-[11px] font-extrabold text-[#D64470]"
                  >
                    去逛家具店 ›
                  </button>
                </div>

                {stowedItems.length === 0 ? (
                  <p className="text-xs text-[#826862]">
                    目前沒有多餘收起的家具，可到「家具店」選購或點擊房間家具收起調整位置！
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {stowedItems.map((item) => {
                      const stowedCount = getStowedCountByItem(house, item.id);
                      const isPlacing = placingItemId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMovingInstanceId(null);
                            setSelectedInstanceId(null);
                            setPlacingItemId(isPlacing ? null : item.id);
                          }}
                          className={`min-h-[72px] rounded-2xl p-2 border-2 flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                            isPlacing
                              ? 'bg-[#FFEAF0] border-[#FF7A9E]'
                              : 'bg-[#FFF9F2] border-[#EFE0D7]'
                          }`}
                        >
                          <FurnitureGraphic itemId={item.id} size={32} />
                          <span className="text-[11px] font-extrabold text-[#4A3531] truncate w-full text-center">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-bold text-[#826862] tabular-nums">
                            {isPlacing ? '點房間格子' : `可放 ${stowedCount}`}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Quick Switch Unlocked Wallpapers & Floorings */}
              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE2DC] p-3.5 space-y-2.5">
                <h3 className="text-xs font-extrabold text-[#4A3531]">已擁有壁紙與地板</h3>
                <div className="grid grid-cols-2 gap-2">
                  {WALLPAPERS.filter((w) => house.unlockedWallpapers.includes(w.id)).map((w) => {
                    const active = house.roomLayout.wallpaperId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => void handleWallpaperAction(w.id)}
                        className={`min-h-[44px] rounded-xl px-2.5 py-1.5 border text-left text-xs font-extrabold flex items-center justify-between gap-1 ${
                          active
                            ? 'bg-[#FFEAF0] border-[#FF7A9E] text-[#B83B64]'
                            : 'bg-[#FAF5F0] border-[#E8D8CE] text-[#5A423C]'
                        }`}
                      >
                        <span className="truncate">
                          {w.emoji} {w.name}
                        </span>
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                  {FLOORINGS.filter((f) => house.unlockedFloorings.includes(f.id)).map((f) => {
                    const active = house.roomLayout.flooringId === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => void handleFlooringAction(f.id)}
                        className={`min-h-[44px] rounded-xl px-2.5 py-1.5 border text-left text-xs font-extrabold flex items-center justify-between gap-1 ${
                          active
                            ? 'bg-[#E8F8F2] border-[#5CC9A7] text-[#1F6B54]'
                            : 'bg-[#FAF5F0] border-[#E8D8CE] text-[#5A423C]'
                        }`}
                      >
                        <span className="truncate">
                          {f.emoji} {f.name}
                        </span>
                        {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* TAB 2: FURNITURE SHOP, WALLS/FLOORS, THEMES & CROP CRAFTING */}
          {tab === 'shop' && (
            <>
              {/* Payment Source Toggle: Personal vs Shared Treasury */}
              <section className="rounded-2xl bg-[#FFF6EA] border border-[#F0D9C0] p-2.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-[#7D635D]">
                  <span>付款方式切換</span>
                  <span className="tabular-nums">
                    個人 {game.coins} 幣 · 金庫 {house.treasuryCoins} 幣
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setPaySource('personal')}
                    className={`min-h-[40px] rounded-lg text-xs font-extrabold transition ${
                      paySource === 'personal'
                        ? 'bg-white text-[#9D5B12] shadow-xs'
                        : 'text-[#6E544E]'
                    }`}
                  >
                    🪙 個人金幣 ({game.coins})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaySource('treasury')}
                    className={`min-h-[40px] rounded-lg text-xs font-extrabold transition ${
                      paySource === 'treasury'
                        ? 'bg-white text-[#256D57] shadow-xs'
                        : 'text-[#6E544E]'
                    }`}
                  >
                    💞 共同金庫 ({house.treasuryCoins})
                  </button>
                </div>
              </section>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: 'all', label: '全部家具' },
                    { key: 'toy', label: '🧸 玩具專區' },
                    { key: 'sleep', label: '🌙 睡眠區' },
                    { key: 'play', label: '⚽ 遊玩區' },
                    { key: 'dining', label: '🍽️ 用餐區' },
                    { key: 'decor', label: '🎀 裝飾區' },
                    { key: 'surfaces', label: '🎨 壁紙地板' },
                    { key: 'themes', label: '✨ 主題套裝' },
                    { key: 'craft', label: '🌾 作物手作' },
                  ] as { key: ShopFilter; label: string }[]
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setShopFilter(f.key)}
                    className={`min-h-[38px] px-3 rounded-xl text-xs font-extrabold border transition ${
                      shopFilter === f.key
                        ? 'bg-[#FF7A9E] text-white border-[#FF7A9E]'
                        : 'bg-[#FFF9F2] text-[#6E544E] border-[#EAD9D0]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Theme Bundles Section */}
              {shopFilter === 'themes' && (
                <div className="space-y-3">
                  {THEME_SETS.map((theme) => {
                    const completed = house.completedThemeSets.includes(theme.id);
                    const ownedPieceCount =
                      theme.itemIds.filter((id) => house.collectedFurnitureIds.includes(id)).length +
                      (house.unlockedWallpapers.includes(theme.wallpaperId) ? 1 : 0) +
                      (house.unlockedFloorings.includes(theme.flooringId) ? 1 : 0);
                    const totalPieces = theme.itemIds.length + 2;
                    const availableCoins =
                      paySource === 'treasury' ? house.treasuryCoins : game.coins;
                    const canBuy = completed || availableCoins >= theme.bundlePrice;

                    return (
                      <article
                        key={theme.id}
                        className={`rounded-3xl border-2 p-3.5 space-y-2.5 ${theme.accentCardClass}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-[#4A3531]">
                              {theme.emoji} {theme.name}主題套裝
                            </h3>
                            <p className="text-[11px] font-bold text-[#7D635D] mt-0.5">
                              {theme.description}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-[#D64470] tabular-nums shrink-0">
                            {ownedPieceCount}/{totalPieces} 件
                          </span>
                        </div>

                        <p className="text-[11px] font-extrabold text-[#9D5B12]">
                          完成套裝解鎖：專屬稱號 ＋ 特殊拍照姿勢 📸
                        </p>

                        <button
                          type="button"
                          disabled={!canBuy}
                          onClick={() => void handleBuyTheme(theme.id)}
                          className={`w-full min-h-[44px] rounded-2xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                            completed
                              ? 'bg-[#5CC9A7] text-white'
                              : canBuy
                              ? 'bg-[#FF7A9E] text-white shadow-[0_3px_0_#D9577B] active:translate-y-0.5'
                              : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>
                            {completed
                              ? '已收集完成 · 點擊一鍵套用壁紙與地板'
                              : `全套優惠打包購入 (${theme.bundlePrice} 金幣)`}
                          </span>
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Wallpapers & Floorings Section */}
              {shopFilter === 'surfaces' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-extrabold text-[#4A3531]">4 款牆面壁紙</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {WALLPAPERS.map((wall) => {
                      const owned = house.unlockedWallpapers.includes(wall.id);
                      const active = house.roomLayout.wallpaperId === wall.id;
                      const avail = paySource === 'treasury' ? house.treasuryCoins : game.coins;
                      const canAct = owned || avail >= wall.price;
                      return (
                        <article
                          key={wall.id}
                          className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3 space-y-2"
                        >
                          <div
                            className="h-12 rounded-2xl border border-[#EAD4CA] flex items-center justify-center text-xl"
                            style={{ background: wall.wallBgStyle }}
                          >
                            {wall.emoji}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-[#4A3531]">{wall.name}</h4>
                            <p className="text-[10px] text-[#7D635D] leading-snug mt-0.5">
                              {wall.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!canAct}
                            onClick={() => void handleWallpaperAction(wall.id)}
                            className={`w-full min-h-[40px] rounded-xl text-xs font-extrabold transition ${
                              active
                                ? 'bg-[#5CC9A7] text-white'
                                : owned
                                ? 'bg-[#FFEAF0] text-[#B83B64]'
                                : canAct
                                ? 'bg-[#FFF3D1] border border-[#F2CE6D] text-[#7A540E]'
                                : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                            }`}
                          >
                            {active ? '使用中' : owned ? '套用壁紙' : `購買 (${wall.price} 幣)`}
                          </button>
                        </article>
                      );
                    })}
                  </div>

                  <h3 className="text-xs font-extrabold text-[#4A3531] pt-1">4 款室內地板</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {FLOORINGS.map((floor) => {
                      const owned = house.unlockedFloorings.includes(floor.id);
                      const active = house.roomLayout.flooringId === floor.id;
                      const avail = paySource === 'treasury' ? house.treasuryCoins : game.coins;
                      const canAct = owned || avail >= floor.price;
                      return (
                        <article
                          key={floor.id}
                          className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3 space-y-2"
                        >
                          <div
                            className="h-12 rounded-2xl border border-[#EAD4CA] flex items-center justify-center text-xl"
                            style={{ background: floor.floorBgStyle }}
                          >
                            {floor.emoji}
                          </div>
                          <div>
                            <h4 className="text-xs font-extrabold text-[#4A3531]">{floor.name}</h4>
                            <p className="text-[10px] text-[#7D635D] leading-snug mt-0.5">
                              {floor.description}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={!canAct}
                            onClick={() => void handleFlooringAction(floor.id)}
                            className={`w-full min-h-[40px] rounded-xl text-xs font-extrabold transition ${
                              active
                                ? 'bg-[#5CC9A7] text-white'
                                : owned
                                ? 'bg-[#E8F8F2] text-[#1F6B54]'
                                : canAct
                                ? 'bg-[#FFF3D1] border border-[#F2CE6D] text-[#7A540E]'
                                : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                            }`}
                          >
                            {active ? '使用中' : owned ? '鋪設地板' : `購買 (${floor.price} 幣)`}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Furniture Catalog List */}
              {shopFilter !== 'themes' && shopFilter !== 'surfaces' && (
                <div className="space-y-2.5">
                  {filteredShopItems.map((item) => {
                    const ownedCount = house.ownedFurnitureCounts[item.id] ?? 0;
                    const stowedCount = getStowedCountByItem(house, item.id);
                    const availCoins =
                      paySource === 'treasury' ? house.treasuryCoins : game.coins;
                    const canBuy = availCoins >= item.price;

                    const craftEntries = item.craftIngredients
                      ? (Object.entries(item.craftIngredients) as [IngredientId, number][])
                      : [];
                    const canCraft =
                      craftEntries.length > 0 &&
                      craftEntries.every(([id, need]) => (game.ingredients[id] ?? 0) >= need);

                    return (
                      <article
                        key={item.id}
                        className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3 space-y-2.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-13 h-13 rounded-2xl bg-[#FFF7EC] border border-[#F1DAC5] flex items-center justify-center shrink-0">
                            <FurnitureGraphic itemId={item.id} size={42} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <h4 className="text-sm font-extrabold text-[#4A3531] truncate">
                                  {item.name}
                                </h4>
                                {evaluateItemPreference(game.pet.species, item.id) === 'favorite' && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-[#FFEAF2] border border-[#F5B4CA] text-[10px] font-extrabold text-[#D64470] shrink-0">
                                    ♥ 最愛
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-extrabold text-[#9D5B12] tabular-nums shrink-0">
                                {item.tier === 'advanced' ? '進階' : '普通'} · {item.price} 幣
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-[#826862]">
                              {ROOM_ZONES[item.zone].name} · {FURNITURE_CATEGORY_LABELS[item.category]}
                              {ownedCount > 0 ? ` · 已擁有 ${ownedCount} 件` : ''}
                            </p>
                            <p className="text-xs text-[#6E544E] mt-0.5 leading-snug">
                              {item.description}
                            </p>
                            {craftEntries.length > 0 && (
                              <p className="text-[11px] font-extrabold text-[#256D57] mt-1 tabular-nums">
                                作物手作材料：
                                {craftEntries
                                  .map(
                                    ([id, need]) =>
                                      `${INGREDIENTS[id].emoji}${INGREDIENTS[id].name} ${game.ingredients[id] ?? 0}/${need}`
                                  )
                                  .join(' · ')}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!canBuy}
                            onClick={() => void handleBuyFurniture(item.id)}
                            className={`flex-1 min-w-[120px] min-h-[44px] rounded-2xl px-3 text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
                              canBuy
                                ? 'bg-[#FFF3D1] border border-[#F2CE6D] text-[#7A540E] hover:bg-[#FFEAA8] active:scale-95'
                                : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                            }`}
                          >
                            <Coins className="w-3.5 h-3.5" />
                            <span>購買 ({item.price} 幣)</span>
                          </button>

                          {craftEntries.length > 0 && (
                            <button
                              type="button"
                              disabled={!canCraft}
                              onClick={() => void handleCraftFurniture(item.id)}
                              className={`min-h-[44px] px-3 rounded-2xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
                                canCraft
                                  ? 'bg-[#5CC9A7] text-white hover:bg-[#49B895] active:scale-95'
                                  : 'bg-[#E9F3EE] text-[#8EA99E] cursor-not-allowed'
                              }`}
                            >
                              <Hammer className="w-3.5 h-3.5" />
                              <span>作物手作</span>
                            </button>
                          )}

                          {stowedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setPlacingItemId(item.id);
                                setTab('room');
                              }}
                              className="min-h-[44px] px-3 rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold inline-flex items-center gap-1 active:scale-95 transition"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                              <span>去擺放</span>
                            </button>
                          )}

                          {ownedCount > 0 && (
                            <button
                              type="button"
                              onClick={() => void handleSell(item.id)}
                              className="min-h-[44px] px-3 rounded-2xl bg-[#FAF1ED] border border-[#E7D3CA] text-xs font-extrabold text-[#7D635D]"
                            >
                              出售 +{item.sellPrice}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 3: CO-OP TREASURY, SHARED GOALS & MILESTONES */}
          {tab === 'coop' && (
            <>
              {/* Shared Room Status Banner */}
              <section className="rounded-3xl bg-gradient-to-r from-[#FFEAF0] to-[#E8F8F2] border-2 border-[#F2D5DF] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#B83B64] flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 shrink-0" />
                      <span>{sharedRoom ? '兩人共養共同空間同步中' : '單人準備模式（隨時可邀夥伴）'}</span>
                    </div>
                    <p className="text-[11px] text-[#6E544E] mt-0.5">
                      {sharedRoom
                        ? '房間佈置、農場擴建與共同金庫會與夥伴即時同步！'
                        : '存入的共同金庫與佈置會在建立共養後完整延續給兩人。'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenSharedPet}
                    className="min-h-[44px] px-3 rounded-2xl bg-white border border-[#F2C3D2] text-xs font-extrabold text-[#B83B64] shrink-0"
                  >
                    {sharedRoom ? '共養管理' : '建立 / 加入'}
                  </button>
                </div>

                {sharedRoom && onOpenCoopGames && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenCoopGames();
                    }}
                    className="w-full min-h-[44px] rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold shadow-[0_2px_0_#D9577B] active:scale-[0.99] transition"
                  >
                    🎮 開啟共養「合作遊戲」（90 秒一起布置 / 農場接力）
                  </button>
                )}
              </section>

              {/* Shared Treasury Card */}
              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#BCE6D5] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-[#4A3531]">💞 我們的共同金庫</h3>
                    <p className="text-[11px] text-[#7D635D]">
                      兩人都能存錢進去，用來一起買家具、壁紙或升級農場！
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xl font-extrabold text-[#1F6B54] tabular-nums">
                      {house.treasuryCoins}
                    </div>
                    <div className="text-[10px] font-bold text-[#7D635D]">金庫餘額</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[50, 100, 200].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={game.coins < amt}
                      onClick={() => void handleDepositTreasury(amt)}
                      className={`min-h-[44px] rounded-2xl text-xs font-extrabold transition ${
                        game.coins >= amt
                          ? 'bg-[#E6F8F0] border border-[#9BE0C4] text-[#1F6B54] hover:bg-[#D5F3E6] active:scale-95'
                          : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                      }`}
                    >
                      存入 +{amt} 幣
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    min={10}
                    max={9999}
                    value={customDepositInput}
                    onChange={(e) => setCustomDepositInput(e.target.value)}
                    aria-label="自訂存入金幣"
                    className="flex-1 min-w-0 min-h-[44px] rounded-2xl bg-white border border-[#CFECE0] px-3 text-sm font-extrabold text-[#4A3531] tabular-nums focus:outline-none focus:border-[#5CC9A7]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleDepositTreasury(Number(customDepositInput) || 0)}
                    className="min-h-[44px] px-4 rounded-2xl bg-[#5CC9A7] text-white text-xs font-extrabold shadow-[0_2px_0_#3BA886] shrink-0"
                  >
                    自訂存入
                  </button>
                </div>

                {house.treasuryHistory.length > 0 && (
                  <div className="pt-1 border-t border-[#E8F3EE] space-y-1 max-h-24 overflow-y-auto">
                    <p className="text-[10px] font-extrabold text-[#7D635D]">最近金庫存入紀錄</p>
                    {house.treasuryHistory.slice(0, 6).map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-[11px] font-bold text-[#5A423C]"
                      >
                        <span>{h.authorName} 存入共同基金</span>
                        <span className="text-[#1F6B54] tabular-nums">+{h.amount} 金幣</span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Active Shared Goal */}
              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F2D59B] p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-extrabold text-[#4A3531]">🎯 兩人共同目標</h3>
                  <span className="text-xs font-extrabold text-[#9D5B12] tabular-nums">
                    {Math.min(house.treasuryCoins, activeGoal.targetCoins)} / {activeGoal.targetCoins} 幣
                  </span>
                </div>

                <div className="rounded-2xl bg-[#FFF8E8] border border-[#F3DFAF] p-3 space-y-2">
                  <p className="text-xs font-extrabold text-[#4A3531]">{activeGoal.title}</p>
                  <p className="text-[11px] text-[#7D635D] leading-snug">{activeGoal.description}</p>
                  <div className="w-full h-2.5 rounded-full bg-[#F4E6C8] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#F8C956] to-[#FF7A9E] transition-all duration-300"
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-extrabold text-[#256D57]">
                    獎勵：{activeGoal.rewardSummary}
                  </p>

                  <button
                    type="button"
                    disabled={isGoalDone || house.treasuryCoins < activeGoal.targetCoins}
                    onClick={() => void handleCompleteGoal()}
                    className={`w-full min-h-[44px] rounded-2xl text-xs font-extrabold transition ${
                      isGoalDone
                        ? 'bg-[#E5F2ED] text-[#6B9687] cursor-not-allowed'
                        : house.treasuryCoins >= activeGoal.targetCoins
                        ? 'bg-[#FF7A9E] text-white shadow-[0_3px_0_#D9577B] active:translate-y-0.5'
                        : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                    }`}
                  >
                    {isGoalDone
                      ? '✓ 已達成此共同目標'
                      : house.treasuryCoins >= activeGoal.targetCoins
                      ? '達成目標！立刻兌換獎勵'
                      : `金庫再存 ${activeGoal.targetCoins - house.treasuryCoins} 幣即可兌換`}
                  </button>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-extrabold text-[#7D635D]">切換其他共同目標：</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHARED_GOALS.map((g) => {
                      const active = g.id === house.activeGoalId;
                      const done = house.completedGoalIds.includes(g.id);
                      return (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => void handleSelectGoal(g.id)}
                          className={`min-h-[44px] rounded-xl px-2.5 py-1.5 border text-left text-[11px] font-extrabold transition ${
                            active
                              ? 'bg-[#FFF3D1] border-[#E6A222] text-[#7A540E]'
                              : 'bg-[#FAF5F0] border-[#E7D8CE] text-[#6E544E]'
                          }`}
                        >
                          <div className="truncate">{done ? `✓ ${g.title}` : g.title}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Co-op House Milestones */}
              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[#4A3531] flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#E6A222]" />
                    <span>共同佈置里程碑</span>
                  </h3>
                  <span className="text-xs font-extrabold text-[#826862] tabular-nums">
                    {house.achievedMilestones.length} / {SHARED_MILESTONES.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {SHARED_MILESTONES.map((m) => {
                    const achieved = house.achievedMilestones.includes(m.id);
                    const claimed = house.claimedMilestones.includes(m.id);
                    return (
                      <div
                        key={m.id}
                        className={`rounded-2xl border p-3 flex items-center justify-between gap-2 ${
                          claimed
                            ? 'bg-[#F3FBF8] border-[#C5E8DA]'
                            : achieved
                            ? 'bg-[#FFF8DF] border-[#F2CE6D]'
                            : 'bg-[#FAF5F1] border-[#E8DBD3]'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-[#4A3531]">
                            {m.emoji} {m.title}
                          </div>
                          <p className="text-[10px] text-[#7D635D] mt-0.5">{m.description}</p>
                          <p className="text-[10px] font-extrabold text-[#9D5B12] mt-0.5">
                            獎勵 +{m.rewardCoins} 金幣 · +{m.rewardGrowth} 成長
                          </p>
                        </div>

                        {claimed ? (
                          <span className="px-2.5 py-1 rounded-xl bg-[#E3F7F0] text-[11px] font-extrabold text-[#256D57] shrink-0">
                            已領取
                          </span>
                        ) : achieved ? (
                          <button
                            type="button"
                            onClick={() => void handleClaimMilestone(m.id)}
                            className="min-h-[44px] px-3 rounded-xl bg-[#FF7A9E] text-white text-xs font-extrabold shrink-0 active:scale-95 transition"
                          >
                            領取
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-[#EFE6E0] text-[11px] font-bold text-[#957B74] shrink-0">
                            進行中
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* TAB 4: PHOTO MODE */}
          {tab === 'photo' && (
            <>
              <RoomPhotoCard photo={previewPhotoRecord} />

              <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3.5 space-y-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#4A3531]">選擇萌寵拍照姿勢</h3>
                  <p className="text-[10px] text-[#826862]">
                    收集完成「草莓甜心 / 森林露營 / 雲朵午睡」主題套裝可解鎖限定姿勢！
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {ROOM_PHOTO_POSES.map((pose) => {
                    const unlocked =
                      !pose.requiresTheme || house.unlockedPhotoPoses.includes(pose.id);
                    const active = selectedPoseId === pose.id;
                    return (
                      <button
                        key={pose.id}
                        type="button"
                        disabled={!unlocked}
                        onClick={() => {
                          setSelectedPoseId(pose.id);
                          soundFX.pop(game.soundEnabled);
                        }}
                        className={`min-h-[48px] rounded-2xl px-2.5 py-2 border text-left transition ${
                          !unlocked
                            ? 'bg-[#F3ECE8] border-[#E2D6CE] text-[#9E8B84] cursor-not-allowed'
                            : active
                            ? 'bg-[#FFEAF0] border-2 border-[#FF7A9E] text-[#B83B64]'
                            : 'bg-[#FFF9F2] border-[#EAD9D0] text-[#4A3531]'
                        }`}
                      >
                        <div className="text-xs font-extrabold">
                          {unlocked ? pose.emoji : '🔒'} {pose.label}
                        </div>
                        <div className="text-[10px] font-bold opacity-80">{pose.badgeText}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#4A3531]">
                    <Tag className="w-3.5 h-3.5 text-[#D64470]" />
                    <span>寫下紀念標題與心情</span>
                  </div>
                  <input
                    type="text"
                    maxLength={24}
                    value={photoTitle}
                    onChange={(e) => setPhotoTitle(e.target.value)}
                    placeholder="相片標題（如：新沙發開箱日！）"
                    className="w-full min-h-[44px] rounded-2xl bg-white border border-[#EED9D0] px-3 text-sm font-bold text-[#4A3531] focus:outline-none focus:border-[#FF7A9E]"
                  />
                  <input
                    type="text"
                    maxLength={60}
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    placeholder="分享給成長手帳與留言板的話…"
                    className="w-full min-h-[44px] rounded-2xl bg-white border border-[#EED9D0] px-3 text-sm font-medium text-[#4A3531] focus:outline-none focus:border-[#FF7A9E]"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={sharingPhoto}
                    onClick={() => handleSavePhoto(false)}
                    className="min-h-[46px] rounded-2xl bg-[#5CC9A7] text-white text-xs font-extrabold shadow-[0_3px_0_#3BA886] hover:bg-[#49B895] active:translate-y-0.5 transition inline-flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>拍照並儲存到成長手帳相簿</span>
                  </button>

                  <button
                    type="button"
                    disabled={sharingPhoto}
                    onClick={() => handleSavePhoto(true)}
                    className="min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold shadow-[0_3px_0_#D9577B] hover:bg-[#F45D86] active:translate-y-0.5 transition inline-flex items-center justify-center gap-1.5"
                  >
                    <MessageCircleHeart className="w-4 h-4" />
                    <span>{sharingPhoto ? '分享中…' : '拍照並分享到留言板'}</span>
                  </button>
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
