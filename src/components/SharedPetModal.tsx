import React, { useState } from 'react';
import {
  Check,
  Copy,
  Gamepad2,
  HeartHandshake,
  Loader2,
  LogOut,
  RefreshCw,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { CloudSyncStatus, CloudUser, SharedPetRoom } from '../types';

interface SharedPetModalProps {
  open: boolean;
  onClose: () => void;
  isConfigured: boolean;
  cloudUser: CloudUser | null;
  sharedRoom: SharedPetRoom | null;
  syncStatus: CloudSyncStatus;
  localPetName: string;
  localHatched: boolean;
  onOpenCloudAuth: () => void;
  onCreateSharedRoom: () => Promise<string | null>;
  onJoinSharedRoom: (inviteCode: string) => Promise<string | null>;
  onRegenerateInviteCode: () => Promise<string | null>;
  onLeaveSharedRoom: () => Promise<string | null>;
  onRefreshSharedRoom: () => Promise<string | null>;
  onOpenCoopGames?: () => void;
}

function formatUpdatedTime(isoStr: string | null): string {
  if (!isoStr) return '剛剛';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '剛剛';
  return d.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SharedPetModal: React.FC<SharedPetModalProps> = ({
  open,
  onClose,
  isConfigured,
  cloudUser,
  sharedRoom,
  syncStatus,
  localPetName,
  localHatched,
  onOpenCloudAuth,
  onCreateSharedRoom,
  onJoinSharedRoom,
  onRegenerateInviteCode,
  onLeaveSharedRoom,
  onRefreshSharedRoom,
  onOpenCoopGames,
}) => {
  const [inviteInput, setInviteInput] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [confirmLeave, setConfirmLeave] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [infoMsg, setInfoMsg] = useState<string>('');

  if (!open) return null;

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setErrorMsg('無法自動複製，請手動長按選取邀請碼。');
    }
  };

  const handleCreate = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      const err = await onCreateSharedRoom();
      if (err) {
        setErrorMsg(err);
      } else {
        setInfoMsg('已建立兩人共養小屋！把邀請碼傳給夥伴即可一起照顧。');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    const clean = inviteInput.trim().toUpperCase();
    if (clean.length !== 6) {
      setErrorMsg('請輸入完整的 6 碼邀請碼。');
      return;
    }

    setSubmitting(true);
    try {
      const err = await onJoinSharedRoom(clean);
      if (err) {
        setErrorMsg(err);
      } else {
        setInviteInput('');
        setInfoMsg('成功加入共養小屋，現在可以一起照顧這隻小豬囉！');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegenerate = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      const err = await onRegenerateInviteCode();
      if (err) {
        setErrorMsg(err);
      } else {
        setInfoMsg('已產生新的 6 碼邀請碼！');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      const err = await onRefreshSharedRoom();
      if (err) {
        setErrorMsg(err);
      } else {
        setInfoMsg('已取得共養小屋最新狀態！');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmLeave = async () => {
    setErrorMsg('');
    setInfoMsg('');
    setSubmitting(true);
    try {
      const err = await onLeaveSharedRoom();
      if (err) {
        setErrorMsg(err);
      } else {
        setConfirmLeave(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shared-pet-modal-title"
    >
      <div className="w-full max-w-[390px] max-h-[88dvh] overflow-y-auto rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FFEAF0] text-[#D64470] flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h2 id="shared-pet-modal-title" className="text-lg font-extrabold text-[#4A3531]">
              兩人共養與邀請碼
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              setConfirmLeave(false);
              onClose();
            }}
            aria-label="關閉視窗"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#F7ECE6] text-[#5A3E36] flex items-center justify-center hover:bg-[#EEDCD3] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isConfigured ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFF6E5] border border-[#F3DCB0] p-3.5 text-xs text-[#6E544E] leading-relaxed space-y-1.5">
              <p className="font-extrabold text-[#8A5A12] text-sm">尚未啟用雲端共養服務</p>
              <p>
                兩人共養需要透過 Supabase 即時同步小豬狀態，請先設定{' '}
                <code className="font-bold">VITE_SUPABASE_URL</code> 與{' '}
                <code className="font-bold">VITE_SUPABASE_ANON_KEY</code>，並於 SQL Editor 執行最新{' '}
                <code className="font-bold">supabase/schema.sql</code>。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_3px_0_#D9577B] hover:bg-[#F76890] transition"
            >
              我知道了
            </button>
          </div>
        ) : !cloudUser ? (
          <div className="space-y-3.5">
            <div className="rounded-2xl bg-[#FFF3F6] border border-[#F5CBD8] p-4 space-y-1.5">
              <p className="text-sm font-extrabold text-[#B83B64]">請先登入雲端帳號</p>
              <p className="text-xs text-[#6E544E] leading-relaxed">
                登入後即可建立屬於兩人的「共養小屋」取得 6 碼邀請碼，或輸入夥伴的邀請碼一起餵食與打扮小豬。
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCloudAuth();
              }}
              className="w-full min-h-[48px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_4px_0_#D9577B] hover:bg-[#F76890] active:translate-y-0.5 transition"
            >
              前往登入 / 註冊帳號
            </button>
          </div>
        ) : sharedRoom ? (
          <div className="space-y-3.5">
            <div className="rounded-2xl bg-gradient-to-br from-[#FFEAF0] to-[#FFF6DA] border border-[#F4C4D3] p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-[#B83B64] inline-flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>正在共養：{localPetName}</span>
                </span>
                <span className="text-[11px] font-bold text-[#7D635D]">
                  {syncStatus === 'syncing' ? '同步中…' : '即時同步開啟'}
                </span>
              </div>

              <div className="rounded-2xl bg-white/90 border border-[#F3D5DF] p-3 flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-bold text-[#826862]">專屬共養邀請碼</p>
                  <p className="text-2xl font-extrabold tracking-[0.2em] text-[#4A3531] tabular-nums select-all">
                    {sharedRoom.inviteCode}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void handleCopyCode(sharedRoom.inviteCode);
                  }}
                  className="min-h-[42px] px-3.5 rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold shadow-[0_2px_0_#D9577B] hover:bg-[#F76890] active:scale-95 transition inline-flex items-center gap-1.5 shrink-0"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '已複製' : '複製'}</span>
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7D635D]">
                <span>最近更新：{formatUpdatedTime(sharedRoom.updatedAt)}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleRefresh();
                    }}
                    className="font-extrabold text-[#256D57] hover:underline inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>手動刷新</span>
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleRegenerate();
                    }}
                    className="font-extrabold text-[#B83B64] hover:underline disabled:opacity-50"
                  >
                    換新邀請碼
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#F9F2EE] border border-[#EAD9D1] p-3.5 space-y-2 text-xs">
              <p className="font-extrabold text-[#4A3531]">共養飼主成員（最多 2 人）</p>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#7D635D] shrink-0">飼主 1</span>
                <span className="font-bold text-[#4A3531] truncate">
                  {sharedRoom.ownerEmail || '已加入'}
                  {sharedRoom.ownerId === cloudUser.id ? '（你）' : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#7D635D] shrink-0">飼主 2</span>
                {sharedRoom.partnerId ? (
                  <span className="font-bold text-[#256D57] truncate">
                    {sharedRoom.partnerEmail || '已加入'}
                    {sharedRoom.partnerId === cloudUser.id ? '（你）' : ''}
                  </span>
                ) : (
                  <span className="font-bold text-[#A46D0F]">等待夥伴輸入邀請碼加入…</span>
                )}
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs font-bold text-[#C4315B] bg-[#FFE9EF] rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
            {infoMsg && (
              <p className="text-xs font-bold text-[#256D57] bg-[#E3F7F0] rounded-xl px-3 py-2">
                {infoMsg}
              </p>
            )}

            {onOpenCoopGames && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenCoopGames();
                }}
                className="w-full min-h-[46px] rounded-2xl bg-gradient-to-r from-[#FF7A9E] to-[#FF9B7A] text-white text-xs font-extrabold shadow-[0_3px_0_#D9577B] hover:brightness-105 active:translate-y-0.5 transition flex items-center justify-center gap-1.5"
              >
                <Gamepad2 className="w-4 h-4" />
                <span>進入「合作遊戲」（雙人佈置＆農場接力）</span>
              </button>
            )}

            {!confirmLeave ? (
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className="w-full min-h-[44px] rounded-2xl bg-[#FFE9EF] border border-[#F5B4C6] text-xs font-extrabold text-[#C4315B] hover:bg-[#FFD9E3] transition flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>退出兩人共養</span>
              </button>
            ) : (
              <div className="rounded-2xl bg-[#FFF3F6] border border-[#F5B4C6] p-3 space-y-2.5">
                <p className="text-xs font-bold text-[#A82A4F] leading-relaxed">
                  確定要退出共養嗎？退出後您會切回單人本機／個人雲端存檔，目前的小豬會保留給另一位夥伴（若無人則解散）。
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setConfirmLeave(false)}
                    className="min-h-[40px] rounded-xl bg-white border border-[#E6CFC8] text-xs font-extrabold text-[#5A3E36]"
                  >
                    先不要
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleConfirmLeave();
                    }}
                    className="min-h-[40px] rounded-xl bg-[#D64470] text-white text-xs font-extrabold flex items-center justify-center gap-1 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>確定退出</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <section className="rounded-2xl bg-[#FFF7EC] border border-[#F2DCC2] p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#B85776]" />
                <h3 className="text-sm font-extrabold text-[#4A3531]">方式一：建立共養小屋</h3>
              </div>
              {localHatched ? (
                <>
                  <p className="text-xs text-[#6E544E] leading-relaxed">
                    把你目前的「<span className="font-extrabold text-[#4A3531]">{localPetName}</span>」升級為兩人共養，系統會產生一組 6 碼邀請碼給對方加入。
                  </p>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      void handleCreate();
                    }}
                    className="w-full min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_3px_0_#D9577B] hover:bg-[#F76890] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>建立共養並產生邀請碼</span>
                  </button>
                </>
              ) : (
                <p className="text-xs text-[#856C66] leading-relaxed">
                  先孵化並為你的小豬命名後就能建立共養小屋；或者直接用下方「方式二」輸入夥伴的邀請碼！
                </p>
              )}
            </section>

            <section className="rounded-2xl bg-[#F3FBF8] border border-[#BEE8D8] p-3.5 space-y-2.5">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#256D57]" />
                <h3 className="text-sm font-extrabold text-[#4A3531]">方式二：輸入邀請碼加入</h3>
              </div>
              <form onSubmit={handleJoin} className="space-y-2.5">
                <input
                  type="text"
                  maxLength={6}
                  value={inviteInput}
                  onChange={(e) => {
                    setInviteInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="輸入 6 碼邀請碼（如 PIG8K2）"
                  className="w-full min-h-[46px] rounded-2xl bg-white border border-[#BFE6D7] px-3.5 text-center text-base font-extrabold tracking-[0.18em] uppercase text-[#4A3531] placeholder:text-xs placeholder:tracking-normal placeholder:font-medium placeholder:text-[#A0B3AC] focus:outline-none focus:border-[#5CC9A7]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full min-h-[46px] rounded-2xl bg-[#5CC9A7] text-white font-extrabold text-sm shadow-[0_3px_0_#3BA886] hover:bg-[#4DBE9B] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>加入對方的共養小豬</span>
                </button>
              </form>
              {localHatched && (
                <p className="text-[11px] text-[#5B7A70] leading-relaxed">
                  加入後將切換為兩人的共養小豬；你原本的單人進度仍安全保存在個人雲端存檔中。
                </p>
              )}
            </section>

            {errorMsg && (
              <p className="text-xs font-bold text-[#C4315B] bg-[#FFE9EF] rounded-xl px-3 py-2">
                {errorMsg}
              </p>
            )}
            {infoMsg && (
              <p className="text-xs font-bold text-[#256D57] bg-[#E3F7F0] rounded-xl px-3 py-2">
                {infoMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
