import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#FF7A9E] px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#F45D86] active:scale-95 transition whitespace-nowrap shrink-0"
      >
        <Download className="w-3.5 h-3.5" />
        安裝 App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-[#FFF0F4] border border-[#FFC4D4] px-2.5 py-1.5 text-xs font-bold text-[#B83B64] hover:bg-[#FFE3EC] active:scale-95 transition whitespace-nowrap shrink-0"
        >
          <Share className="w-3.5 h-3.5" />
          加到主畫面
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-pwa-title"
          >
            <div className="w-full max-w-[360px] rounded-3xl bg-[#FFFDF8] border-2 border-[#F6DCE3] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 id="ios-pwa-title" className="text-lg font-extrabold text-[#4A3531]">
                  安裝到 iPhone 主畫面
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="關閉視窗"
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-full bg-[#F7ECE6] text-[#5A3E36] hover:bg-[#EEDCD3]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-4 space-y-2.5 text-sm text-[#5E4742] leading-relaxed">
                <li>1. 點擊 Safari 下方工具列的「分享」圖示（方形向上箭頭）。</li>
                <li>2. 往下滑動選單，選擇「加入主畫面」。</li>
                <li>3. 點擊右上角「新增」，即可像原生 App 一樣隨時照顧小豬！</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-2xl bg-[#FF7A9E] text-white font-bold text-sm hover:bg-[#F45D86] active:scale-[0.98] transition"
              >
                我知道了
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
