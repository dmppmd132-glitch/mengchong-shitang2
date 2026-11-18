import React from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';

interface PWAUpdateBannerProps {
  show: boolean;
  updating: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
  stickyClassName?: string;
}

export const PWAUpdateBanner: React.FC<PWAUpdateBannerProps> = ({
  show,
  updating,
  onUpdate,
  onDismiss,
  stickyClassName = 'sticky top-14 z-25',
}) => {
  if (!show) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${stickyClassName} mx-3 mt-2 flex items-center justify-between gap-2 rounded-2xl bg-gradient-to-r from-[#FFF0F5] via-[#FFF6DA] to-[#E8F8F2] border-2 border-[#FFC4D6] px-3 py-2 shadow-md`}
    >
      <button
        type="button"
        onClick={onUpdate}
        disabled={updating}
        className="flex-1 min-w-0 min-h-[38px] flex items-center gap-2 text-left rounded-xl px-1.5 py-1 hover:bg-white/60 active:scale-[0.99] transition disabled:opacity-60"
      >
        <span className="w-7 h-7 rounded-xl bg-[#FF7A9E] text-white flex items-center justify-center shrink-0 shadow-xs">
          {updating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </span>
        <span className="text-xs font-extrabold text-[#4A3531] leading-snug">
          {updating ? '正在更新至最新版本…' : '發現新版本！點此立即更新'}
        </span>
      </button>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="稍後再更新"
        title="稍後再更新"
        className="min-h-[34px] min-w-[34px] rounded-full bg-white/80 text-[#7D635D] flex items-center justify-center hover:bg-white transition shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
