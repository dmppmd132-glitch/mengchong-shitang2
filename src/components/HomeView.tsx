import React, { useState } from 'react';
import {
  Bath,
  Footprints,
  Gamepad2,
  Heart,
  HeartHandshake,
  MessageCircleHeart,
  MessageSquareText,
  Moon,
  Sparkles,
  Sprout,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { getTitleDefinition } from '../data/encyclopedia';
import { FOOD_CATEGORIES, FOOD_CATEGORY_LABELS, FOODS } from '../data/foods';
import { getGrowthRemaining, getRoundnessTier } from '../data/growth';
import { STAGE_BACKGROUNDS } from '../data/noviceGrowth';
import { getPetSpeciesInfo } from '../data/species';
import { getStickerById } from '../data/stickers';
import {
  DialogueLine,
  FeedingVisualEffect,
  FloatingFeedback,
  Food,
  FoodCategory,
  Pet,
  PetExpression,
  PetMessage,
  PetPersonality,
  PetTouchZone,
  PiggyActionState,
  SharedHouse,
  SharedPetRoom,
  StageBackgroundId,
  TitleId,
  WeatherState,
} from '../types';
import { evaluateFoodPreference, getPersonalitySummaryLabel } from '../utils/personality';
import { PetDialogueBubble } from './dialogue/PetDialogueBubble';
import { HomeHousePreview } from './house/HomeHousePreview';
import { HouseModalTab } from './house/HouseHubModal';
import { PiggyCharacter } from './PiggyCharacter';

interface HomeViewProps {
  pet: Pet;
  action: PiggyActionState;
  expression?: PetExpression;
  flyingFoodEmoji: string | null;
  feedEffect?: FeedingVisualEffect;
  feedParticles?: string[];
  speech: string;
  feedbacks: FloatingFeedback[];
  inventory: Record<string, number>;
  onPet: (zone: PetTouchZone) => void;
  onFeed: (food: Food) => void;
  onSleep: () => void;
  onBath: () => void;
  onWalk: () => void;
  onGoToCanteen: () => void;
  onOpenMinigame?: () => void;
  onOpenHouse?: (tab?: HouseModalTab) => void;
  house?: SharedHouse;
  onOpenNoviceGrowth?: () => void;
  noviceClaimableCount?: number;
  activeTitle?: TitleId | null;
  activeBackground?: StageBackgroundId;
  unlockedBackgrounds?: StageBackgroundId[];
  onSelectBackground?: (bg: StageBackgroundId) => void;
  sharedRoom?: SharedPetRoom | null;
  currentUserId?: string | null;
  onOpenSharedPet?: () => void;
  latestMessage?: PetMessage | null;
  unreadMessagesCount?: number;
  onOpenMessageBoard?: () => void;
  personality?: PetPersonality;
  onOpenPersonality?: () => void;
  onOpenCoopGames?: () => void;
  coopBadgeCount?: number;
  activeDialogue?: DialogueLine | null;
  weather?: WeatherState;
  dialogueHistoryCount?: number;
  onRespondDialogue?: (responseId: string) => void;
  onDismissDialogue?: () => void;
  onOpenDialogueHistory?: () => void;
}

type PetStatKey = 'hunger' | 'mood' | 'cleanliness' | 'energy';

const STAT_CONFIG: {
  key: PetStatKey;
  label: string;
  barColor: string;
  trackColor: string;
}[] = [
  { key: 'hunger', label: '飽食度', barColor: 'bg-[#FF8AA8]', trackColor: 'bg-[#FFE6ED]' },
  { key: 'mood', label: '心情', barColor: 'bg-[#FFD166]', trackColor: 'bg-[#FFF3D1]' },
  { key: 'cleanliness', label: '清潔度', barColor: 'bg-[#5CC9A7]', trackColor: 'bg-[#DFF6EE]' },
  { key: 'energy', label: '精力', barColor: 'bg-[#9C89D9]', trackColor: 'bg-[#EEE9FA]' },
];

export const HomeView: React.FC<HomeViewProps> = ({
  pet,
  action,
  expression = 'normal',
  flyingFoodEmoji,
  feedEffect = 'none',
  feedParticles = [],
  speech,
  feedbacks,
  inventory,
  onPet,
  onFeed,
  onSleep,
  onBath,
  onWalk,
  onGoToCanteen,
  onOpenMinigame,
  onOpenHouse,
  house,
  onOpenNoviceGrowth,
  noviceClaimableCount = 0,
  activeTitle = null,
  activeBackground = 'default',
  unlockedBackgrounds = ['default'],
  onSelectBackground,
  sharedRoom = null,
  currentUserId = null,
  onOpenSharedPet,
  latestMessage = null,
  unreadMessagesCount = 0,
  onOpenMessageBoard,
  personality,
  onOpenPersonality,
  onOpenCoopGames,
  coopBadgeCount = 0,
  activeDialogue = null,
  weather,
  dialogueHistoryCount = 0,
  onRespondDialogue,
  onDismissDialogue,
  onOpenDialogueHistory,
}) => {
  const [foodDrawerOpen, setFoodDrawerOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FoodCategory>('meal');
  const [draggingFoodId, setDraggingFoodId] = useState<string | null>(null);
  const [isDropOver, setIsDropOver] = useState(false);

  const growthInfo = getGrowthRemaining(pet.growth);
  const roundnessTier = getRoundnessTier(pet.roundness);
  const speciesInfo = getPetSpeciesInfo(pet.species);
  const stageBgConfig = STAGE_BACKGROUNDS[activeBackground] ?? STAGE_BACKGROUNDS.default;
  const activeTitleDef = activeTitle ? getTitleDefinition(activeTitle) : null;

  const filteredFoods = FOODS.filter((f) => f.category === selectedCategory);

  const handleDropOnPiggy = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropOver(false);
    const foodId = e.dataTransfer.getData('text/plain') || draggingFoodId;
    if (!foodId) return;
    const food = FOODS.find((f) => f.id === foodId);
    if (food) {
      onFeed(food);
    }
    setDraggingFoodId(null);
  };

  return (
    <div className="px-4 pt-3 pb-24 space-y-3.5">
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F5DFD7] p-3.5 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-[#4A3531] truncate">
                {pet.name}
              </h2>
              <span className="text-xs font-bold text-[#B84A6F]">
                Lv.{growthInfo.currentStage.level} {growthInfo.currentStage.name}
              </span>
              {activeTitleDef && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${activeTitleDef.badgeClass}`}
                >
                  <span aria-hidden="true">{activeTitleDef.emoji}</span>
                  <span>{activeTitleDef.name}</span>
                </span>
              )}
              {personality && onOpenPersonality && (
                <button
                  type="button"
                  onClick={onOpenPersonality}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FFF3D8] border border-[#F2CE6D] text-[10px] font-extrabold text-[#8A5610] hover:bg-[#FFE9BE] active:scale-95 transition"
                >
                  <span>{getPersonalitySummaryLabel(personality)}</span>
                  <span className="opacity-70">›</span>
                </button>
              )}
            </div>
            <p className="text-xs text-[#826862] mt-0.5 tabular-nums">
              體重 {pet.weight.toFixed(1)} kg · {roundnessTier.label} · 親密值 {pet.intimacy}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#D64470] tabular-nums">
              <Heart className="w-3.5 h-3.5 fill-[#FF7A9E] text-[#FF7A9E]" />
              {pet.intimacy}
            </span>
            {onOpenSharedPet && (
              <button
                type="button"
                onClick={onOpenSharedPet}
                className={`min-h-[30px] px-2.5 rounded-xl text-[11px] font-extrabold inline-flex items-center gap-1 transition active:scale-95 ${
                  sharedRoom
                    ? 'bg-[#E3F7F0] border border-[#AEE3D0] text-[#256D57]'
                    : 'bg-[#FFF0F4] border border-[#F5C9D7] text-[#B83B64]'
                }`}
              >
                <Users className="w-3 h-3 shrink-0" />
                <span>
                  {sharedRoom
                    ? sharedRoom.partnerId
                      ? '兩人共養中'
                      : `邀請碼 ${sharedRoom.inviteCode}`
                    : '兩人共養'}
                </span>
              </button>
            )}
          </div>
        </div>
        {sharedRoom && (
          <p className="mt-1.5 text-[11px] font-bold text-[#256D57] truncate">
            {sharedRoom.partnerId
              ? `共養夥伴：${
                  sharedRoom.ownerId === currentUserId
                    ? sharedRoom.partnerEmail || '夥伴'
                    : sharedRoom.ownerEmail || '夥伴'
                }`
              : `邀請碼：${sharedRoom.inviteCode}（等待夥伴輸入加入）`}
          </p>
        )}

        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-[#7D635D] mb-1">
            <span>成長進度</span>
            <span className="tabular-nums">
              {growthInfo.nextStage
                ? `距離「${growthInfo.nextStage.name}」還需 ${growthInfo.remaining} 成長值`
                : '已達最高階時尚大豬'}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-[#F5E9E2] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FF8AA8] to-[#5CC9A7] transition-all duration-300"
              style={{ width: `${growthInfo.progressPercent}%` }}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5" aria-label="小豬狀態數值">
        {STAT_CONFIG.map(({ key, label, barColor, trackColor }) => {
          const val = pet[key];
          return (
            <div
              key={key}
              className="rounded-2xl bg-[#FFFDF8] border border-[#F3DFD7] px-3 py-2"
            >
              <div className="flex items-center justify-between text-xs font-bold text-[#5A423C] mb-1">
                <span>{label}</span>
                <span className="tabular-nums">{val}%</span>
              </div>
              <div className={`w-full h-2 rounded-full ${trackColor} overflow-hidden`}>
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-300`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </section>

      {pet.consecutiveFastFood >= 3 && (
        <div className="rounded-2xl bg-[#FFF3D1] border border-[#F3CE72] px-3.5 py-2.5 flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-[#7B5610] leading-snug">
            有點撐了… 連續吃速食好幾次了，帶我去散步消化一下吧！
          </p>
          <button
            type="button"
            onClick={onWalk}
            className="min-h-[36px] px-3 rounded-xl bg-[#5CC9A7] text-white text-xs font-extrabold whitespace-nowrap shrink-0 active:scale-95 transition"
          >
            去散步
          </button>
        </div>
      )}

      <section
        onDragOver={(e) => {
          e.preventDefault();
          setIsDropOver(true);
        }}
        onDragLeave={() => setIsDropOver(false)}
        onDrop={handleDropOnPiggy}
        className={`relative rounded-3xl ${stageBgConfig.stageClass} border-2 border-[#F5DFD7] px-3.5 pt-12 pb-4 flex flex-col items-center justify-center min-h-[276px] overflow-hidden`}
      >
        {activeBackground === 'starlight_garden' && (
          <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
            <span className="absolute left-5 top-4 text-sm">✨</span>
            <span className="absolute right-8 top-6 text-xs">🌟</span>
            <span className="absolute left-10 bottom-10 text-xs">🌙</span>
            <span className="absolute right-6 bottom-12 text-sm">✨</span>
          </div>
        )}

        {onOpenDialogueHistory && (
          <button
            type="button"
            onClick={onOpenDialogueHistory}
            className="absolute left-3 top-3 z-20 px-2.5 py-1 rounded-xl bg-white/88 border border-[#EAD4DC] text-[10px] font-extrabold text-[#6E544E] inline-flex items-center gap-1 hover:bg-white transition"
          >
            {weather && <span aria-hidden="true">{weather.emoji}</span>}
            {weather && <span>{weather.label}</span>}
            <span className="opacity-50">·</span>
            <MessageSquareText className="w-3 h-3 text-[#D64470]" />
            <span>對話紀錄 ({dialogueHistoryCount})</span>
          </button>
        )}

        {unlockedBackgrounds.length > 1 && onSelectBackground && (
          <button
            type="button"
            onClick={() =>
              onSelectBackground(
                activeBackground === 'starlight_garden' ? 'default' : 'starlight_garden'
              )
            }
            className="absolute right-3 top-3 z-20 px-2.5 py-1 rounded-xl bg-white/85 border border-[#E6D6E8] text-[10px] font-extrabold text-[#5E478C] hover:bg-white transition"
          >
            {activeBackground === 'starlight_garden' ? '🌌 星光花園' : '☀️ 暖陽食堂'}
          </button>
        )}

        {activeDialogue && onRespondDialogue && onDismissDialogue ? (
          <PetDialogueBubble
            pet={pet}
            line={activeDialogue}
            onRespond={onRespondDialogue}
            onClose={onDismissDialogue}
            onOpenHistory={onOpenDialogueHistory}
          />
        ) : (
          <div className="min-h-[34px] mb-1 flex items-center justify-center">
            {speech && (
              <div className="relative rounded-2xl bg-white/95 border border-[#F1D5DF] px-4 py-1.5 text-xs font-extrabold text-[#4A3531] shadow-xs text-center max-w-[260px]">
                {speech}
              </div>
            )}
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 top-14 flex flex-col items-center z-20">
          {feedbacks.map((fb) => (
            <div
              key={fb.id}
              className="animate-float-up text-sm font-extrabold text-[#D64470] drop-shadow-xs flex items-center gap-1"
            >
              {fb.emoji && <span>{fb.emoji}</span>}
              <span>{fb.text}</span>
            </div>
          ))}
        </div>

        <PiggyCharacter
          species={pet.species}
          growth={pet.growth}
          roundness={pet.roundness}
          action={action}
          expression={expression}
          equipped={pet.accessories}
          flyingFoodEmoji={flyingFoodEmoji}
          feedEffect={feedEffect}
          feedParticles={feedParticles}
          onPet={onPet}
          size={206}
          isDropTarget={isDropOver}
        />

        <p className="mt-1 text-[11px] font-bold text-[#8A716B] flex items-center gap-1 text-center">
          <Sparkles className="w-3 h-3 text-[#FF7A9E] shrink-0" />
          <span>輕點{speciesInfo.shortName}的頭、臉頰、肚肚或小手有不同反應</span>
        </p>
      </section>

      <section className="grid grid-cols-4 gap-2" aria-label="照護互動按鈕">
        <button
          type="button"
          onClick={() => setFoodDrawerOpen(true)}
          className="min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-xs shadow-[0_3px_0_#D9577B] hover:bg-[#F56990] active:translate-y-0.5 transition"
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>食堂</span>
        </button>

        <button
          type="button"
          onClick={onSleep}
          className="min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#B3A4E8] text-white font-extrabold text-xs shadow-[0_3px_0_#8B79C9] hover:bg-[#A493E0] active:translate-y-0.5 transition"
        >
          <Moon className="w-5 h-5" />
          <span>睡覺</span>
        </button>

        <button
          type="button"
          onClick={onBath}
          className="min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#5CC9A7] text-white font-extrabold text-xs shadow-[0_3px_0_#3BA886] hover:bg-[#4DBE9B] active:translate-y-0.5 transition"
        >
          <Bath className="w-5 h-5" />
          <span>洗澡</span>
        </button>

        <button
          type="button"
          onClick={onWalk}
          className="min-h-[60px] flex flex-col items-center justify-center gap-1 rounded-2xl bg-[#F8C956] text-[#4A3531] font-extrabold text-xs shadow-[0_3px_0_#D9A732] hover:bg-[#F3BE40] active:translate-y-0.5 transition"
        >
          <Footprints className="w-5 h-5" />
          <span>散步</span>
        </button>
      </section>

      {onOpenHouse && house && (
        <HomeHousePreview pet={pet} house={house} onOpenHouse={onOpenHouse} />
      )}

      {sharedRoom && onOpenCoopGames && (
        <button
          type="button"
          onClick={onOpenCoopGames}
          className="w-full min-h-[52px] rounded-2xl bg-gradient-to-r from-[#FFF0F5] via-[#FFF6DF] to-[#E8F8F2] border-2 border-[#F3C8D7] px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:brightness-[0.99] active:scale-[0.99] transition text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FFE3EE] text-[#D64470] flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#4A3531]">
                  合作遊戲 · 雙人佈置＆農場接力
                </span>
                {coopBadgeCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-[#D64470] text-white text-[10px] font-extrabold tabular-nums">
                    {coopBadgeCount} 待領/新動態
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7D635D] truncate">
                90 秒一起布置房間、接力完成每日農場訂單，領相同獎勵＆默契稱號！
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#B83B64] whitespace-nowrap shrink-0">
            玩合作 ›
          </span>
        </button>
      )}

      {onOpenMinigame && (
        <button
          type="button"
          onClick={onOpenMinigame}
          className="w-full min-h-[50px] rounded-2xl bg-[#FFFDF8] border-2 border-[#F2D9A5] px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FFF8E8] active:scale-[0.99] transition text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FFF3D1] text-[#9D5B12] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-extrabold text-[#4A3531]">
                小遊戲中心 · 每日輪替賺金幣
              </span>
              <p className="text-[11px] text-[#7D635D] truncate">
                蘋果 / 薯條接接樂、泥巴澡、藏食偵探、節奏跳跳，每日開放 3 款！
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#9D5B12] whitespace-nowrap shrink-0">
            開始玩 ›
          </span>
        </button>
      )}

      {onOpenNoviceGrowth && (
        <button
          type="button"
          onClick={onOpenNoviceGrowth}
          className="w-full min-h-[50px] rounded-2xl bg-[#FFFDF8] border-2 border-[#C7EAE0] px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#F3FCF8] active:scale-[0.99] transition text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E3F7F0] text-[#256D57] flex items-center justify-center shrink-0">
              <Sprout className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#4A3531]">
                  新手 7 天成長之路
                </span>
                {noviceClaimableCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-[#3BA886] text-white text-[10px] font-extrabold">
                    可領獎勵
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7D635D] truncate">
                完成每日目標拿金幣、配件、限定背景與一週紀念圍兜
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#256D57] whitespace-nowrap shrink-0">
            查看 ›
          </span>
        </button>
      )}

      {onOpenMessageBoard && (
        <button
          type="button"
          onClick={onOpenMessageBoard}
          className="w-full min-h-[50px] rounded-2xl bg-[#FFFDF8] border-2 border-[#F4DFD7] px-3.5 py-2.5 flex items-center justify-between gap-2.5 hover:bg-[#FFF5F8] active:scale-[0.99] transition text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FFEAF0] text-[#D64470] flex items-center justify-center shrink-0">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold text-[#4A3531]">萌寵留言板與貼圖</span>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-lg bg-[#FF5A87] text-white text-[10px] font-extrabold tabular-nums">
                    {unreadMessagesCount} 則新訊息
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7D635D] truncate">
                {latestMessage
                  ? `${latestMessage.authorName}：${
                      latestMessage.stickerId
                        ? `[${getStickerById(latestMessage.stickerId)?.label ?? '貼圖'}] `
                        : ''
                    }${latestMessage.content.replace(/\[photo:[^\]]+\]/g, '📸 小屋合照').trim()}`
                  : '傳送可愛貼圖或悄悄話給夥伴'}
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-[#B83B64] whitespace-nowrap shrink-0">
            打開 ›
          </span>
        </button>
      )}

      {foodDrawerOpen && (
        <div className="rounded-3xl bg-[#FFFDF8] border-2 border-[#FAD5E0] p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-[#4A3531]">{pet.name}點餐區</h3>
              <p className="text-[11px] text-[#826862]">點擊食物餵食，或長按拖曳到{speciesInfo.shortName}身上</p>
            </div>
            <button
              type="button"
              onClick={() => setFoodDrawerOpen(false)}
              aria-label="關閉食堂選單"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-[#F7ECE6] text-[#5A3E36] hover:bg-[#EEDCD3]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {pet.hunger >= 100 && (
            <div className="rounded-2xl bg-[#FFEAF0] border border-[#F5B4C6] px-3 py-2 text-xs font-extrabold text-[#B83B64] text-center">
              {pet.name}已經吃飽了！
            </div>
          )}

          <div className="grid grid-cols-3 gap-1.5 bg-[#F8EFEA] p-1 rounded-2xl">
            {FOOD_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[38px] rounded-xl text-xs font-extrabold transition ${
                  selectedCategory === cat
                    ? 'bg-white text-[#D64470] shadow-xs'
                    : 'text-[#7D635D] hover:text-[#4A3531]'
                }`}
              >
                {FOOD_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {filteredFoods.map((food) => {
              const count = inventory[food.id] ?? 0;
              const isFull = pet.hunger >= 100;
              const pref = evaluateFoodPreference(pet.species, food.id);
              const isFavorite = pref === 'favorite';
              const isDisliked = pref === 'disliked';
              return (
                <div
                  key={food.id}
                  draggable={count > 0 && !isFull}
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', food.id);
                    setDraggingFoodId(food.id);
                  }}
                  onDragEnd={() => {
                    setDraggingFoodId(null);
                    setIsDropOver(false);
                  }}
                  className={`flex flex-col items-center rounded-2xl bg-[#FFF7EC] border p-2.5 text-center ${
                    isFavorite ? 'border-[#FF9AB8]' : 'border-[#F3DFD7]'
                  }`}
                >
                  <span className="text-3xl leading-none my-1" aria-hidden="true">
                    {food.emoji}
                  </span>
                  <span className="text-xs font-extrabold text-[#4A3531] truncate w-full">
                    {food.name}
                  </span>
                  <span className="text-[11px] font-bold text-[#826862] tabular-nums">
                    {isFavorite ? '♥ 最愛 · ' : isDisliked ? '💭 不太愛 · ' : ''}庫存 {count}
                  </span>
                  <button
                    type="button"
                    disabled={count <= 0}
                    onClick={() => {
                      if (count > 0) {
                        onFeed(food);
                      }
                    }}
                    className={`mt-2 w-full min-h-[36px] rounded-xl text-xs font-extrabold transition ${
                      count <= 0
                        ? 'bg-[#EAE0DA] text-[#9E8B85] cursor-not-allowed'
                        : isFull
                        ? 'bg-[#F8DDE5] text-[#B05B74]'
                        : 'bg-[#FF7A9E] text-white hover:bg-[#F45D86] active:scale-95'
                    }`}
                  >
                    {count <= 0 ? '缺貨' : '餵食'}
                  </button>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              setFoodDrawerOpen(false);
              onGoToCanteen();
            }}
            className="w-full min-h-[42px] rounded-2xl bg-[#E8F8F2] border border-[#AEE4D1] text-xs font-extrabold text-[#256D57] hover:bg-[#D8F3E9] transition"
          >
            前往「食堂商店」購買更多美食
          </button>
        </div>
      )}
    </div>
  );
};
