import React, { useState } from 'react';
import {
  CheckCircle2,
  Cloud,
  CloudOff,
  CloudUpload,
  Download,
  Loader2,
  LogOut,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import {
  signInWithEmail,
  signUpWithEmail,
} from '../services/cloudSync';
import { CloudSavePayload, CloudSyncStatus, CloudUser, SharedPetRoom } from '../types';

interface AuthSyncModalProps {
  open: boolean;
  onClose: () => void;
  isConfigured: boolean;
  user: CloudUser | null;
  syncStatus: CloudSyncStatus;
  lastSyncedAt: string | null;
  syncError: string | null;
  pendingCloudSave: CloudSavePayload | null;
  localPetName: string;
  localPetLevel: number;
  localPetWeight: number;
  localHatched: boolean;
  sharedRoom?: SharedPetRoom | null;
  onOpenSharedPet?: () => void;
  onAuthSuccess: (user: CloudUser) => void;
  onSignOut: () => Promise<void>;
  onForceUpload: () => Promise<void>;
  onForceDownload: () => Promise<void>;
  onResolveConflictUseCloud: () => void;
  onResolveConflictUseLocal: () => Promise<void>;
}

function formatSyncTime(isoStr: string | null): string {
  if (!isoStr) return '尚未同步';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '剛剛';
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AuthSyncModal: React.FC<AuthSyncModalProps> = ({
  open,
  onClose,
  isConfigured,
  user,
  syncStatus,
  lastSyncedAt,
  syncError,
  pendingCloudSave,
  localPetName,
  localPetLevel,
  localPetWeight,
  localHatched,
  sharedRoom = null,
  onOpenSharedPet,
  onAuthSuccess,
  onSignOut,
  onForceUpload,
  onForceDownload,
  onResolveConflictUseCloud,
  onResolveConflictUseLocal,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');
  const [formInfo, setFormInfo] = useState<string>('');

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormInfo('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setFormError('請輸入正確的 Email 地址。');
      return;
    }
    if (password.length < 6) {
      setFormError('密碼至少需要 6 個字元喔！');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await signInWithEmail(trimmedEmail, password);
        if (res.error) {
          setFormError(res.error);
          return;
        }
        if (res.user) {
          setPassword('');
          onAuthSuccess(res.user);
        }
      } else {
        const res = await signUpWithEmail(trimmedEmail, password);
        if (res.error) {
          setFormError(res.error);
          return;
        }
        if (res.needsEmailConfirmation) {
          setFormInfo('註冊成功！請前往信箱點擊驗證連結，完成後再切回「登入」。');
          setMode('login');
          setPassword('');
          return;
        }
        if (res.user) {
          setPassword('');
          onAuthSuccess(res.user);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = () => {
    if (syncStatus === 'syncing') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#A46D0F] bg-[#FFF2CC] px-2.5 py-1 rounded-xl">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>同步中…</span>
        </span>
      );
    }
    if (syncStatus === 'synced') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#256D57] bg-[#E3F7F0] px-2.5 py-1 rounded-xl">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>雲端已同步</span>
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#C4315B] bg-[#FFE9EF] px-2.5 py-1 rounded-xl">
          <CloudOff className="w-3.5 h-3.5" />
          <span>同步異常</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7D635D] bg-[#F5ECE7] px-2.5 py-1 rounded-xl">
        <Cloud className="w-3.5 h-3.5" />
        <span>本機模式</span>
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-sync-modal-title"
    >
      <div className="w-full max-w-[390px] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-[#FFEAF0] text-[#D64470] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <h2 id="auth-sync-modal-title" className="text-lg font-extrabold text-[#4A3531]">
              雲端存檔與帳號
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉視窗"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-[#F7ECE6] text-[#5A3E36] flex items-center justify-center hover:bg-[#EEDCD3] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!isConfigured ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-[#FFF6E5] border border-[#F3DCB0] p-3.5 text-xs text-[#6E544E] leading-relaxed space-y-1.5">
              <p className="font-extrabold text-[#8A5A12] text-sm">目前為本機存檔模式</p>
              <p>
                你的小豬與體重紀錄已安全儲存在此裝置的 <code className="font-bold">localStorage</code>，離線也能正常遊玩。
              </p>
              <p>
                若要開啟跨裝置雲端同步，請於部署環境或 <code className="font-bold">.env</code> 設定{' '}
                <code className="font-bold">VITE_SUPABASE_URL</code> 與{' '}
                <code className="font-bold">VITE_SUPABASE_ANON_KEY</code>，並執行{' '}
                <code className="font-bold">supabase/schema.sql</code>。
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_3px_0_#D9577B] hover:bg-[#F76890] transition"
            >
              我知道了，繼續遊玩
            </button>
          </div>
        ) : user && pendingCloudSave ? (
          <div className="space-y-3.5">
            <div className="rounded-2xl bg-[#FFF6E5] border border-[#F3DCB0] p-3.5 space-y-1">
              <p className="text-sm font-extrabold text-[#8A5A12]">發現雲端有另一份小豬存檔！</p>
              <p className="text-xs text-[#6E544E] leading-relaxed">
                帳號 <span className="font-bold">{user.email}</span> 已存有小豬進度，請選擇要保留哪一份：
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-2xl bg-[#F9F2EE] border border-[#EAD9D1] p-3 space-y-1">
                <span className="inline-block font-extrabold text-[#7D635D]">本機目前進度</span>
                <p className="text-sm font-extrabold text-[#4A3531] truncate">
                  {localHatched ? localPetName : '尚未孵化'}
                </p>
                <p className="text-[#6E544E] tabular-nums">
                  Lv.{localPetLevel} · {localPetWeight.toFixed(1)} kg
                </p>
              </div>

              <div className="rounded-2xl bg-[#FFEAF0] border border-[#F4C4D3] p-3 space-y-1">
                <span className="inline-block font-extrabold text-[#D64470]">雲端存檔進度</span>
                <p className="text-sm font-extrabold text-[#4A3531] truncate">
                  {pendingCloudSave.state.pet.hatched
                    ? pendingCloudSave.state.pet.name
                    : '尚未孵化'}
                </p>
                <p className="text-[#6E544E] tabular-nums">
                  Lv.{pendingCloudSave.state.pet.level} ·{' '}
                  {pendingCloudSave.state.pet.weight.toFixed(1)} kg
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={onResolveConflictUseCloud}
                disabled={syncStatus === 'syncing'}
                className="w-full min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_3px_0_#D9577B] hover:bg-[#F76890] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                <span>載入雲端存檔（覆蓋本機）</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  void onResolveConflictUseLocal();
                }}
                disabled={syncStatus === 'syncing'}
                className="w-full min-h-[46px] rounded-2xl bg-[#5CC9A7] text-white font-extrabold text-sm shadow-[0_3px_0_#3BA886] hover:bg-[#4DBE9B] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <CloudUpload className="w-4 h-4" />
                <span>保留本機進度（上傳覆蓋雲端）</span>
              </button>
            </div>
          </div>
        ) : user ? (
          <div className="space-y-3.5">
            <div className="rounded-2xl bg-[#F9F2EE] border border-[#EAD9D1] p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#826862]">已登入帳號</span>
                {renderStatusBadge()}
              </div>
              <p className="text-sm font-extrabold text-[#4A3531] break-all">{user.email}</p>
              <p className="text-xs text-[#7D635D] tabular-nums">
                最近同步時間：{formatSyncTime(lastSyncedAt)}
              </p>
              {syncError && (
                <p className="text-xs font-bold text-[#C4315B] bg-[#FFE9EF] rounded-xl px-2.5 py-1.5">
                  {syncError}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  void onForceUpload();
                }}
                disabled={syncStatus === 'syncing'}
                className="min-h-[44px] px-3 rounded-2xl bg-[#5CC9A7] text-white text-xs font-extrabold shadow-[0_3px_0_#3BA886] hover:bg-[#4DBE9B] active:translate-y-0.5 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <CloudUpload className="w-4 h-4 shrink-0" />
                <span>立即上傳同步</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  void onForceDownload();
                }}
                disabled={syncStatus === 'syncing'}
                className="min-h-[44px] px-3 rounded-2xl bg-[#F7ECE6] border border-[#E5CFC5] text-[#4A3531] text-xs font-extrabold hover:bg-[#EEDCD3] active:scale-95 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <RefreshCw className="w-4 h-4 shrink-0" />
                <span>載入雲端存檔</span>
              </button>
            </div>

            {onOpenSharedPet && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSharedPet();
                }}
                className="w-full min-h-[44px] rounded-2xl bg-[#FFF0F4] border border-[#F5C4D3] text-xs font-extrabold text-[#B83B64] hover:bg-[#FFE3EC] transition flex items-center justify-center gap-1.5"
              >
                <Users className="w-4 h-4" />
                <span>
                  {sharedRoom
                    ? `兩人共養中（邀請碼 ${sharedRoom.inviteCode}）`
                    : '兩人共養與邀請碼'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                void onSignOut();
              }}
              className="w-full min-h-[44px] rounded-2xl bg-[#FFE9EF] border border-[#F5B4C6] text-xs font-extrabold text-[#C4315B] hover:bg-[#FFD9E3] transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>登出雲端帳號（保留本機存檔）</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-1.5 bg-[#F6ECE6] p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setFormError('');
                }}
                className={`min-h-[40px] rounded-xl text-sm font-extrabold transition ${
                  mode === 'login' ? 'bg-white text-[#D64470] shadow-xs' : 'text-[#7D635D]'
                }`}
              >
                登入帳號
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setFormError('');
                }}
                className={`min-h-[40px] rounded-xl text-sm font-extrabold transition ${
                  mode === 'register' ? 'bg-white text-[#D64470] shadow-xs' : 'text-[#7D635D]'
                }`}
              >
                註冊新帳號
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="cloud-auth-email"
                  className="block text-xs font-bold text-[#6E544E] mb-1"
                >
                  電子信箱 Email
                </label>
                <input
                  id="cloud-auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full min-h-[46px] rounded-2xl bg-white border border-[#EED9D0] px-3.5 text-base font-medium text-[#4A3531] placeholder:text-[#BBA7A2] focus:outline-none focus:border-[#FF7A9E]"
                />
              </div>

              <div>
                <label
                  htmlFor="cloud-auth-password"
                  className="block text-xs font-bold text-[#6E544E] mb-1"
                >
                  密碼（至少 6 個字元）
                </label>
                <input
                  id="cloud-auth-password"
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  className="w-full min-h-[46px] rounded-2xl bg-white border border-[#EED9D0] px-3.5 text-base font-medium text-[#4A3531] placeholder:text-[#BBA7A2] focus:outline-none focus:border-[#FF7A9E]"
                />
              </div>

              {formError && (
                <p className="text-xs font-bold text-[#C4315B] bg-[#FFE9EF] rounded-xl px-3 py-2">
                  {formError}
                </p>
              )}

              {formInfo && (
                <p className="text-xs font-bold text-[#256D57] bg-[#E3F7F0] rounded-xl px-3 py-2">
                  {formInfo}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[48px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-base shadow-[0_4px_0_#D9577B] hover:bg-[#F76890] active:translate-y-0.5 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{mode === 'login' ? '登入並同步小豬' : '建立雲端帳號'}</span>
              </button>
            </form>

            <p className="text-xs text-[#8D746E] text-center leading-relaxed">
              不登入也能在本機離線遊玩，登入後可於手機與電腦間同步存檔。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
