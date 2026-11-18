import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { GrowthStageInfo } from '../types';

interface LevelUpModalProps {
  stage: GrowthStageInfo | null;
  petName: string;
  onClose: () => void;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ stage, petName, onClose }) => {
  if (!stage) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="levelup-title"
    >
      <div className="w-full max-w-[360px] rounded-3xl bg-[#FFFDF8] border-2 border-[#FAD5E0] p-6 shadow-2xl text-center relative">
        <button
          type="button"
          onClick={onClose}
          aria-label="關閉升級視窗"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-[#F7ECE6] text-[#5A3E36] hover:bg-[#EEDCD3]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-16 h-16 rounded-full bg-[#FFF2C6] border-2 border-[#F5CF6B] flex items-center justify-center text-[#C98512]">
          <Sparkles className="w-8 h-8" />
        </div>

        <p className="mt-4 text-xs font-extrabold text-[#D64470]">
          成長等級提升！
        </p>
        <h2 id="levelup-title" className="mt-1 text-2xl font-extrabold text-[#4A3531]">
          {petName} 變成「{stage.name}」了
        </h2>
        <p className="mt-2 text-sm text-[#6E544E] leading-relaxed">
          {stage.tagline}
        </p>

        <div className="mt-4 rounded-2xl bg-[#E8F8F2] border border-[#ADE6D3] px-4 py-3 text-xs font-bold text-[#256D57]">
          新解鎖：{stage.unlockFeature}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_3px_0_#D9577B] hover:bg-[#F45D86] active:translate-y-0.5 transition"
        >
          太棒了！繼續陪伴
        </button>
      </div>
    </div>
  );
};
