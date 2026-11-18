import React from 'react';
import { BellOff, CloudSun, MessageSquareText, Moon, Sparkles, X } from 'lucide-react';
import { DIALOGUE_CATEGORY_META } from '../../data/dialogue';
import { DialogueSettings, DialogueState, Pet } from '../../types';

interface DialogueHistoryModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet;
  dialogue: DialogueState;
  onUpdateSettings: (patch: Partial<DialogueSettings>) => void;
}

function formatDialogueTimestamp(ts: number): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const DialogueHistoryModal: React.FC<DialogueHistoryModalProps> = ({
  open,
  onClose,
  pet,
  dialogue,
  onUpdateSettings,
}) => {
  if (!open) return null;

  const { settings, weather, history, memoryEvents } = dialogue;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B2621]/55 backdrop-blur-xs flex items-center justify-center p-2 overflow-x-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialogue-history-title"
    >
      <div className="w-full max-w-[420px] max-h-[92dvh] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 bg-gradient-to-r from-[#FFEAF0] via-[#FFF6DA] to-[#E8F8F2] border-b border-[#F2DFD5] flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2
              id="dialogue-history-title"
              className="text-base font-extrabold text-[#4A3531] truncate"
            >
              💬 {pet.name}的對話紀錄與設定
            </h2>
            <p className="text-[11px] font-bold text-[#7D635D]">
              過去對話、短期事件記憶與提醒開關
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉對話紀錄"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/85 text-[#5A3E36] flex items-center justify-center hover:bg-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-3.5">
          {/* Weather Banner */}
          <section className="rounded-2xl bg-[#EAF3FF] border border-[#B6D1FA] p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-2xl leading-none" aria-hidden="true">
                {weather.emoji}
              </span>
              <div className="min-w-0">
                <div className="text-xs font-extrabold text-[#2F5B9E]">
                  目前小屋天氣：{weather.label} · {weather.temperatureC}°C
                </div>
                <p className="text-[11px] text-[#45689E] truncate">
                  {weather.condition === 'clear'
                    ? '晴天出門散步可讓心情獲得額外加成喔！'
                    : '依照天氣陪伴寵物會有不同小互動'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-white/80 text-[10px] font-extrabold text-[#2F5B9E] shrink-0">
              本地固定晴天
            </span>
          </section>

          {/* Dialogue Notification Settings */}
          <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-3.5 space-y-2.5">
            <h3 className="text-sm font-extrabold text-[#4A3531]">對話提醒設定</h3>

            <label className="flex items-center justify-between gap-2 min-h-[44px] cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <CloudSun className="w-4 h-4 text-[#2F5B9E] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#4A3531]">關閉「天氣閒聊」</div>
                  <div className="text-[11px] text-[#7D635D]">不主動跳出晴雨天氣話題</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.muteWeatherChat}
                onChange={(e) => onUpdateSettings({ muteWeatherChat: e.target.checked })}
                className="w-5 h-5 accent-[#FF7A9E] rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-2 min-h-[44px] cursor-pointer border-t border-[#F4EAE4] pt-2">
              <div className="flex items-center gap-2 min-w-0">
                <Moon className="w-4 h-4 text-[#6A56A6] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#4A3531]">關閉「夜間通知」</div>
                  <div className="text-[11px] text-[#7D635D]">晚上 20:00 至清晨前不主動彈出閒聊</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.muteNightNotice}
                onChange={(e) => onUpdateSettings({ muteNightNotice: e.target.checked })}
                className="w-5 h-5 accent-[#FF7A9E] rounded shrink-0"
              />
            </label>

            <label className="flex items-center justify-between gap-2 min-h-[44px] cursor-pointer border-t border-[#F4EAE4] pt-2">
              <div className="flex items-center gap-2 min-w-0">
                <BellOff className="w-4 h-4 text-[#C4315B] shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-[#4A3531]">關閉「全部主動對話」</div>
                  <div className="text-[11px] text-[#7D635D]">主畫面不再自動彈出對話氣泡</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.muteAllProactive}
                onChange={(e) => onUpdateSettings({ muteAllProactive: e.target.checked })}
                className="w-5 h-5 accent-[#FF7A9E] rounded shrink-0"
              />
            </label>
          </section>

          {/* Recent Memory Events */}
          <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D64470]" />
                <h3 className="text-sm font-extrabold text-[#4A3531]">短期事件記憶</h3>
              </div>
              <span className="text-[11px] font-bold text-[#826862] tabular-nums">
                最近 {memoryEvents.length} / 20 筆
              </span>
            </div>

            {memoryEvents.length === 0 ? (
              <p className="text-xs text-[#8D746E] py-2">
                餵食、摸摸、洗澡或收到夥伴留言後，{pet.name}都會悄悄記在心裡喔！
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {memoryEvents.slice(0, 8).map((ev) => (
                  <span
                    key={ev.id}
                    className="px-2.5 py-1 rounded-xl bg-[#FFF7EC] border border-[#F2DFD5] text-[11px] font-bold text-[#5A423C]"
                  >
                    {ev.detail || ev.type} · {formatDialogueTimestamp(ev.createdAt)}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Past Dialogues List */}
          <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <MessageSquareText className="w-4 h-4 text-[#256D57]" />
                <h3 className="text-sm font-extrabold text-[#4A3531]">歷史對話紀錄</h3>
              </div>
              <span className="text-[11px] font-bold text-[#826862] tabular-nums">
                共 {history.length} 則
              </span>
            </div>

            {history.length === 0 ? (
              <div className="rounded-2xl bg-[#FAF4EE] border border-[#EDE0D7] py-6 px-3 text-center">
                <p className="text-xs text-[#8D746E]">
                  目前還沒有主動對話紀錄，陪 {pet.name} 待一會兒就會出現可愛對話囉！
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((line) => {
                  const meta = DIALOGUE_CATEGORY_META[line.category];
                  return (
                    <article
                      key={line.id}
                      className="rounded-2xl bg-[#FFFDF8] border border-[#EFE0D7] p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-extrabold ${meta.badgeClass}`}
                        >
                          <span aria-hidden="true">{meta.emoji}</span>
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] font-bold text-[#957B74] tabular-nums">
                          {formatDialogueTimestamp(line.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#4A3531] leading-relaxed">
                        {line.text}
                      </p>
                      {line.respondedLabel && (
                        <div className="text-[11px] font-extrabold text-[#256D57] bg-[#E8F8F2] rounded-xl px-2.5 py-1 inline-block">
                          你的回應：{line.respondedLabel}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
