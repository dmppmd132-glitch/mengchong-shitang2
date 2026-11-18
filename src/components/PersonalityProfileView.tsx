import React from 'react';
import { Heart, Sparkles, ThumbsDown, X } from 'lucide-react';
import { FOODS } from '../data/foods';
import { ROOM_ITEM_BY_ID } from '../data/house';
import {
  PERSONALITY_DEFINITIONS,
  PERSONALITY_IDS,
} from '../data/personality';
import { getPetSpeciesInfo } from '../data/species';
import { TOY_BY_ID } from '../data/toys';
import { Pet, PetPersonality } from '../types';
import { getPetPreference } from '../utils/personality';
import { FurnitureGraphic } from './house/FurnitureGraphic';

interface PersonalityProfileViewProps {
  pet: Pet;
  personality: PetPersonality;
}

export const PersonalityProfileView: React.FC<PersonalityProfileViewProps> = ({
  pet,
  personality,
}) => {
  const speciesInfo = getPetSpeciesInfo(pet.species);
  const primaryDef = PERSONALITY_DEFINITIONS[personality.primary];
  const secondaryDef = PERSONALITY_DEFINITIONS[personality.secondary];
  const pref = getPetPreference(pet.species);

  const foodById = React.useMemo(() => {
    const map = new Map<string, (typeof FOODS)[number]>();
    for (const f of FOODS) {
      map.set(f.id, f);
    }
    return map;
  }, []);

  const maxScore = Math.max(
    40,
    ...PERSONALITY_IDS.map((id) => personality.scores[id] ?? 0)
  );

  return (
    <div className="space-y-4">
      {/* Primary & Secondary Personality Header */}
      <section className="rounded-3xl bg-gradient-to-br from-[#FFF3D8] via-[#FFEAF2] to-[#E8F8F2] border-2 border-[#F4DFD7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-extrabold text-[#9D5B12]">
              {pet.name}（{speciesInfo.label}）的個性檔案
            </p>
            <h2 className="text-base font-extrabold text-[#4A3531] mt-0.5">
              {primaryDef.emoji} {primaryDef.label} ＋ {secondaryDef.emoji} {secondaryDef.label}
            </h2>
          </div>
          <Sparkles className="w-6 h-6 text-[#D64470] shrink-0" />
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <article className={`rounded-2xl border-2 p-3 ${primaryDef.badgeClass}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">
                ⭐ 主要個性：{primaryDef.emoji} {primaryDef.label}
              </span>
              <span className="text-[11px] font-extrabold tabular-nums">
                契合度 {personality.scores[personality.primary] ?? 0}
              </span>
            </div>
            <p className="text-xs font-bold mt-1">{primaryDef.tagline}</p>
            <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
              {primaryDef.description}
            </p>
          </article>

          <article className={`rounded-2xl border-2 p-3 ${secondaryDef.badgeClass}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold">
                ✨ 次要個性：{secondaryDef.emoji} {secondaryDef.label}
              </span>
              <span className="text-[11px] font-extrabold tabular-nums">
                契合度 {personality.scores[personality.secondary] ?? 0}
              </span>
            </div>
            <p className="text-xs font-bold mt-1">{secondaryDef.tagline}</p>
            <p className="text-[11px] opacity-85 mt-0.5 leading-relaxed">
              {secondaryDef.description}
            </p>
          </article>
        </div>
      </section>

      {/* Personality Development Meter (8 traits) */}
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 space-y-3">
        <div>
          <h3 className="text-sm font-extrabold text-[#4A3531]">八大個性養成傾向</h3>
          <p className="text-[11px] text-[#7D635D] mt-0.5">
            日常照顧習慣會溫柔且緩慢地影響個性成長（每 2 次互動累積一次微幅成長，不會突然劇變喔！）
          </p>
        </div>

        <div className="space-y-2.5">
          {PERSONALITY_IDS.map((id) => {
            const def = PERSONALITY_DEFINITIONS[id];
            const score = personality.scores[id] ?? 0;
            const pct = Math.min(100, Math.round((score / maxScore) * 100));
            const isPrimary = personality.primary === id;
            const isSecondary = personality.secondary === id;

            return (
              <div key={id} className="space-y-1">
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-extrabold text-[#4A3531]">
                      {def.emoji} {def.label}
                    </span>
                    {isPrimary && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#FFEAF0] text-[#D64470] text-[10px] font-extrabold">
                        主要
                      </span>
                    )}
                    {isSecondary && (
                      <span className="px-1.5 py-0.5 rounded-md bg-[#E8F8F2] text-[#1F6B54] text-[10px] font-extrabold">
                        次要
                      </span>
                    )}
                    <span className="text-[10px] text-[#8A716B] truncate">
                      · {def.careHint}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-[#6E544E] tabular-nums shrink-0">
                    {score}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F5EAE3] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${def.barColorClass} transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Likes Section */}
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#FAD5E0] p-4 space-y-3">
        <div className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 fill-[#FF7A9E] text-[#FF7A9E]" />
          <h3 className="text-sm font-extrabold text-[#4A3531]">最喜歡的事物</h3>
        </div>

        {/* Favorite Foods */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#B83B64]">🍽️ 最愛食物（餵食會冒出星星眼與跳躍歡呼！）</p>
          <div className="grid grid-cols-2 gap-2">
            {pref.favoriteFoodIds.map((fId) => {
              const food = foodById.get(fId);
              if (!food) return null;
              return (
                <div
                  key={fId}
                  className="rounded-2xl bg-[#FFF5F8] border border-[#F5CBD9] p-2.5 flex items-center gap-2"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {food.emoji}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#4A3531] truncate">
                      {food.name}
                    </div>
                    <div className="text-[10px] text-[#B83B64] font-bold">心情與成長加成</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Toys */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#256D57]">🧸 最愛玩具（放進遊玩區會主動跑去互動）</p>
          <div className="grid grid-cols-2 gap-2">
            {pref.favoriteToyIds.map((tId) => {
              const toy = TOY_BY_ID[tId];
              if (!toy) return null;
              return (
                <div
                  key={tId}
                  className="rounded-2xl bg-[#EEF9F5] border border-[#BEE5D6] p-2.5 flex items-center gap-2"
                >
                  <FurnitureGraphic itemId={toy.id} size={32} />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-[#4A3531] truncate">
                      {toy.name}
                    </div>
                    <div className="text-[10px] text-[#256D57] font-bold">專屬氣泡＋跳躍</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Room Furniture */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#9D5B12]">🏡 最愛房間家具</p>
          <div className="grid grid-cols-2 gap-2">
            {pref.favoriteFurnitureIds.map((itemId) => {
              const item = ROOM_ITEM_BY_ID[itemId];
              if (!item) return null;
              return (
                <div
                  key={itemId}
                  className="rounded-2xl bg-[#FFF8EB] border border-[#F3DCAB] p-2.5 flex items-center gap-2"
                >
                  <FurnitureGraphic itemId={item.id} size={32} />
                  <span className="text-xs font-extrabold text-[#4A3531] truncate">
                    {item.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Dislikes Section */}
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#E7DCD5] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ThumbsDown className="w-4 h-4 text-[#8D746E]" />
            <h3 className="text-sm font-extrabold text-[#4A3531]">不太喜歡的事物</h3>
          </div>
          <span className="text-[10px] font-bold text-[#7D635D]">純屬小個性・絕無任何懲罰</span>
        </div>

        <p className="text-[11px] text-[#7D635D] leading-snug bg-[#FAF4EE] rounded-xl px-3 py-2">
          💡 即使餵食或擺放牠不太喜歡的東西，也完全不會扣心情或任何資源，只會露出普通表情或小聲撒嬌抱怨一下喔！
        </p>

        {/* Disliked Foods */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#6E544E]">🥗 不喜歡食物</p>
          <div className="flex flex-wrap gap-2">
            {pref.dislikedFoodIds.map((fId) => {
              const food = foodById.get(fId);
              if (!food) return null;
              return (
                <span
                  key={fId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5EFEA] border border-[#E2D4CB] text-xs font-bold text-[#5A423C]"
                >
                  <span aria-hidden="true">{food.emoji}</span>
                  <span>{food.name}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Disliked Toys */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#6E544E]">🧩 不喜歡玩具</p>
          <div className="flex flex-wrap gap-2">
            {pref.dislikedToyIds.map((tId) => {
              const toy = TOY_BY_ID[tId];
              if (!toy) return null;
              return (
                <span
                  key={tId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5EFEA] border border-[#E2D4CB] text-xs font-bold text-[#5A423C]"
                >
                  <FurnitureGraphic itemId={toy.id} size={20} />
                  <span>{toy.name}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Disliked Room Furniture */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-extrabold text-[#6E544E]">🪑 不喜歡房間家具</p>
          <div className="flex flex-wrap gap-2">
            {pref.dislikedFurnitureIds.map((itemId) => {
              const item = ROOM_ITEM_BY_ID[itemId];
              if (!item) return null;
              return (
                <span
                  key={itemId}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F5EFEA] border border-[#E2D4CB] text-xs font-bold text-[#5A423C]"
                >
                  <FurnitureGraphic itemId={item.id} size={20} />
                  <span>{item.name}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

interface PersonalityProfileModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet;
  personality: PetPersonality;
}

export const PersonalityProfileModal: React.FC<PersonalityProfileModalProps> = ({
  open,
  onClose,
  pet,
  personality,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B2621]/55 backdrop-blur-xs flex items-center justify-center p-2 overflow-x-hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="personality-profile-title"
    >
      <div className="w-full max-w-[420px] max-h-[92dvh] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl flex flex-col overflow-hidden">
        <header className="px-4 py-3 bg-gradient-to-r from-[#FFEAF0] via-[#FFF6DA] to-[#E8F8F2] border-b border-[#F2DFD5] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 id="personality-profile-title" className="text-base font-extrabold text-[#4A3531] truncate">
              🌟 {pet.name}的個性檔案
            </h2>
            <p className="text-[11px] font-bold text-[#7D635D]">
              主要個性 · 次要個性 · 喜好與偏好清單
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉個性檔案"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/85 text-[#5A3E36] flex items-center justify-center hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5">
          <PersonalityProfileView pet={pet} personality={personality} />
        </div>
      </div>
    </div>
  );
};
