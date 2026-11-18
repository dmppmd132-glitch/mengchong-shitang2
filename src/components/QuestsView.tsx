import React, { useEffect, useState } from 'react';
import { CalendarHeart, CheckCircle2, Coins, Gift, Sparkles } from 'lucide-react';
import { getFoodById } from '../data/foods';
import { DailyTask, GameState, StageBackgroundId } from '../types';
import { evaluateAllNoviceDays } from '../utils/noviceGrowth';
import { NoviceGrowthView } from './NoviceGrowthView';

interface QuestsViewProps {
  dailyTasks: DailyTask[];
  dateStr: string;
  onClaimTask: (taskId: string) => void;
  game: GameState;
  hasSharedRoom: boolean;
  onClaimNoviceDay: (day: number) => void;
  handleClaimNoviceDay?: (day: number) => void;
  onSelectBackground?: (bg: StageBackgroundId) => void;
  initialSection?: 'daily' | 'growth';
}

export const QuestsView: React.FC<QuestsViewProps> = ({
  dailyTasks,
  dateStr,
  onClaimTask,
  game,
  hasSharedRoom,
  onClaimNoviceDay,
  handleClaimNoviceDay,
  onSelectBackground,
  initialSection = 'daily',
}) => {
  const [section, setSection] = useState<'daily' | 'growth'>(initialSection);

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const claimedCount = dailyTasks.filter((t) => t.claimed).length;
  const dailyReadyCount = dailyTasks.filter((t) => t.completed && !t.claimed).length;
  const noviceEval = evaluateAllNoviceDays(game, hasSharedRoom);
  const triggerClaimNoviceDay = handleClaimNoviceDay ?? onClaimNoviceDay;

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      <div className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setSection('daily')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            section === 'daily'
              ? 'bg-white text-[#D64470] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <CalendarHeart className="w-4 h-4" />
          <span>今日任務</span>
          {dailyReadyCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#FF5A87] text-white text-[10px] tabular-nums">
              {dailyReadyCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setSection('growth')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            section === 'growth'
              ? 'bg-white text-[#256D57] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>新手7天之路</span>
          {noviceEval.claimableCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-[#3BA886] text-white text-[10px] tabular-nums">
              {noviceEval.claimableCount}
            </span>
          )}
        </button>
      </div>

      {section === 'growth' ? (
        <NoviceGrowthView
          game={game}
          hasSharedRoom={hasSharedRoom}
          evaluation={noviceEval}
          onClaimDay={triggerClaimNoviceDay}
          onSelectBackground={onSelectBackground}
        />
      ) : (
        <>
          <section className="rounded-3xl bg-gradient-to-r from-[#FFF4D1] to-[#FFE9F0] border-2 border-[#F5DFD7] p-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#4A3531]">今日每日任務</h2>
              <p className="text-xs text-[#7D635D] mt-0.5 tabular-nums">
                日期 {dateStr} · 每日凌晨自動更新
              </p>
            </div>
            <div className="text-right tabular-nums">
              <span className="text-xl font-extrabold text-[#D64470]">
                {claimedCount} / {dailyTasks.length}
              </span>
              <p className="text-[11px] font-bold text-[#826862]">已領取</p>
            </div>
          </section>

          <div className="space-y-3">
            {dailyTasks.map((task) => {
              const current = Math.min(task.target, task.progress);
              const isReady = task.completed || current >= task.target;
              const isClaimed = task.claimed;
              const rewardFood = getFoodById(task.reward.foodId);
              const pct = Math.round((current / task.target) * 100);

              return (
                <article
                  key={task.id}
                  className={`rounded-3xl border-2 p-4 space-y-3 transition ${
                    isClaimed
                      ? 'bg-[#F7F3EE] border-[#E8DED8] opacity-85'
                      : isReady
                      ? 'bg-[#FFF5F8] border-[#FF8AA8]'
                      : 'bg-[#FFFDF8] border-[#F4DFD7]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-extrabold text-[#4A3531]">
                        {task.title}
                      </h3>
                      <p className="text-xs text-[#7D635D] mt-0.5 leading-relaxed">
                        {task.description}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#D64470] tabular-nums shrink-0">
                      {current} / {task.target}
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-[#F2E6DF] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#5CC9A7] transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="flex items-center gap-3 text-xs font-bold text-[#6E544E] tabular-nums">
                      <span className="inline-flex items-center gap-1 text-[#A46D0F]">
                        <Coins className="w-3.5 h-3.5" />
                        +{task.reward.coins} 金幣
                      </span>
                      {rewardFood && (
                        <span className="inline-flex items-center gap-1">
                          <span aria-hidden="true">{rewardFood.emoji}</span>
                          +{task.reward.foodQty} {rewardFood.name}
                        </span>
                      )}
                    </div>

                    {isClaimed ? (
                      <span className="min-h-[40px] px-3.5 rounded-2xl bg-[#E1EFEA] text-[#28735B] text-xs font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        已領取
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={!isReady}
                        onClick={() => onClaimTask(task.id)}
                        className={`min-h-[40px] px-4 rounded-2xl text-xs font-extrabold inline-flex items-center gap-1.5 transition ${
                          isReady
                            ? 'bg-[#FF7A9E] text-white shadow-[0_3px_0_#D9577B] hover:bg-[#F45D86] active:translate-y-0.5'
                            : 'bg-[#EFE6E2] text-[#A4938D] cursor-not-allowed'
                        }`}
                      >
                        <Gift className="w-4 h-4" />
                        <span>{isReady ? '領取獎勵' : '進行中'}</span>
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
