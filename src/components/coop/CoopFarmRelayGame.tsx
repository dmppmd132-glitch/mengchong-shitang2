import React, { useMemo, useState } from 'react';
import { Clock, ChefHat, HeartHandshake, Send, Sprout } from 'lucide-react';
import { FOODS } from '../../data/foods';
import {
  INGREDIENT_IDS,
  INGREDIENTS,
  KITCHEN_RECIPES,
} from '../../data/kitchen';
import {
  CoopRole,
  GameState,
  IngredientId,
  KitchenRecipe,
} from '../../types';

interface CoopFarmRelayGameProps {
  game: GameState;
  onPlantCrop: (
    plotId: number,
    ingredientId: IngredientId
  ) => { ok: boolean; error?: string; notice?: string };
  onHarvestCrop: (plotId: number) => { ok: boolean; error?: string; notice?: string };
  onDepositIngredient: (
    ingredientId: IngredientId
  ) => { ok: boolean; error?: string; notice?: string };
  onCookRecipe: (
    recipe: KitchenRecipe
  ) => { ok: boolean; error?: string; notice?: string };
  onShareCardToBoard?: (title: string, body: string) => Promise<string | null>;
}

export const CoopFarmRelayGame: React.FC<CoopFarmRelayGameProps> = ({
  game,
  onPlantCrop,
  onHarvestCrop,
  onDepositIngredient,
  onCookRecipe,
  onShareCardToBoard,
}) => {
  const [role, setRole] = useState<Extract<CoopRole, 'farmer' | 'chef'>>('farmer');
  const [selectedSeed, setSelectedSeed] = useState<IngredientId>('corn');
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(
    null
  );
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  // Tick every 500ms while any co-op farm plot is growing
  const hasGrowing = game.coop.coopFarmPlots.some((p) => p.cropId !== null);
  React.useEffect(() => {
    if (!hasGrowing) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 500);
    return () => window.clearInterval(timer);
  }, [hasGrowing]);

  const order = game.coop.dailyFarmOrder;
  const requiredFoodCounts = order.goal.requiredFoodCounts ?? {};

  const foodById = useMemo(() => {
    const map = new Map<string, (typeof FOODS)[number]>();
    for (const f of FOODS) map.set(f.id, f);
    return map;
  }, []);

  // Determine which ingredients are required for today's daily order recipes
  const neededIngredientSet = useMemo(() => {
    const set = new Set<IngredientId>();
    for (const foodId of Object.keys(requiredFoodCounts)) {
      const recipe = KITCHEN_RECIPES.find((r) => r.outputFoodId === foodId);
      if (recipe) {
        (Object.keys(recipe.ingredients) as IngredientId[]).forEach((ing) =>
          set.add(ing)
        );
      }
    }
    return set;
  }, [requiredFoodCounts]);

  const targetRecipes = useMemo(
    () =>
      KITCHEN_RECIPES.filter((r) => (requiredFoodCounts[r.outputFoodId] ?? 0) > 0),
    [requiredFoodCounts]
  );

  const otherRecipes = useMemo(
    () =>
      KITCHEN_RECIPES.filter((r) => (requiredFoodCounts[r.outputFoodId] ?? 0) === 0),
    [requiredFoodCounts]
  );

  const showToast = (res: { ok: boolean; error?: string; notice?: string }) => {
    if (res.ok && res.notice) {
      setFeedback({ kind: 'ok', text: res.notice });
    } else if (!res.ok && res.error) {
      setFeedback({ kind: 'err', text: res.error });
    }
  };

  const deadlineDate = new Date(order.expiresAt);
  const deadlineLabel = `${String(deadlineDate.getHours()).padStart(2, '0')}:${String(
    deadlineDate.getMinutes()
  ).padStart(2, '0')} 前`;

  return (
    <div className="space-y-3">
      {/* Daily Shared Farm Order Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#E7F8F1] via-[#FFF8E8] to-[#FFEAF2] border-2 border-[#BFE6D6] p-4 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#1F6B54]">
              <HeartHandshake className="w-4 h-4 shrink-0" />
              <span>每日農場訂單接力</span>
            </div>
            <h3 className="text-sm font-extrabold text-[#4A3531] mt-0.5">
              {order.goal.title}
            </h3>
          </div>
          <span
            className={`px-2 py-1 rounded-xl text-[10px] font-extrabold shrink-0 inline-flex items-center gap-1 ${
              order.completed
                ? 'bg-[#5CC9A7] text-white'
                : order.overdue
                ? 'bg-[#F5E6D8] text-[#7D635D]'
                : 'bg-white/90 text-[#9D5B12] border border-[#F2CE6D]'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>
              {order.completed
                ? '已完成'
                : order.overdue
                ? '已逾時（不扣資源）'
                : `期限 ${deadlineLabel}`}
            </span>
          </span>
        </div>

        <p className="text-[11px] text-[#6E544E] leading-snug">{order.goal.description}</p>

        {/* Progress Counters required by spec */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/90 border border-[#CFECE0] px-3 py-2">
            <div className="text-[10px] font-bold text-[#7D635D]">農夫收成進度</div>
            <div className="text-sm font-extrabold text-[#1F6B54] tabular-nums">
              已收成 {order.progress.harvestedCount} / {order.progress.harvestTarget}
            </div>
          </div>
          <div className="rounded-2xl bg-white/90 border border-[#F5CBD9] px-3 py-2">
            <div className="text-[10px] font-bold text-[#7D635D]">主廚合成進度</div>
            <div className="text-sm font-extrabold text-[#D64470] tabular-nums">
              已合成 {order.progress.craftedCount} / {order.progress.craftTarget}
            </div>
          </div>
        </div>

        {/* Per-food checklist */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(requiredFoodCounts).map(([foodId, reqQty]) => {
            const food = foodById.get(foodId);
            const doneQty = Math.min(reqQty, order.progress.foodsDone[foodId] ?? 0);
            const isFoodDone = doneQty >= reqQty;
            return (
              <span
                key={foodId}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold border tabular-nums ${
                  isFoodDone
                    ? 'bg-[#E3F7F0] border-[#9BE0C4] text-[#1F6B54]'
                    : 'bg-white border-[#EAD9D0] text-[#4A3531]'
                }`}
              >
                {food?.emoji ?? '🍽️'} {food?.name ?? foodId} {doneQty}/{reqQty}
              </span>
            );
          })}
        </div>
      </section>

      {/* Shared Warehouse Bar */}
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold text-[#4A3531]">🧺 共同食材倉庫</h4>
          <span className="text-[10px] font-bold text-[#7D635D]">
            農夫收成自動進庫 · 主廚隨時取用
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {INGREDIENT_IDS.map((ingId) => {
            const info = INGREDIENTS[ingId];
            const qty = game.coop.sharedWarehouse[ingId] ?? 0;
            const needed = neededIngredientSet.has(ingId);
            return (
              <div
                key={ingId}
                className={`rounded-xl px-2 py-1.5 border text-center ${
                  needed
                    ? 'bg-[#FFF8EB] border-[#F2CE6D]'
                    : 'bg-[#FAF5F0] border-[#EADCD4]'
                }`}
              >
                <div className="text-sm leading-none">{info.emoji}</div>
                <div className="text-[10px] font-bold text-[#5A423C] truncate mt-0.5">
                  {info.name}
                </div>
                <div className="text-xs font-extrabold text-[#1F6B54] tabular-nums">
                  ×{qty}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Role Switcher */}
      <div className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setRole('farmer')}
          className={`min-h-[44px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            role === 'farmer'
              ? 'bg-white text-[#1F6B54] shadow-xs'
              : 'text-[#6E544E]'
          }`}
        >
          <Sprout className="w-4 h-4" />
          <span>農夫種植收成</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('chef')}
          className={`min-h-[44px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            role === 'chef'
              ? 'bg-white text-[#D64470] shadow-xs'
              : 'text-[#6E544E]'
          }`}
        >
          <ChefHat className="w-4 h-4" />
          <span>主廚合作合成</span>
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

      {/* FARMER ROLE */}
      {role === 'farmer' && (
        <section className="space-y-3">
          {/* Seed Picker */}
          <div className="rounded-3xl bg-[#FFFDF8] border-2 border-[#CFECE0] p-3 space-y-2">
            <p className="text-xs font-extrabold text-[#1F6B54]">
              1. 選擇要種進接力農地的種子（⭐ 為今日訂單所需）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INGREDIENT_IDS.map((ingId) => {
                const info = INGREDIENTS[ingId];
                const isNeeded = neededIngredientSet.has(ingId);
                const isSelected = selectedSeed === ingId;
                return (
                  <button
                    key={ingId}
                    type="button"
                    onClick={() => setSelectedSeed(ingId)}
                    className={`min-h-[38px] px-2.5 rounded-xl border text-xs font-extrabold inline-flex items-center gap-1 transition ${
                      isSelected
                        ? 'bg-[#5CC9A7] text-white border-[#3BA886]'
                        : isNeeded
                        ? 'bg-[#FFF5DC] text-[#8A5610] border-[#F2CE6D]'
                        : 'bg-[#FAF5F0] text-[#5A423C] border-[#E7D8CE]'
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>
                      {isNeeded ? '⭐' : ''}
                      {info.name}
                    </span>
                    <span className="text-[10px] opacity-85">({info.seedCost}幣)</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4 Co-op Farm Plots */}
          <div className="grid grid-cols-2 gap-2.5">
            {game.coop.coopFarmPlots.map((plot, idx) => {
              const cropInfo = plot.cropId ? INGREDIENTS[plot.cropId] : null;
              const elapsed = plot.plantedAt ? nowMs - plot.plantedAt : 0;
              const isReady =
                cropInfo !== null && plot.plantedAt !== null && elapsed >= plot.durationMs;
              const remaining =
                cropInfo !== null && plot.plantedAt !== null
                  ? Math.max(0, Math.ceil((plot.durationMs - elapsed) / 1000))
                  : 0;
              const pct =
                cropInfo && plot.durationMs > 0
                  ? Math.min(100, Math.round((elapsed / plot.durationMs) * 100))
                  : 0;

              return (
                <button
                  key={plot.id}
                  type="button"
                  onClick={() => {
                    if (!plot.cropId) {
                      showToast(onPlantCrop(plot.id, selectedSeed));
                    } else if (isReady) {
                      showToast(onHarvestCrop(plot.id));
                    }
                  }}
                  className={`min-h-[96px] rounded-2xl border-2 p-3 flex flex-col items-center justify-center gap-1 transition active:scale-95 ${
                    !plot.cropId
                      ? 'bg-[#FFF8EB] border-dashed border-[#DFC19E] hover:bg-[#FFF2DA]'
                      : isReady
                      ? 'bg-[#E5F8F0] border-[#5CC9A7] ring-2 ring-[#5CC9A7]/30'
                      : 'bg-[#F8F3EC] border-[#E5D5C8]'
                  }`}
                >
                  {!cropInfo ? (
                    <>
                      <span className="text-xl">🌱</span>
                      <span className="text-xs font-extrabold text-[#7D635D]">
                        農地 #{idx + 1} · 點擊種「{INGREDIENTS[selectedSeed].name}」
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">{cropInfo.emoji}</span>
                      <span className="text-xs font-extrabold text-[#4A3531]">
                        {cropInfo.name}
                      </span>
                      {isReady ? (
                        <span className="px-2 py-0.5 rounded-lg bg-[#3BA886] text-white text-[10px] font-extrabold">
                          點擊採收進共同倉庫！
                        </span>
                      ) : (
                        <>
                          <span className="text-[10px] font-bold text-[#8A5610] tabular-nums">
                            成長中 {remaining}s
                          </span>
                          <div className="w-full h-1.5 rounded-full bg-[#E8DCD2] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[#5CC9A7]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Optional Support from Personal Inventory */}
          <div className="rounded-3xl bg-[#FFFDF8] border-2 border-[#EFE0D8] p-3 space-y-2">
            <p className="text-xs font-extrabold text-[#4A3531]">
              📦 從個人小倉庫支援食材進共同倉庫（每次 +1）
            </p>
            <div className="flex flex-wrap gap-1.5">
              {INGREDIENT_IDS.map((ingId) => {
                const info = INGREDIENTS[ingId];
                const personalQty = game.ingredients[ingId] ?? 0;
                return (
                  <button
                    key={ingId}
                    type="button"
                    disabled={personalQty <= 0}
                    onClick={() => showToast(onDepositIngredient(ingId))}
                    className={`min-h-[36px] px-2.5 rounded-xl border text-[11px] font-extrabold inline-flex items-center gap-1 transition ${
                      personalQty > 0
                        ? 'bg-[#EEF8F4] border-[#B2E3CF] text-[#1F6B54] active:scale-95'
                        : 'bg-[#F4EEEA] border-[#E4D8D0] text-[#A89690] cursor-not-allowed'
                    }`}
                  >
                    <span>{info.emoji}</span>
                    <span>{info.name}</span>
                    <span className="tabular-nums">({personalQty})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* CHEF ROLE */}
      {role === 'chef' && (
        <section className="space-y-2.5">
          <p className="text-xs font-extrabold text-[#B83B64] px-1">
            🍳 今日訂單指定料理（消耗「共同倉庫」食材合成）
          </p>

          {targetRecipes.map((recipe) => {
            const reqEntries = Object.entries(recipe.ingredients) as [
              IngredientId,
              number,
            ][];
            const canCook = reqEntries.every(
              ([id, need]) => (game.coop.sharedWarehouse[id] ?? 0) >= need
            );
            const targetQty = requiredFoodCounts[recipe.outputFoodId] ?? 0;
            const doneQty = Math.min(
              targetQty,
              order.progress.foodsDone[recipe.outputFoodId] ?? 0
            );

            return (
              <article
                key={recipe.id}
                className="rounded-3xl bg-[#FFFDF8] border-2 border-[#FAD5E0] p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-3xl leading-none">{recipe.emoji}</span>
                    <div className="min-w-0">
                      <h4 className="text-sm font-extrabold text-[#4A3531] truncate">
                        {recipe.name}
                      </h4>
                      <p className="text-[11px] font-bold text-[#D64470] tabular-nums">
                        訂單進度：{doneQty} / {targetQty} 份
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canCook}
                    onClick={() => showToast(onCookRecipe(recipe))}
                    className={`min-h-[44px] px-4 rounded-2xl text-xs font-extrabold shrink-0 transition ${
                      canCook
                        ? 'bg-[#FF7A9E] text-white shadow-[0_2px_0_#D9577B] active:scale-95'
                        : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                    }`}
                  >
                    合成料理
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {reqEntries.map(([id, need]) => {
                    const info = INGREDIENTS[id];
                    const have = game.coop.sharedWarehouse[id] ?? 0;
                    const enough = have >= need;
                    return (
                      <span
                        key={id}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border tabular-nums ${
                          enough
                            ? 'bg-[#E5F8F0] border-[#AEE3D0] text-[#1F6B54]'
                            : 'bg-[#FFF5F7] border-[#F4CBD7] text-[#B83B64]'
                        }`}
                      >
                        {info.emoji} {info.name} {have}/{need}
                      </span>
                    );
                  })}
                </div>
              </article>
            );
          })}

          {otherRecipes.length > 0 && (
            <details className="rounded-2xl bg-[#FAF4EF] border border-[#E7D8CE] p-3">
              <summary className="text-xs font-extrabold text-[#6E544E] cursor-pointer">
                查看其他可協助合成的廚房食譜 ({otherRecipes.length})
              </summary>
              <div className="mt-2.5 space-y-2">
                {otherRecipes.map((recipe) => {
                  const reqEntries = Object.entries(recipe.ingredients) as [
                    IngredientId,
                    number,
                  ][];
                  const canCook = reqEntries.every(
                    ([id, need]) => (game.coop.sharedWarehouse[id] ?? 0) >= need
                  );
                  return (
                    <div
                      key={recipe.id}
                      className="rounded-2xl bg-white border border-[#EAD9D0] p-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-[#4A3531] truncate">
                          {recipe.emoji} {recipe.name}
                        </div>
                        <div className="text-[10px] text-[#7D635D] tabular-nums">
                          {reqEntries
                            .map(
                              ([id, need]) =>
                                `${INGREDIENTS[id].name} ${
                                  game.coop.sharedWarehouse[id] ?? 0
                                }/${need}`
                            )
                            .join(' · ')}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!canCook}
                        onClick={() => showToast(onCookRecipe(recipe))}
                        className={`min-h-[38px] px-3 rounded-xl text-xs font-extrabold shrink-0 ${
                          canCook
                            ? 'bg-[#5CC9A7] text-white'
                            : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                        }`}
                      >
                        合成
                      </button>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </section>
      )}

      {/* Exclusive Message Cards Gallery */}
      {game.coop.earnedCards.length > 0 && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F3DCAB] p-3.5 space-y-2">
          <h4 className="text-xs font-extrabold text-[#9D5B12]">
            💌 已解鎖限定合作留言卡（{game.coop.earnedCards.length}）
          </h4>
          <div className="space-y-2">
            {game.coop.earnedCards.slice(0, 4).map((card) => (
              <div
                key={card.id}
                className="rounded-2xl bg-[#FFF8EB] border border-[#F2D59B] p-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-[#4A3531]">
                    {card.emoji} {card.title}
                  </span>
                  <span className="text-[10px] font-bold text-[#8A5610] tabular-nums">
                    {card.earnedDate}
                  </span>
                </div>
                <p className="text-[11px] text-[#6E544E] leading-snug">{card.body}</p>
                {onShareCardToBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      void onShareCardToBoard(card.title, card.body).then((err) => {
                        setFeedback(
                          err
                            ? { kind: 'err', text: err }
                            : { kind: 'ok', text: `已將「${card.title}」分享到留言板！` }
                        );
                      });
                    }}
                    className="min-h-[34px] px-3 rounded-xl bg-white border border-[#F2CE6D] text-[11px] font-extrabold text-[#8A5610] inline-flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>傳送到留言板</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
