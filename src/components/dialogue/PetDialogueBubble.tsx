import React from 'react';
import { History, X } from 'lucide-react';
import { DIALOGUE_CATEGORY_META } from '../../data/dialogue';
import { DialogueLine, Pet } from '../../types';
import { PiggyCharacter } from '../PiggyCharacter';

interface PetDialogueBubbleProps {
  pet: Pet;
  line: DialogueLine;
  onRespond: (responseId: string) => void;
  onClose: () => void;
  onOpenHistory?: () => void;
}

export const PetDialogueBubble: React.FC<PetDialogueBubbleProps> = ({
  pet,
  line,
  onRespond,
  onClose,
  onOpenHistory,
}) => {
  const catMeta = DIALOGUE_CATEGORY_META[line.category];

  return (
    <div
      className="relative w-full max-w-[356px] mb-2 rounded-3xl bg-white/96 border-2 border-[#F3CFD9] shadow-md px-3.5 py-2.5 text-left z-10"
      role="status"
      aria-live="polite"
    >
      {/* Bubble Header: Mini Pet Avatar + Name + Category + History + Close */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#FFF2F6] border border-[#F3CBD8] flex items-center justify-center overflow-hidden shrink-0">
            <PiggyCharacter
              species={pet.species}
              growth={pet.growth}
              roundness={pet.roundness}
              action="idle"
              expression="normal"
              equipped={pet.accessories}
              interactive={false}
              size={34}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-extrabold text-[#4A3531] truncate">
                {pet.name}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold ${catMeta.badgeClass}`}
              >
                <span aria-hidden="true">{catMeta.emoji}</span>
                <span>{catMeta.label}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="查看對話紀錄與設定"
              title="對話紀錄與設定"
              className="min-h-[32px] min-w-[32px] rounded-xl bg-[#F9F1EC] text-[#7D635D] flex items-center justify-center hover:bg-[#EFE2DA] transition"
            >
              <History className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉對話氣泡"
            className="min-h-[32px] min-w-[32px] rounded-xl bg-[#F9F1EC] text-[#6E544E] flex items-center justify-center hover:bg-[#EFE2DA] transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dialogue Text */}
      <p className="mt-1.5 text-xs font-bold text-[#4A3531] leading-relaxed break-words">
        {line.text}
      </p>

      {/* Quick Responses (2-3 buttons, single-tap friendly, zero coin cost) */}
      {line.responses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {line.responses.slice(0, 3).map((resp) => (
            <button
              key={resp.id}
              type="button"
              onClick={() => onRespond(resp.id)}
              className="min-h-[36px] px-2.5 py-1 rounded-2xl bg-[#FFF3F6] border border-[#F4C4D3] text-[11px] font-extrabold text-[#B83B64] inline-flex items-center gap-1 hover:bg-[#FFE5EE] active:scale-95 transition"
            >
              <span aria-hidden="true">{resp.emoji}</span>
              <span>{resp.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Speech Bubble Pointer Tail */}
      <div
        className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-3.5 h-3.5 rotate-45 bg-white border-r-2 border-b-2 border-[#F3CFD9]"
        aria-hidden="true"
      />
    </div>
  );
};
