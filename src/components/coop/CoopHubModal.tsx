import React, { useMemo, useState } from 'react';
import { Award, Bell, Flame, Gift, Home, Sprout, X } from 'lucide-react';
import { COOP_BADGES } from '../../data/coop';
import { INGREDIENTS } from '../../data/kitchen';
import {
  CoopGameType,
  GameState,
  IngredientId,
  KitchenRecipe,
  SharedPetRoom,
  ThemeSetId,
} from '../../types';
import { getOfflinePartnerEvents } from '../../utils/coop';
import { CoopFarmRelayGame } from './CoopFarmRelayGame';
import { CoopRoomDecorGame } from './CoopRoomDecorGame';

interface CoopHubModalProps {
  open: boolean;
  onClose: () => void;
  game: GameState;
  sharedRoom: SharedPetRoom | null;
  currentUserId: string;
  actorName: string;
  onStartRoomSession: (themeId?: ThemeSetId) => void;
  onSelectFurniture: (itemId: string) => { ok: boolean; error?: string; notice?: string };
  onPlaceCandidate: (
    queueId: string,
    x: number,
    y: number
  ) => { ok: boolean; error?: string; notice?: string };
  onSettleRoomSession: () => { ok: boolean; error?: string; notice?: string };
  onPlantCoopCrop: (
    plotId: number,
    ingredientId: IngredientId
  ) => { ok: boolean; error?: string; notice?: string };
  onHarvestCoopCrop: (plotId: number) => { ok: boolean; error?: string; notice?: string };
  onDepositIngredient: (
    ingredientId: IngredientId
  ) => { ok: boolean; error?: string; notice?: string };
  onCookCoopRecipe: (
    recipe: KitchenRecipe
  ) => { ok: boolean; error?: string; notice?: string };
  onClaimReward: (rewardId: string) => { ok: boolean; error?: string; notice?: string };
  onAcknowledgeOfflineEvents: () => void;
  onShareCardToBoard?: (title: string, body: string) => Promise<string | null>;
}

