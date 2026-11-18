import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="mx-4 mt-2 flex items-center justify-center gap-2 rounded-2xl bg-[#FFF3C4] border border-[#F3D27A] px-3 py-2 text-xs font-bold text-[#7B5912]">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>目前處於離線模式，遊戲紀錄會自動保存在本機。</span>
    </div>
  );
};
