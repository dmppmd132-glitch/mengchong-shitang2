import React, { useEffect, useRef, useState } from 'react';
import { Loader2, MessageCircleHeart, Send, Smile, Trash2, X } from 'lucide-react';
import { getStickerById, PET_STICKERS } from '../data/stickers';
import { PetMessage, PetStickerId, RoomPhotoRecord, SharedPetRoom } from '../types';
import { PiggySticker } from './PiggySticker';
import { RoomPhotoCard } from './house/RoomPhotoCard';

interface MessageBoardModalProps {
  open: boolean;
  onClose: () => void;
  petName: string;
  messages: PetMessage[];
  roomPhotos?: RoomPhotoRecord[];
  loading: boolean;
  error: string | null;
  currentUserId: string | null;
  sharedRoom: SharedPetRoom | null;
  onSendMessage: (content: string, stickerId: PetStickerId | null) => Promise<string | null>;
  onDeleteMessage: (messageId: string) => Promise<void>;
}

const PHOTO_TAG_REGEX = /\[photo:([^\]]+)\]/;

function parseMessagePhotoTag(content: string): { cleanText: string; photoId: string | null } {
  const match = PHOTO_TAG_REGEX.exec(content);
  if (!match) return { cleanText: content, photoId: null };
  const cleanText = content.replace(PHOTO_TAG_REGEX, '').trim();
  return { cleanText, photoId: match[1] };
}

