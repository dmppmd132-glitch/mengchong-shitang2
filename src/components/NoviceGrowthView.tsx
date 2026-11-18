import React from 'react';
import { CheckCircle2, Coins, Gift, Lock, Sparkles } from 'lucide-react';
import { STAGE_BACKGROUNDS } from '../data/noviceGrowth';
import { GameState, StageBackgroundId } from '../types';
import { evaluateAllNoviceDays } from '../utils/noviceGrowth';

interface NoviceGrowthViewProps {
  game: GameState;
  hasSharedRoom: boolean;
  evaluation?: ReturnType<typeof evaluateAllNoviceDays>;
  onClaimDay: (day: number) => void;
  onSelectBackground?: (bg: StageBackgroundId) => void;
}

export const NoviceGrowthView: React.FC<NoviceGrowthViewProps> = ({
  game,
  hasSharedRoom,
  evaluation,
  onClaimDay,
  onSelectBackground,
}) => {
  const { currentDayIndex, claimedToday, days } =
    evaluation ?? evaluateAllNoviceDays(game, hasSharedRoom);
  const claimedCount = game.noviceGrowth.claimedDays.length;

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-gradient-to-r from-[#E6F8F1] via-[#FFF6DE] to-[#FFEAF0] border-2 border-[#E3DFD7] p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#4A3531]">
              新手 7 天成長之路
            </h2>
            <p className="text-xs text-[#7D635D] mt-0.5">
              目前已解鎖至第 {currentDayIndex} 天 · 每日限領 1 次獎勵
            </p>
          </div>
          <div className="text-right tabular-nums shrink-0">
            <span className="text-xl font-extrabold text-[#256D57]">
              {claimedCount} / 7
            </span>
            <p className="text-[11px] font-bold text-[#7D635D]">已完成天數</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          <span
            className={`px-2.5 py-1 rounded-xl border ${
              claimedToday
                ? 'bg-[#FFF3D8] border-[#F0CF7A] text-[#8A5A10]'
                : 'bg-[#E2F6EE] border-[#AEE3D0] text-[#256D57]'
            }`}
          >
            {claimedToday
              ? '今日獎勵已領取，明天可繼續領取下一天！'
              : '今日尚可領取 1 天獎勵'}
          </span>
          <span className="text-[#7D635D]">
            未完成不會扣分或懲罰，進度永久保留
          </span>
        </div>
      </section>

      {game.unlockedBackgrounds.length > 1 && onSelectBackground && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#E8DDF7] p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#5E478C]">
            <Sparkles className="w-4 h-4" />
            <span>舞台限定背景切換</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {game.unlockedBackgrounds.map((bgId) => {
              const bg = STAGE_BACKGROUNDS[bgId];
              const isSelected = game.activeBackground === bgId;
              return (
                <button
                  key={bgId}
                  type="button"
                  onClick={() => onSelectBackground(bgId)}
                  className={`min-h-[44px] rounded-2xl px-3 py-2 text-left border-2 transition ${
                    isSelected
                      ? 'bg-[#F3EEFF] border-[#9C89D9] text-[#4A3531]'
                      : 'bg-white border-[#EFE5DE] text-[#7D635D] hover:bg-[#FAF6FF]'
                  }`}
                >
                  <div className="text-xs font-extrabold">{bg.name}</div>
                  <div className="text-[10px] font-bold opacity-80">
                    {isSelected ? '使用中' : '點擊套用'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="space-y-3">
        {days.map((item) => {
          const { config, goals, isUnlockedByDay, isClaimed, canClaim, blockReason } = item;

          return (
            <article
              key={config.day}
              className={`rounded-3xl border-2 p-4 space-y-3 transition ${
                isClaimed
                  ? 'bg-[#F7F3EE] border-[#E8DED8] opacity-90'
                  : canClaim
                  ? 'bg-[#FFF5F8] border-[#FF7A9E]'
                  : !isUnlockedByDay
                  ? 'bg-[#FAF6F2] border-[#ECE2DC] opacity-85'
                  : 'bg-[#FFFDF8] border-[#F4DFD7]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-extrabold text-[#4A3531]">
                      {config.title}
                    </h3>
                    {!isUnlockedByDay && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-[#EFE6E2] text-[#7D635D] text-[10px] font-extrabold">
                        <Lock className="w-3 h-3" />
                        第 {config.day} 天解鎖
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7D635D] mt-0.5 leading-snug">
                    {config.subtitle}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                {goals.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-2 text-xs font-bold rounded-xl bg-white/80 border border-[#F2E4DC] px-3 py-1.5"
                  >
                    <span
                      className={`inline-flex items-center gap-1.5 ${
                        g.done ? 'text-[#256D57]' : 'text-[#5A423C]'
                      }`}
                    >
                      <CheckCircle2
                        className={`w-3.5 h-3.5 shrink-0 ${
                          g.done ? 'text-[#3BA886]' : 'text-[#D6C5BE]'
                        }`}
                      />
                      <span>{g.label}</span>
                    </span>
                    <span
                      className={`tabular-nums shrink-0 ${
                        g.done ? 'text-[#256D57]' : 'text-[#8D746E]'
                      }`}
                    >
                      {g.current} / {g.target}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#6E544E] tabular-nums">
                  <span className="inline-flex items-center gap-1 text-[#A46D0F] bg-[#FFF4D1] px-2.5 py-1 rounded-xl">
                    <Coins className="w-3.5 h-3.5" />
                    +{config.rewardCoins} 金幣
                  </span>
                  {config.rewardItems.map((rw) => (
                    <span
                      key={rw.id}
                      className="inline-flex items-center gap-1 bg-[#FFF0F5] text-[#B83B64] px-2.5 py-1 rounded-xl"
                    >
                      <span aria-hidden="true">{rw.emoji}</span>
                      <span>{rw.label}</span>
                    </span>
                  ))}
                </div>

                {isClaimed ? (
                  <span className="min-h-[40px] px-3.5 rounded-2xl bg-[#E1EFEA] text-[#28735B] text-xs font-extrabold inline-flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                    已領取
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => onClaimDay(config.day)}
                    className={`min-h-[40px] px-4 rounded-2xl text-xs font-extrabold inline-flex items-center gap-1.5 transition shrink-0 ${
                      canClaim
                        ? 'bg-[#FF7A9E] text-white shadow-[0_3px_0_#D9577B] hover:bg-[#F45D86] active:translate-y-0.5'
                        : 'bg-[#EFE6E2] text-[#9E8B84] cursor-not-allowed'
                    }`}
                  >
                    <Gift className="w-4 h-4" />
                    <span>
                      {canClaim
                        ? '領取獎勵'
                        : blockReason === 'future_day'
                        ? '尚未解鎖'
                        : blockReason === 'already_claimed_today'
                        ? '明日可領'
                        : '進行中'}
                    </span>
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
