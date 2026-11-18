import React, { useEffect, useMemo, useState } from 'react';
import { Check, Clock, Play, Sparkles } from 'lucide-react';
import { COOP_ROOM_THEMES } from '../../data/coop';
import {
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEM_BY_ID,
  ROOM_ZONES,
  WALLPAPER_BY_ID,
  FLOORING_BY_ID,
  getZoneForCell,
} from '../../data/house';
import { CoopRole, GameState, PlacedRoomItem, ThemeSetId } from '../../types';
import { FurnitureGraphic } from '../house/FurnitureGraphic';

interface CoopRoomDecorGameProps {
  game: GameState;
  actorUserId: string;
  actorName: string;
  onStartSession: (themeId?: ThemeSetId) => void;
  onSelectFurniture: (itemId: string) => { ok: boolean; error?: string; notice?: string };
  onPlaceCandidate: (
    queueId: string,
    x: number,
    y: number
  ) => { ok: boolean; error?: string; notice?: string };
  onSettleSession: () => { ok: boolean; error?: string; notice?: string };
}

export const CoopRoomDecorGame: React.FC<CoopRoomDecorGameProps> = ({
  game,
  onStartSession,
  onSelectFurniture,
  onPlaceCandidate,
  onSettleSession,
}) => {
  const [role, setRole] = useState<Extract<CoopRole, 'selector' | 'placer'>>('selector');
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );

  const session = game.coop.activeRoomSession;
  const activeTheme = useMemo(
    () =>
      COOP_ROOM_THEMES.find((t) => t.themeId === session?.themeId) ??
      COOP_ROOM_THEMES[0],
    [session?.themeId]
  );

  // Live 1s countdown ticker while session is active
  useEffect(() => {
    if (!session || session.status !== 'active') return;
    setNowMs(Date.now());
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, [session]);

  const remainingSec = session
    ? Math.max(0, Math.ceil((session.expiresAt - nowMs) / 1000))
    : 0;

  // Auto settle when timer runs out while active
  useEffect(() => {
    if (session && session.status === 'active' && !session.settled && remainingSec <= 0) {
      onSettleSession();
    }
  }, [session, remainingSec, onSettleSession]);

  const pendingQueue = useMemo(
    () => (session ? session.candidateQueue.filter((c) => !c.placed) : []),
    [session]
  );

  // Keep a valid candidate selected automatically for one-hand mobile placement
  useEffect(() => {
    if (pendingQueue.length === 0) {
      setSelectedQueueId(null);
      return;
    }
    if (!selectedQueueId || !pendingQueue.some((c) => c.queueId === selectedQueueId)) {
      setSelectedQueueId(pendingQueue[0].queueId);
    }
  }, [pendingQueue, selectedQueueId]);

  const selectedCandidate = useMemo(
    () => pendingQueue.find((c) => c.queueId === selectedQueueId) ?? null,
    [pendingQueue, selectedQueueId]
  );
  const selectedCandidateDef = selectedCandidate
    ? ROOM_ITEM_BY_ID[selectedCandidate.itemId] ?? null
    : null;

  const placedCellMap = useMemo(() => {
    const map = new Map<string, PlacedRoomItem>();
    for (const p of game.house.roomLayout.placedItems) {
      map.set(`${p.x}_${p.y}`, p);
    }
    return map;
  }, [game.house.roomLayout.placedItems]);

  const wallDef =
    WALLPAPER_BY_ID[game.house.roomLayout.wallpaperId] ?? WALLPAPER_BY_ID.cream_warm;
  const floorDef =
    FLOORING_BY_ID[game.house.roomLayout.flooringId] ?? FLOORING_BY_ID.oak_wood;

  const showToast = (res: { ok: boolean; error?: string; notice?: string }) => {
    if (res.ok && res.notice) {
      setFeedback({ kind: 'ok', text: res.notice });
    } else if (!res.ok && res.error) {
      setFeedback({ kind: 'err', text: res.error });
    }
  };

  const progressPct = session
    ? Math.min(
        100,
        Math.round((session.progress.completedCount / session.progress.targetCount) * 100)
      )
    : 0;

  return (
    <div className="space-y-3">
      {/* Start / Theme Selection when no active session or finished */}
      {(!session || session.settled) && (
        <section className="rounded-3xl bg-gradient-to-br from-[#FFEAF2] via-[#FFF8E8] to-[#E8F8F2] border-2 border-[#F4DFD7] p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-[#4A3531]">
              🏡 一起布置房間（90 秒雙人合作）
            </h3>
            <p className="text-xs text-[#6E544E] leading-relaxed">
              一人擔任「挑選家具」，把符合主題的家具送進候選清單；另一人擔任「擺放家具」，將清單裡的家具放到正確區域！時間結束就算未全滿也不扣任何資源，擺好的家具都會留在小屋裡。
            </p>
          </div>

          {session && session.settled && (
            <div className="rounded-2xl bg-white/90 border border-[#CFECE0] p-3 space-y-1">
              <div className="text-xs font-extrabold text-[#1F6B54]">
                ✨ 上一回合結果：已完成 {session.progress.completedCount} /{' '}
                {session.progress.targetCount} 件家具
              </div>
              <p className="text-[11px] text-[#6E544E]">
                {session.progress.completedCount >= session.progress.targetCount
                  ? '完美達成目標！兩人已獲得相同獎勵，可至上方領取！'
                  : '已擺放的家具皆完整保留於小屋中，依完成度發放獎勵囉！'}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              onStartSession();
            }}
            className="w-full min-h-[48px] rounded-2xl bg-[#FF7A9E] text-white text-sm font-extrabold shadow-[0_3px_0_#D9577B] hover:bg-[#F56990] active:translate-y-0.5 transition inline-flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            <span>隨機抽主題 · 開始 90 秒挑戰</span>
          </button>

          <div className="grid grid-cols-3 gap-1.5">
            {COOP_ROOM_THEMES.map((t) => (
              <button
                key={t.themeId}
                type="button"
                onClick={() => {
                  setFeedback(null);
                  onStartSession(t.themeId);
                }}
                className="min-h-[44px] rounded-xl bg-white/85 border border-[#EAD4CC] px-2 py-1.5 text-[11px] font-extrabold text-[#4A3531] hover:bg-white active:scale-95 transition"
              >
                {t.emoji} {t.name.slice(0, 4)}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Active Session Playboard */}
      {session && !session.settled && (
        <>
          {/* Theme, Timer & Shared Progress Card */}
          <section className={`rounded-3xl border-2 p-3.5 space-y-2.5 ${activeTheme.badgeClass}`}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-extrabold truncate">
                  {activeTheme.emoji} {activeTheme.name}
                </div>
                <p className="text-[11px] opacity-85 truncate">{activeTheme.description}</p>
              </div>
              <div
                className={`min-h-[38px] px-2.5 rounded-xl bg-white/95 border flex items-center gap-1 text-sm font-extrabold tabular-nums shrink-0 ${
                  remainingSec <= 15
                    ? 'border-[#FF6F91] text-[#D64470] animate-pulse'
                    : 'border-[#E6D5CD] text-[#4A3531]'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{remainingSec}s</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span>兩人共同進度</span>
                <span className="tabular-nums">
                  已完成 {session.progress.completedCount} / {session.progress.targetCount} 件家具
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/75 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF7A9E] to-[#5CC9A7] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {session.status === 'expired' && (
              <button
                type="button"
                onClick={() => showToast(onSettleSession())}
                className="w-full min-h-[44px] rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold"
              >
                時間結束 · 點擊結算本回合獎勵
              </button>
            )}
          </section>

          {/* One-hand Role Switcher */}
          <div className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => setRole('selector')}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold transition ${
                role === 'selector'
                  ? 'bg-white text-[#D64470] shadow-xs'
                  : 'text-[#6E544E]'
              }`}
            >
              🛍️ 挑選家具（候選 {pendingQueue.length}）
            </button>
            <button
              type="button"
              onClick={() => setRole('placer')}
              className={`min-h-[44px] rounded-xl text-xs font-extrabold transition ${
                role === 'placer'
                  ? 'bg-white text-[#1F6B54] shadow-xs'
                  : 'text-[#6E544E]'
              }`}
            >
              📍 擺放家具（進房間）
            </button>
          </div>

          {feedback && (
            <div
              className={`rounded-2xl px-3 py-2 text-xs font-extrabold border ${
                feedback.kind === 'ok'
                  ? 'bg-[#E5F8F0] border-[#AEE3D0] text-[#1F6B54]'
                  : 'bg-[#FFE9EF] border-[#F5B4C6] text-[#B83B64]'
              }`}
            >
              {feedback.text}
            </div>
          )}

          {/* ROLE 1: SELECTOR (picks theme items -> instant shared candidateQueue) */}
          {role === 'selector' && (
            <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-[#4A3531]">
                  挑選符合「{activeTheme.name}」的家具
                </h4>
                <span className="text-[11px] font-bold text-[#7D635D]">
                  點擊送入夥伴清單
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {activeTheme.eligibleItemIds.map((itemId) => {
                  const def = ROOM_ITEM_BY_ID[itemId];
                  if (!def) return null;
                  const zoneMeta = ROOM_ZONES[def.zone];
                  const inQueueCount = pendingQueue.filter((c) => c.itemId === itemId).length;
                  return (
                    <button
                      key={itemId}
                      type="button"
                      onClick={() => showToast(onSelectFurniture(itemId))}
                      className="min-h-[76px] rounded-2xl bg-[#FFF9F2] border-2 border-[#EADAD0] p-2.5 flex items-center gap-2 text-left hover:border-[#FF8AA8] active:scale-95 transition"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#F0DFD5] flex items-center justify-center shrink-0">
                        <FurnitureGraphic itemId={itemId} size={34} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-extrabold text-[#4A3531] truncate">
                          {def.name}
                        </div>
                        <div className="text-[10px] font-bold text-[#7D635D]">
                          {zoneMeta.emoji} {zoneMeta.name}
                        </div>
                        {inQueueCount > 0 && (
                          <div className="text-[10px] font-extrabold text-[#D64470]">
                            待擺放 ×{inQueueCount}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ROLE 2: PLACER (picks from shared candidateQueue -> taps matching zone cell) */}
          {role === 'placer' && (
            <section className="space-y-3">
              <div className="rounded-3xl bg-[#FFFDF8] border-2 border-[#BCE6D5] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-[#1F6B54]">
                    夥伴挑選的候選家具（{pendingQueue.length} 件待擺放）
                  </h4>
                  {selectedCandidateDef && (
                    <span className="text-[11px] font-extrabold text-[#B83B64]">
                      目標：{ROOM_ZONES[selectedCandidateDef.zone].emoji}{' '}
                      {ROOM_ZONES[selectedCandidateDef.zone].name}
                    </span>
                  )}
                </div>

                {pendingQueue.length === 0 ? (
                  <div className="rounded-2xl bg-[#F6FBF9] border border-[#D4ECE2] p-3 text-center space-y-2">
                    <p className="text-xs text-[#6E544E]">
                      候選清單目前是空的，等夥伴挑選家具，或你也能切換到「挑選家具」代班挑選喔！
                    </p>
                    <button
                      type="button"
                      onClick={() => setRole('selector')}
                      className="min-h-[40px] px-4 rounded-xl bg-[#FF7A9E] text-white text-xs font-extrabold"
                    >
                      去挑選家具
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {pendingQueue.map((c) => {
                      const def = ROOM_ITEM_BY_ID[c.itemId];
                      if (!def) return null;
                      const isSel = c.queueId === selectedQueueId;
                      return (
                        <button
                          key={c.queueId}
                          type="button"
                          onClick={() => setSelectedQueueId(c.queueId)}
                          className={`min-w-[84px] min-h-[74px] rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 shrink-0 transition ${
                            isSel
                              ? 'bg-[#FFEAF0] border-[#FF5C8A] ring-2 ring-[#FF8AA8]/35'
                              : 'bg-white border-[#EAD9D0]'
                          }`}
                        >
                          <FurnitureGraphic itemId={def.id} size={28} />
                          <span className="text-[11px] font-extrabold text-[#4A3531] truncate max-w-[74px]">
                            {def.name}
                          </span>
                          <span className="text-[9px] font-bold text-[#7D635D] truncate max-w-[74px]">
                            {ROOM_ZONES[def.zone].emoji} {c.selectedByName}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Room Placement 6x4 Grid */}
              <div className="rounded-3xl border-2 border-[#EED8CE] overflow-hidden">
                <div
                  className="px-3 py-1.5 border-b border-[#EAD2C5] text-[10px] font-extrabold text-[#5A423C]"
                  style={{ background: wallDef.wallBgStyle }}
                >
                  {selectedCandidateDef
                    ? `請點選下方亮起虛線的「${ROOM_ZONES[selectedCandidateDef.zone].name}」空格擺放「${selectedCandidateDef.name}」`
                    : '先在上方選擇一件候選家具，再點房間空格擺放'}
                </div>

                <div className="grid grid-cols-2 text-[10px] font-extrabold bg-[#FFF8F2] border-b border-[#EFE0D7]">
                  <div className="px-2 py-1 border-r border-[#EFE0D7] flex justify-between text-[#5C459E]">
                    <span>🌙 睡眠 (左上)</span>
                    <span>🎀 裝飾 (右上)</span>
                  </div>
                  <div className="px-2 py-1 flex justify-between text-[#1F6B54]">
                    <span>⚽ 遊玩 (左下)</span>
                    <span>🍽️ 用餐 (右下)</span>
                  </div>
                </div>

                <div className="p-2" style={{ background: floorDef.floorBgStyle }}>
                  <div className="grid grid-cols-6 gap-1">
                    {Array.from({ length: ROOM_GRID_ROWS * ROOM_GRID_COLS }, (_, idx) => {
                      const x = idx % ROOM_GRID_COLS;
                      const y = Math.floor(idx / ROOM_GRID_COLS);
                      const zone = getZoneForCell(x, y);
                      const zoneMeta = ROOM_ZONES[zone];
                      const occupant = placedCellMap.get(`${x}_${y}`) ?? null;
                      const isMatchingTarget =
                        !occupant &&
                        selectedCandidateDef !== null &&
                        selectedCandidateDef.zone === zone;

                      return (
                        <button
                          key={`${x}_${y}`}
                          type="button"
                          onClick={() => {
                            if (!selectedCandidate) {
                              setFeedback({
                                kind: 'err',
                                text: '請先點選上方一件候選家具！',
                              });
                              return;
                            }
                            showToast(onPlaceCandidate(selectedCandidate.queueId, x, y));
                          }}
                          aria-label={`${zoneMeta.name} 格子 (${x + 1},${y + 1})`}
                          className={`min-h-[46px] rounded-xl border flex items-center justify-center transition active:scale-95 ${
                            occupant
                              ? 'bg-white/75 border-[#E2C9BE]'
                              : isMatchingTarget
                              ? 'bg-[#E6FAF2]/90 border-2 border-dashed border-[#3BA886] hover:bg-[#D2F4E6]'
                              : `${zoneMeta.cellTintClass} border-white/55 opacity-75`
                          }`}
                        >
                          {occupant ? (
                            <FurnitureGraphic itemId={occupant.itemId} size={28} />
                          ) : isMatchingTarget ? (
                            <Check className="w-3.5 h-3.5 text-[#1F6B54]" />
                          ) : (
                            <span className="text-[10px] opacity-45">{zoneMeta.emoji}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