function formatMessageTime(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const MessageBoardModal: React.FC<MessageBoardModalProps> = ({
  open,
  onClose,
  petName,
  messages,
  roomPhotos = [],
  loading,
  error,
  currentUserId,
  sharedRoom,
  onSendMessage,
  onDeleteMessage,
}) => {
  const [text, setText] = useState<string>('');
  const [selectedSticker, setSelectedSticker] = useState<PetStickerId | null>(null);
  const [stickerDrawerOpen, setStickerDrawerOpen] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string>('');
  const listEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(timer);
  }, [open, messages.length]);

  if (!open) return null;

  const activeStickerInfo = getStickerById(selectedSticker);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed && !selectedSticker) {
      setLocalError('請輸入留言或選擇一張可愛貼圖喔！');
      return;
    }

    setLocalError('');
    setSubmitting(true);
    try {
      const err = await onSendMessage(trimmed, selectedSticker);
      if (err) {
        setLocalError(err);
      } else {
        setText('');
        setSelectedSticker(null);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-xs px-3 py-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="message-board-title"
    >
      <div className="w-full max-w-[400px] max-h-[90dvh] flex flex-col rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] shadow-2xl overflow-hidden">
        <div className="px-4 py-3.5 bg-gradient-to-r from-[#FFEAF0] to-[#FFF6DA] border-b border-[#F3DCE3] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/90 text-[#D64470] flex items-center justify-center shrink-0">
              <MessageCircleHeart className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 id="message-board-title" className="text-base font-extrabold text-[#4A3531] truncate">
                {petName}的小豬留言板
              </h2>
              <p className="text-[11px] font-bold text-[#7D635D] truncate">
                {sharedRoom
                  ? '兩人共養即時同步中 · 傳貼圖給夥伴'
                  : '寫下照顧悄悄話，或貼上可愛小豬貼圖'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="關閉留言板"
            className="min-h-[44px] min-w-[44px] rounded-2xl bg-white/80 text-[#5A3E36] flex items-center justify-center hover:bg-white transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-[180px] overflow-y-auto px-4 py-3 space-y-3 bg-[#FFF8ED]">
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs font-bold text-[#826862]">
              <Loader2 className="w-5 h-5 animate-spin text-[#FF7A9E]" />
              <span>正在讀取留言板…</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="py-8 flex flex-col items-center text-center gap-2">
              <PiggySticker stickerId="heart" size={72} />
              <p className="text-sm font-extrabold text-[#4A3531]">還沒有任何留言喔！</p>
              <p className="text-xs text-[#7D635D] max-w-[240px] leading-relaxed">
                {sharedRoom
                  ? '選一張可愛貼圖或寫一句話，夥伴手機上會馬上收到通知。'
                  : '替小豬留下第一則照顧日記或貼圖吧！'}
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine =
                msg.authorId === 'local' ||
                (currentUserId !== null && msg.authorId === currentUserId);
              const stickerInfo = getStickerById(msg.stickerId);
              const { cleanText, photoId } = parseMessagePhotoTag(msg.content);
              const matchedPhoto = photoId
                ? roomPhotos.find((p) => p.id === photoId) ?? null
                : null;

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="text-[11px] font-extrabold text-[#7D635D]">
                      {isMine ? '我' : msg.authorName}
                    </span>
                    <span className="text-[10px] font-bold text-[#A58E87] tabular-nums">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`group relative max-w-[85%] rounded-2xl px-3.5 py-2.5 border ${
                      isMine
                        ? 'bg-[#FFEAF0] border-[#F6C8D6] text-[#4A3531]'
                        : 'bg-white border-[#EFE0D8] text-[#4A3531]'
                    }`}
                  >
                    {msg.stickerId && (
                      <div className="flex flex-col items-center my-0.5">
                        <PiggySticker stickerId={msg.stickerId} size={74} />
                        {stickerInfo && !cleanText && !matchedPhoto && (
                          <span className="mt-1 text-[11px] font-extrabold text-[#B84A6F]">
                            {stickerInfo.label}
                          </span>
                        )}
                      </div>
                    )}

                    {matchedPhoto && (
                      <div className="my-1.5 w-[240px] max-w-full">
                        <RoomPhotoCard photo={matchedPhoto} compact />
                      </div>
                    )}

                    {!matchedPhoto && photoId && (
                      <div className="my-1 rounded-xl bg-[#FFF8EE] border border-[#EED9C4] px-2.5 py-1.5 text-[11px] font-bold text-[#8A5A12]">
                        📸 分享了一張小屋合照（早期相片已不在最新 24 張相簿內）
                      </div>
                    )}

                    {cleanText && (
                      <p className="text-sm font-medium leading-relaxed break-words whitespace-pre-wrap">
                        {cleanText}
                      </p>
                    )}

                    {isMine && (
                      <button
                        type="button"
                        onClick={() => {
                          void onDeleteMessage(msg.id);
                        }}
                        aria-label="刪除這則留言"
                        title="刪除留言"
                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-[#A86C7E] hover:text-[#C4315B]"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>刪除</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={listEndRef} />
        </div>

        {(error || localError) && (
          <div className="px-4 py-2 bg-[#FFE9EF] border-t border-[#F5C6D4] text-xs font-bold text-[#C4315B]">
            {localError || error}
          </div>
        )}

        {stickerDrawerOpen && (
          <div className="px-3.5 py-2.5 bg-[#FFFDF8] border-t border-[#F4DFD7] shrink-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-[#7D635D]">
                選擇可愛小豬貼圖
              </span>
              {activeStickerInfo && (
                <button
                  type="button"
                  onClick={() => setSelectedSticker(null)}
                  className="text-[11px] font-extrabold text-[#D64470]"
                >
                  取消選擇（{activeStickerInfo.label}）
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {PET_STICKERS.map((sticker) => {
                const isSelected = selectedSticker === sticker.id;
                return (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() =>
                      setSelectedSticker((prev) =>
                        prev === sticker.id ? null : sticker.id
                      )
                    }
                    className={`flex flex-col items-center justify-center rounded-2xl py-1.5 px-1 border-2 transition active:scale-95 ${
                      isSelected
                        ? 'bg-[#FFEAF0] border-[#FF7A9E] shadow-xs'
                        : 'bg-[#FFF9F2] border-transparent hover:border-[#F4DFD7]'
                    }`}
                  >
                    <PiggySticker stickerId={sticker.id} size={42} />
                    <span className="mt-0.5 text-[10px] font-extrabold text-[#5A3E36]">
                      {sticker.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#FFFDF8] border-t border-[#F4DFD7] space-y-2 shrink-0"
        >
          {activeStickerInfo && (
            <div className="flex items-center justify-between gap-2 rounded-xl bg-[#FFEAF0] px-3 py-1.5 text-xs font-bold text-[#B83B64]">
              <span>已附帶貼圖：{activeStickerInfo.label}</span>
              <button
                type="button"
                onClick={() => setSelectedSticker(null)}
                aria-label="移除已選貼圖"
                className="text-[#B83B64] hover:text-[#8F284A]"
              >
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStickerDrawerOpen((prev) => !prev)}
              aria-label={stickerDrawerOpen ? '收合貼圖盤' : '展開貼圖盤'}
              className={`min-h-[44px] min-w-[44px] rounded-2xl flex items-center justify-center border transition shrink-0 ${
                stickerDrawerOpen
                  ? 'bg-[#FFEAF0] border-[#F5B9CB] text-[#D64470]'
                  : 'bg-[#F7ECE6] border-[#E8D5CD] text-[#5A3E36]'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            <input
              type="text"
              maxLength={120}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (localError) setLocalError('');
              }}
              placeholder="輸入給小豬或夥伴的話…"
              className="flex-1 min-w-0 min-h-[44px] rounded-2xl bg-white border border-[#EED9D0] px-3.5 text-base font-medium text-[#4A3531] placeholder:text-xs placeholder:text-[#BBA7A2] focus:outline-none focus:border-[#FF7A9E]"
            />

            <button
              type="submit"
              disabled={submitting || (!text.trim() && !selectedSticker)}
              aria-label="送出留言"
              className="min-h-[44px] px-3.5 rounded-2xl bg-[#FF7A9E] text-white text-xs font-extrabold shadow-[0_3px_0_#D9577B] hover:bg-[#F76890] active:translate-y-0.5 transition inline-flex items-center gap-1 whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{!text.trim() && selectedSticker ? '送貼圖' : '送出'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
