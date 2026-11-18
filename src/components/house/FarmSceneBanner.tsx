import React from 'react';
import { Pencil } from 'lucide-react';
import { STORAGE_CAPS_BY_LEVEL } from '../../data/house';
import { INGREDIENTS } from '../../data/kitchen';
import { CropPlot, SharedHouse } from '../../types';

interface FarmSceneBannerProps {
  house: SharedHouse;
  farmPlots: CropPlot[];
  onEditHouseName: () => void;
}

export const FarmSceneBanner: React.FC<FarmSceneBannerProps> = ({
  house,
  farmPlots,
  onEditHouseName,
}) => {
  const { fenceId, flowerbedId, signId } = house.activeFarmDecor;
  const hasSprinkler = house.farmUpgrades.sprinklerLevel > 0;
  const hasGreenhouse = house.farmUpgrades.greenhouseLevel > 0;
  const storageCap = STORAGE_CAPS_BY_LEVEL[house.farmUpgrades.storageLevel] ?? 15;

  const isWhiteFence = fenceId === 'white_picket_fence';
  const hasAnyFence = fenceId !== null;
  const isLavender = flowerbedId === 'lavender_flowerbed';
  const hasFlowerbed = flowerbedId !== null;
  const isBerrySign = signId === 'berry_arch_sign';

  return (
    <section
      aria-label="開心農場實景預覽"
      className={`relative rounded-3xl border-2 overflow-hidden transition-colors ${
        hasGreenhouse
          ? 'bg-gradient-to-b from-[#E5F7FF] via-[#EEFCF5] to-[#DCF2E2] border-[#9AD8C3]'
          : 'bg-gradient-to-b from-[#FFF7DF] via-[#F2FBE8] to-[#DCF1D8] border-[#CFE6C7]'
      }`}
    >
      {/* Glass Greenhouse Roof Overlay */}
      {hasGreenhouse && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-14 border-b border-white/80"
          style={{
            background:
              'repeating-linear-gradient(90deg, rgba(255,255,255,0.42) 0px, rgba(255,255,255,0.42) 34px, rgba(145,214,229,0.28) 34px, rgba(145,214,229,0.28) 36px)',
          }}
        />
      )}

      <div className="relative p-3.5 space-y-2.5">
        {/* Top Row: Editable Farm Signboard + Barn / Upgrades status */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEditHouseName}
            className={`min-h-[44px] px-3 py-1.5 rounded-2xl border-2 text-left inline-flex items-center gap-2 max-w-[68%] transition active:scale-95 ${
              isBerrySign
                ? 'bg-[#FFEAF2] border-[#F2A7C2] text-[#A22E58]'
                : 'bg-[#FFF3DC] border-[#D8A66E] text-[#5C3919]'
            }`}
          >
            <span className="text-lg shrink-0" aria-hidden="true">
              {isBerrySign ? '🌸' : '🪧'}
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-bold opacity-80 leading-none">
                {signId ? '專屬農場招牌' : '小屋招牌'}
              </div>
              <div className="text-xs font-extrabold truncate mt-0.5">{house.houseName}</div>
            </div>
            <Pencil className="w-3.5 h-3.5 shrink-0 opacity-75" />
          </button>

          {/* Storage Barn Mini Widget */}
          <div className="rounded-2xl bg-white/85 border border-[#E4D1C5] px-2.5 py-1.5 text-right shrink-0">
            <div className="text-[10px] font-bold text-[#7D635D]">
              🏚️ 小倉庫 Lv.{house.farmUpgrades.storageLevel + 1}
            </div>
            <div className="text-xs font-extrabold text-[#4A3531] tabular-nums">
              上限 {storageCap}/種
            </div>
          </div>
        </div>

        {/* Visual Illustrated Farm Plot Strip */}
        <div className="relative rounded-2xl bg-[#E9F5DA]/85 border border-[#C7DFB8] p-2.5 space-y-2">
          {/* Active Facility Badges Row */}
          {(hasSprinkler || hasGreenhouse || hasFlowerbed || hasAnyFence) && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-extrabold">
              {hasSprinkler && (
                <span className="px-2 py-0.5 rounded-lg bg-[#E4F6FF] border border-[#A5DCF5] text-[#17688F] inline-flex items-center gap-1">
                  <span className="animate-pulse">💧</span> 灑水器運轉中 (-30%時間)
                </span>
              )}
              {hasGreenhouse && (
                <span className="px-2 py-0.5 rounded-lg bg-[#E5FAF0] border border-[#9BE0C4] text-[#1F6B54]">
                  🏡 玻璃溫室 (+1收成)
                </span>
              )}
              {hasFlowerbed && (
                <span className="px-2 py-0.5 rounded-lg bg-[#FFF4DC] border border-[#F2D59B] text-[#8A5A12]">
                  {isLavender ? '🪻 薰衣草花圃' : '🌼 雛菊花圃'}
                </span>
              )}
              {hasAnyFence && (
                <span className="px-2 py-0.5 rounded-lg bg-[#FFF9F2] border border-[#E4CFC2] text-[#6E544E]">
                  {isWhiteFence ? '🤍 奶油白柵欄' : '🪵 暖木圍欄'}
                </span>
              )}
            </div>
          )}

          {/* Fence Top SVG */}
          {hasAnyFence && (
            <div className="w-full h-4 flex items-end gap-1 overflow-hidden" aria-hidden="true">
              {Array.from({ length: 14 }, (_, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-3.5 rounded-t-md border ${
                    isWhiteFence
                      ? 'bg-white border-[#DFD8D3]'
                      : 'bg-[#D29A67] border-[#A77142]'
                  }`}
                />
              ))}
            </div>
          )}

          {/* 4..8 Plot Visual Grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {farmPlots.map((plot) => {
              const crop = plot.cropId ? INGREDIENTS[plot.cropId] : null;
              return (
                <div
                  key={plot.id}
                  className={`h-11 rounded-xl border-2 flex flex-col items-center justify-center relative ${
                    crop
                      ? 'bg-[#C78F60]/25 border-[#B57B4C]'
                      : 'bg-[#BA8254]/18 border-[#CBB097]'
                  }`}
                >
                  {hasSprinkler && plot.id % 2 === 0 && (
                    <span
                      className="absolute right-0.5 top-0.5 text-[9px] opacity-85"
                      aria-hidden="true"
                    >
                      💧
                    </span>
                  )}
                  <span className="text-base leading-none" aria-hidden="true">
                    {crop ? crop.emoji : '🟫'}
                  </span>
                  <span className="text-[9px] font-bold text-[#5A3E36] mt-0.5">
                    #{plot.id + 1}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Flowerbed Strip */}
          {hasFlowerbed && (
            <div
              className={`rounded-xl px-2 py-1 flex items-center justify-around text-xs border ${
                isLavender
                  ? 'bg-[#F3EAFF] border-[#D8C2F7]'
                  : 'bg-[#FFF8DE] border-[#F2DB96]'
              }`}
              aria-hidden="true"
            >
              <span>{isLavender ? '🪻' : '🌼'}</span>
              <span>🌱</span>
              <span>{isLavender ? '🪻' : '🌼'}</span>
              <span>🦋</span>
              <span>{isLavender ? '🪻' : '🌼'}</span>
              <span>🌱</span>
              <span>{isLavender ? '🪻' : '🌼'}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
