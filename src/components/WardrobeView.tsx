import React, { useState } from 'react';
import { BookOpen, Check, Coins, Lock, Shirt } from 'lucide-react';
import { ACCESSORIES, ACCESSORY_SLOT_LABELS, ACCESSORY_SLOTS } from '../data/accessories';
import { getGrowthStage } from '../data/growth';
import { PET_SPECIES_INFO, PET_SPECIES_LIST } from '../data/species';
import {
  Accessory,
  AccessorySlot,
  EncyclopediaState,
  Pet,
  PetSpecies,
  SharedHouse,
  TitleId,
} from '../types';
import { AccessoryPreview } from './AccessoryPreview';
import { EncyclopediaView } from './EncyclopediaView';
import { PiggyCharacter } from './PiggyCharacter';

interface WardrobeViewProps {
  pet: Pet;
  coins: number;
  unlockedAccessories: string[];
  encyclopedia: EncyclopediaState;
  house: SharedHouse;
  onToggleEquip: (item: Accessory) => void;
  onBuyAccessory: (item: Accessory) => void;
  onChangeSpecies?: (species: PetSpecies) => void;
  onSelectTitle?: (titleId: TitleId | null) => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  pet,
  coins,
  unlockedAccessories,
  encyclopedia,
  house,
  onToggleEquip,
  onBuyAccessory,
  onChangeSpecies,
  onSelectTitle,
}) => {
  const [viewMode, setViewMode] = useState<'wardrobe' | 'encyclopedia'>('wardrobe');
  const [activeSlot, setActiveSlot] = useState<AccessorySlot>('head');

  const stage = getGrowthStage(pet.growth);
  const slotUnlocked = stage.unlockedSlots.includes(activeSlot);
  const slotItems = ACCESSORIES.filter((a) => a.slot === activeSlot);

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      <div className="grid grid-cols-2 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setViewMode('wardrobe')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            viewMode === 'wardrobe'
              ? 'bg-white text-[#D64470] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>穿搭更衣</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('encyclopedia')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition ${
            viewMode === 'encyclopedia'
              ? 'bg-white text-[#256D57] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>收集圖鑑</span>
        </button>
      </div>

      {viewMode === 'encyclopedia' ? (
        <EncyclopediaView
          encyclopedia={encyclopedia}
          unlockedAccessories={unlockedAccessories}
          house={house}
          initialSection="accessories"
          onSelectTitle={onSelectTitle}
        />
      ) : (
        <>
      <section className="rounded-3xl bg-gradient-to-b from-[#E6F8F1] to-[#FFFDF8] border-2 border-[#D2EFE4] p-4 flex flex-col items-center text-center">
        <h2 className="text-base font-extrabold text-[#4A3531]">
          {pet.name}的更衣室
        </h2>
        <p className="text-xs text-[#7D635D] mt-0.5">
          換上喜歡的可愛配件或切換寵物外觀，即時預覽穿搭效果
        </p>

        <div className="my-2">
          <PiggyCharacter
            species={pet.species}
            growth={pet.growth}
            roundness={pet.roundness}
            action="idle"
            equipped={pet.accessories}
            interactive={false}
            size={180}
          />
        </div>

        {onChangeSpecies && (
          <div className="w-full pt-2 border-t border-[#DFEFE9]">
            <p className="text-[11px] font-bold text-[#6E544E] mb-1.5">
              切換寵物造型（共用目前成長與好感度）
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {PET_SPECIES_LIST.map((sp) => {
                const info = PET_SPECIES_INFO[sp];
                const isSelected = pet.species === sp;
                return (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => onChangeSpecies(sp)}
                    className={`min-h-[40px] rounded-xl px-2 text-xs font-extrabold border transition flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#FF7A9E] border-[#E05E83] text-white shadow-xs'
                        : 'bg-white border-[#E4D8D2] text-[#6E544E] hover:bg-[#FFF5F8]'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-[#5A3E36] shrink-0"
                      style={{ backgroundColor: info.eggColor }}
                      aria-hidden="true"
                    />
                    <span className="truncate">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-4 gap-1.5 bg-[#F6ECE6] p-1.5 rounded-2xl">
        {ACCESSORY_SLOTS.map((slot) => {
          const isUnlocked = stage.unlockedSlots.includes(slot);
          return (
            <button
              key={slot}
              type="button"
              onClick={() => setActiveSlot(slot)}
              className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition whitespace-nowrap ${
                activeSlot === slot
                  ? 'bg-white text-[#D64470] shadow-xs'
                  : 'text-[#7D635D] hover:text-[#4A3531]'
              }`}
            >
              {!isUnlocked && <Lock className="w-3 h-3" />}
              <span>{ACCESSORY_SLOT_LABELS[slot]}</span>
            </button>
          );
        })}
      </div>

      {!slotUnlocked && (
        <div className="rounded-2xl bg-[#FFF3D1] border border-[#F3CE72] px-4 py-3 text-xs font-bold text-[#7B5610]">
          「{ACCESSORY_SLOT_LABELS[activeSlot]}」欄位將於成長等級 Lv.2「圓滾小豬」（100 成長值）解鎖！現在可以先預覽與購買喔。
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {slotItems.map((item) => {
          const isOwned = unlockedAccessories.includes(item.id);
          const isEquipped = pet.accessories[item.slot] === item.id;
          const canBuy = coins >= item.price;

          return (
            <article
              key={item.id}
              className={`rounded-3xl border-2 p-3.5 flex flex-col justify-between transition ${
                isEquipped
                  ? 'bg-[#FFF0F5] border-[#FF7A9E]'
                  : 'bg-[#FFFDF8] border-[#F4DFD7]'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#FFF8EB] border border-[#F3E2C3] flex items-center justify-center">
                  <AccessoryPreview accessoryId={item.id} />
                </div>
                <h3 className="mt-2.5 text-sm font-extrabold text-[#4A3531]">
                  {item.name}
                </h3>
                <p className="mt-1 text-[11px] text-[#7D635D] leading-snug">
                  {item.description}
                </p>
              </div>

              <div className="mt-3">
                {isOwned ? (
                  <button
                    type="button"
                    disabled={!slotUnlocked}
                    onClick={() => onToggleEquip(item)}
                    className={`w-full min-h-[42px] rounded-2xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
                      !slotUnlocked
                        ? 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                        : isEquipped
                        ? 'bg-[#5CC9A7] text-white hover:bg-[#49B895]'
                        : 'bg-[#FF7A9E] text-white hover:bg-[#F45D86] active:scale-95'
                    }`}
                  >
                    {isEquipped ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>已穿戴 · 脫下</span>
                      </>
                    ) : (
                      <span>穿戴</span>
                    )}
                  </button>
                ) : item.price === 0 && !item.initialUnlocked ? (
                  <div className="w-full min-h-[42px] rounded-2xl bg-[#FFF3D8] border border-[#F0CF7A] text-[#8A5A10] text-[11px] font-extrabold inline-flex items-center justify-center px-2 text-center">
                    第 7 天成長之路解鎖
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canBuy}
                    onClick={() => onBuyAccessory(item)}
                    className={`w-full min-h-[42px] rounded-2xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
                      canBuy
                        ? 'bg-[#FFF3D1] border border-[#F2CE6D] text-[#7A540E] hover:bg-[#FFEAA8] active:scale-95'
                        : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                    }`}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span className="tabular-nums">{item.price} 金幣解鎖</span>
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