export const CoopHubModal: React.FC<CoopHubModalProps> = ({
  open,
  onClose,
  game,
  sharedRoom,
  currentUserId,
  actorName,
  onStartRoomSession,
  onSelectFurniture,
  onPlaceCandidate,
  onSettleRoomSession,
  onPlantCoopCrop,
  onHarvestCoopCrop,
  onDepositIngredient,
  onCookCoopRecipe,
  onClaimReward,
  onAcknowledgeOfflineEvents,
  onShareCardToBoard,
}) => {
  const [gameTab, setGameTab] = useState<CoopGameType>('room_decor');
  const [rewardToast, setRewardToast] = useState<string>('');

  const unclaimedRewards = useMemo(
    () =>
      game.coop.pendingRewards.filter(
        (r) => !r.claimedByUserIds.includes(currentUserId)
      ),
    [game.coop.pendingRewards, currentUserId]
  );

  const offlineEvents = useMemo(
    () => getOfflinePartnerEvents(game.coop, currentUserId),
    [game.coop, currentUserId]
  );

  if (!open) return null;

  const partnerTitleUnlocked =
    game.encyclopedia.unlockedTitles.includes('coop_partner');
  const bestPartnerUnlocked = game.coop.unlockedBadges.includes('best_partner');

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B2621]/55 backdrop-blur-xs flex items-center justify-center p-2 overflow-x-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="coop-hub-title"
    >
      <div className="w-full max-w-[420px] max-h-[94dvh] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-[#FFEAF0] via-[#FFF6DA] to-[#E8F8F2] border-b border-[#F2DFD5] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 id="coop-hub-title" className="text-base font-extrabold text-[#4A3531] truncate">
              🤝 共養合作小遊戲
            </h2>
            <p className="text-[11px] font-bold text-[#7D635D] truncate tabular-nums">
              {sharedRoom ? `小屋同步中 · 家具碎片 ${game.furnitureShards}` : '單人／共養體驗中'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉合作遊戲"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/85 text-[#5A3E36] flex items-center justify-center hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3">
          {/* Streak & Milestones Banner (3-day Best Partner badge / 7-day Tacit Partner title) */}
          <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F3DCAB] p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#9D5B12]">
                <Flame className="w-4 h-4 text-[#FF7A9E]" />
                <span>連續合作天數：{game.coop.streakDays} 天</span>
              </div>
              <span className="text-[10px] font-bold text-[#7D635D]">
                所有獎勵兩人相同・絕不依貢獻區分
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              <div
                className={`rounded-2xl border px-2.5 py-1.5 text-[11px] ${
                  bestPartnerUnlocked
                    ? 'bg-[#FFF3D8] border-[#F2CE6D] text-[#8A5610]'
                    : 'bg-[#FAF5F0] border-[#E7DAD2] text-[#8B756F]'
                }`}
              >
                <div className="font-extrabold">
                  {bestPartnerUnlocked ? '🤝 已解鎖' : '🔒 連續 3 天'} · 最佳搭檔徽章
                </div>
                <div className="text-[10px] tabular-nums">
                  進度 {Math.min(3, game.coop.streakDays)} / 3 天
                </div>
              </div>

              <div
                className={`rounded-2xl border px-2.5 py-1.5 text-[11px] ${
                  partnerTitleUnlocked
                    ? 'bg-[#FFEAF2] border-[#F4B4CB] text-[#B83B64]'
                    : 'bg-[#FAF5F0] border-[#E7DAD2] text-[#8B756F]'
                }`}
              >
                <div className="font-extrabold">
                  {partnerTitleUnlocked ? '💞 已解鎖' : '🔒 連續 7 天'} · 默契搭檔稱號
                </div>
                <div className="text-[10px] tabular-nums">
                  進度 {Math.min(7, game.coop.streakDays)} / 7 天
                </div>
              </div>
            </div>

            {game.coop.unlockedBadges.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {game.coop.unlockedBadges.map((bId) => {
                  const def = COOP_BADGES[bId];
                  if (!def) return null;
                  return (
                    <span
                      key={bId}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${def.badgeClass}`}
                    >
                      <Award className="w-3 h-3" />
                      <span>
                        {def.emoji} {def.name}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </section>

          {/* Offline Partner Summary Banner */}
          {offlineEvents.length > 0 && (
            <section className="rounded-3xl bg-[#EEF4FF] border-2 border-[#BCD2FA] p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#355A9C]">
                  <Bell className="w-4 h-4" />
                  <span>你不在線時，夥伴剛完成了 {offlineEvents.length} 項協力！</span>
                </div>
                <button
                  type="button"
                  onClick={onAcknowledgeOfflineEvents}
                  className="min-h-[30px] px-2.5 rounded-xl bg-white border border-[#BCD2FA] text-[10px] font-extrabold text-[#355A9C]"
                >
                  我知道了
                </button>
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {offlineEvents.slice(0, 4).map((ev) => (
                  <p key={ev.id} className="text-[11px] font-bold text-[#384C75]">
                    • {ev.actorName} {ev.summary}
                  </p>
                ))}
              </div>
            </section>
          )}

          {/* Claimable Equal Rewards */}
          {rewardToast && (
            <div className="rounded-2xl bg-[#E5F8F0] border border-[#AEE3D0] px-3 py-2 text-xs font-extrabold text-[#1F6B54]">
              🎁 {rewardToast}
            </div>
          )}

          {unclaimedRewards.length > 0 && (
            <section className="rounded-3xl bg-[#FFF6DF] border-2 border-[#F2CE6D] p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#8A5610]">
                <Gift className="w-4 h-4" />
                <span>可領取合作獎勵（雙方各得相同份額）</span>
              </div>
              <div className="space-y-2">
                {unclaimedRewards.map((rw) => {
                  const rareList = Object.entries(rw.rareIngredients)
                    .filter(([, qty]) => (qty ?? 0) > 0)
                    .map(
                      ([id, qty]) =>
                        `${INGREDIENTS[id as IngredientId]?.name ?? id}×${qty}`
                    );
                  return (
                    <div
                      key={rw.id}
                      className="rounded-2xl bg-white border border-[#F2D59B] p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#4A3531] truncate">
                          {rw.title}
                        </div>
                        <div className="text-[10px] font-bold text-[#9D5B12] tabular-nums">
                          +{rw.coins} 金幣 · +{rw.furnitureShards} 碎片 · +{rw.intimacy} 親密度
                          {rareList.length > 0 ? ` · ${rareList.join('、')}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const res = onClaimReward(rw.id);
                          if (res.notice) setRewardToast(res.notice);
                        }}
                        className="min-h-[40px] px-3 rounded-xl bg-[#FF7A9E] text-white text-xs font-extrabold shrink-0 active:scale-95 transition"
                      >
                        領取獎勵
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Two Co-op Games Switcher */}
          <nav className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setGameTab('room_decor')}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
                gameTab === 'room_decor'
                  ? 'bg-white text-[#D64470] shadow-xs'
                  : 'text-[#6E544E]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>一起布置房間</span>
            </button>
            <button
              type="button"
              onClick={() => setGameTab('farm_relay')}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
                gameTab === 'farm_relay'
                  ? 'bg-white text-[#1F6B54] shadow-xs'
                  : 'text-[#6E544E]'
              }`}
            >
              <Sprout className="w-4 h-4" />
              <span>農場訂單接力</span>
            </button>
          </nav>

          {gameTab === 'room_decor' ? (
            <CoopRoomDecorGame
              game={game}
              actorUserId={currentUserId}
              actorName={actorName}
              onStartSession={onStartRoomSession}
              onSelectFurniture={onSelectFurniture}
              onPlaceCandidate={onPlaceCandidate}
              onSettleSession={onSettleRoomSession}
            />
          ) : (
            <CoopFarmRelayGame
              game={game}
              onPlantCrop={onPlantCoopCrop}
              onHarvestCrop={onHarvestCoopCrop}
              onDepositIngredient={onDepositIngredient}
              onCookRecipe={onCookCoopRecipe}
              onShareCardToBoard={onShareCardToBoard}
            />
          )}
        </div>
      </div>
    </div>
  );
};
