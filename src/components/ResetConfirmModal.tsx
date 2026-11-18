import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, X } from 'lucide-react';

interface ResetConfirmModalProps {
  open: boolean;
  petName: string;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  open,
  petName,
  onClose,
  onConfirmReset,
}) => {
  const [step, setStep] = useState<1 | 2>(1);

  if (!open) return null;

  const handleClose = () => {
    setStep(1);
    onClose();
  };

  const handleFinalConfirm = () => {
    setStep(1);
    onConfirmReset();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="w-full max-w-[360px] rounded-3xl bg-[#FFFDF8] border-2 border-[#FAD5E0] p-6 shadow-2xl relative">
        <button
          type="button"
          onClick={handleClose}
          aria-label="關閉重置確認視窗"
          className="absolute top-4 right-4 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-[#F7ECE6] text-[#5A3E36] hover:bg-[#EEDCD3]"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-14 h-14 rounded-full bg-[#FFE9EF] border-2 border-[#F5B4C6] flex items-center justify-center text-[#D64470]">
          {step === 1 ? <RotateCcw className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
        </div>

        {step === 1 ? (
          <>
            <h2
              id="reset-modal-title"
              className="mt-4 text-center text-lg font-extrabold text-[#4A3531]"
            >
              確定要重置遊戲嗎？
            </h2>
            <p className="mt-2 text-center text-sm text-[#6E544E] leading-relaxed">
              重置後將會清除「{petName}」的成長進度、體重紀錄、食物庫存與已解鎖配件，回到粉紅蛋孵化畫面。
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[46px] rounded-2xl bg-[#F4EAE4] text-[#5A3E36] font-extrabold text-sm hover:bg-[#E8D9D1] transition"
              >
                先不要
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm hover:bg-[#F45D86] active:scale-[0.98] transition"
              >
                下一步確認
              </button>
            </div>
          </>
        ) : (
          <>
            <h2
              id="reset-modal-title"
              className="mt-4 text-center text-lg font-extrabold text-[#C4315B]"
            >
              最後確認：無法復原喔！
            </h2>
            <p className="mt-2 text-center text-sm text-[#6E544E] leading-relaxed">
              這項操作會永久清空本機存檔中的所有紀錄，確定要重新開始養一隻新小豬嗎？
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleClose}
                className="min-h-[46px] rounded-2xl bg-[#E6F7F0] text-[#256D57] font-extrabold text-sm hover:bg-[#D4F0E5] transition"
              >
                保留存檔
              </button>
              <button
                type="button"
                onClick={handleFinalConfirm}
                className="min-h-[46px] rounded-2xl bg-[#D9426C] text-white font-extrabold text-sm shadow-[0_3px_0_#A6284D] hover:bg-[#C2345C] active:translate-y-0.5 transition"
              >
                確認重置
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
