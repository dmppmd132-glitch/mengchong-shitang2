import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Camera,
  Cloud,
  MessageCircleHeart,
  MessageSquareText,
  Minus,
  NotebookPen,
  Plus,
  RotateCcw,
  Scale,
  Send,
  Sparkles,
  Users,
} from 'lucide-react';
import { getRoundnessTier } from '../data/growth';
import {
  CloudSyncStatus,
  CloudUser,
  EncyclopediaState,
  Pet,
  PetPersonality,
  RoomPhotoRecord,
  SharedHouse,
  SharedPetRoom,
  TitleId,
  WeightLog,
} from '../types';
import { clampWeight, formatLocalDate, roundWeight } from '../utils/storage';
import { EncyclopediaSection, EncyclopediaView } from './EncyclopediaView';
import { RoomPhotoCard } from './house/RoomPhotoCard';
import { PersonalityProfileView } from './PersonalityProfileView';

interface JournalViewProps {
  pet: Pet;
  personality: PetPersonality;
  weightLogs: WeightLog[];
  onRecordWeight: (newWeight: number, note?: string) => void;
  onRequestReset: () => void;
  cloudUser?: CloudUser | null;
  syncStatus?: CloudSyncStatus;
  onOpenCloudAuth?: () => void;
  sharedRoom?: SharedPetRoom | null;
  onOpenSharedPet?: () => void;
  messageCount?: number;
  onOpenMessageBoard?: () => void;
  encyclopedia: EncyclopediaState;
  unlockedAccessories: string[];
  house: SharedHouse;
  initialSection?: 'journal' | 'personality' | 'encyclopedia';
  initialEncyclopediaSection?: EncyclopediaSection;
  onOpenHousePhotoMode?: () => void;
  onSharePhotoToBoard?: (photo: RoomPhotoRecord, caption: string) => Promise<string | null>;
  onSelectTitle?: (titleId: TitleId | null) => void;
  dialogueCount?: number;
  onOpenDialogueHistory?: () => void;
}

interface ChartPoint {
  dateStr: string;
  label: string;
  weight: number;
}

export const JournalView: React.FC<JournalViewProps> = ({
  pet,
  personality,
  weightLogs,
  onRecordWeight,
  onRequestReset,
  cloudUser = null,
  syncStatus = 'local',
  onOpenCloudAuth,
  sharedRoom = null,
  onOpenSharedPet,
  messageCount = 0,
  onOpenMessageBoard,
  encyclopedia,
  unlockedAccessories,
  house,
  initialSection = 'journal',
  initialEncyclopediaSection = 'foods',
  onOpenHousePhotoMode,
  onSharePhotoToBoard,
  onSelectTitle,
  dialogueCount = 0,
  onOpenDialogueHistory,
}) => {
  const [section, setSection] = useState<'journal' | 'personality' | 'encyclopedia'>(
    initialSection
  );
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [inputWeight, setInputWeight] = useState<string>(pet.weight.toFixed(1));
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedPoint, setSelectedPoint] = useState<ChartPoint | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [sharedPhotoNotice, setSharedPhotoNotice] = useState<string>('');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const roundnessTier = getRoundnessTier(pet.roundness);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    const today = new Date();
    const mapByDate = new Map<string, number>();

    const sorted = [...weightLogs].sort((a, b) => a.timestamp - b.timestamp);
    for (const rec of sorted) {
      mapByDate.set(rec.date, rec.weight);
    }

    const pts: ChartPoint[] = [];
    let lastKnownWeight: number | null = null;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - (rangeDays - 1));
    const startStr = formatLocalDate(startDate);
    for (const rec of sorted) {
      if (rec.date < startStr) {
        lastKnownWeight = rec.weight;
      }
    }

    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = formatLocalDate(d);
      const month = d.getMonth() + 1;
      const day = d.getDate();

      if (mapByDate.has(dateStr)) {
        lastKnownWeight = mapByDate.get(dateStr)!;
        pts.push({
          dateStr,
          label: `${month}/${day}`,
          weight: lastKnownWeight,
        });
      } else if (i === 0) {
        pts.push({
          dateStr,
          label: `${month}/${day}`,
          weight: lastKnownWeight ?? pet.weight,
        });
      } else if (lastKnownWeight !== null) {
        pts.push({
          dateStr,
          label: `${month}/${day}`,
          weight: lastKnownWeight,
        });
      }
    }

    if (pts.length === 0) {
      pts.push({
        dateStr: formatLocalDate(today),
        label: `${today.getMonth() + 1}/${today.getDate()}`,
        weight: pet.weight,
      });
    }

    return pts;
  }, [weightLogs, rangeDays, pet.weight]);

  const svgW = 340;
  const svgH = 160;
  const padL = 38;
  const padR = 14;
  const padT = 18;
  const padB = 26;
  const innerW = svgW - padL - padR;
  const innerH = svgH - padT - padB;

  const weights = chartPoints.map((p) => p.weight);
  const rawMin = Math.min(...weights);
  const rawMax = Math.max(...weights);
  const minW = roundWeight(Math.max(1, rawMin - 0.6));
  const maxW = roundWeight(rawMax + 0.6);
  const spanW = Math.max(1, maxW - minW);

  const coords = chartPoints.map((pt, idx) => {
    const x =
      chartPoints.length === 1
        ? padL + innerW / 2
        : padL + (idx / (chartPoints.length - 1)) * innerW;
    const y = padT + (1 - (pt.weight - minW) / spanW) * innerH;
    return { ...pt, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const areaPath =
    coords.length > 0
      ? `M ${coords[0].x.toFixed(1)} ${(padT + innerH).toFixed(1)} ` +
        coords.map((c) => `L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ') +
        ` L ${coords[coords.length - 1].x.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`
      : '';

  const handleStep = (delta: number) => {
    const cur = parseFloat(inputWeight);
    const base = Number.isFinite(cur) ? cur : pet.weight;
    const next = clampWeight(base + delta);
    setInputWeight(next.toFixed(1));
  };

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputWeight);
    if (!Number.isFinite(parsed) || parsed < 0.5 || parsed > 30) {
      setFeedbackMsg('請輸入 0.5 ～ 30.0 kg 之間的數值');
      return;
    }
    const clean = clampWeight(parsed);
    setInputWeight(clean.toFixed(1));
    onRecordWeight(clean, customNote.trim() || undefined);
    setCustomNote('');
    setFeedbackMsg(`已記錄體重 ${clean.toFixed(1)} kg！`);
    setTimeout(() => setFeedbackMsg(''), 2400);
  };

  const activePoint = selectedPoint ?? chartPoints[chartPoints.length - 1];

  return (
    <div className="px-4 pt-3 pb-24 space-y-4">
      <div className="grid grid-cols-3 gap-1.5 bg-[#F2E5DE] p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setSection('journal')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
            section === 'journal'
              ? 'bg-white text-[#D64470] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <NotebookPen className="w-3.5 h-3.5 shrink-0" />
          <span>成長手帳</span>
        </button>
        <button
          type="button"
          onClick={() => setSection('personality')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
            section === 'personality'
              ? 'bg-white text-[#9D5B12] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>個性檔案</span>
        </button>
        <button
          type="button"
          onClick={() => setSection('encyclopedia')}
          className={`min-h-[42px] rounded-xl text-xs font-extrabold inline-flex items-center justify-center gap-1 transition ${
            section === 'encyclopedia'
              ? 'bg-white text-[#256D57] shadow-xs'
              : 'text-[#7D635D] hover:text-[#4A3531]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>收集圖鑑</span>
        </button>
      </div>

      {section === 'encyclopedia' ? (
        <EncyclopediaView
          encyclopedia={encyclopedia}
          unlockedAccessories={unlockedAccessories}
          house={house}
          initialSection={initialEncyclopediaSection}
          onSelectTitle={onSelectTitle}
        />
      ) : section === 'personality' ? (
        <PersonalityProfileView pet={pet} personality={personality} />
      ) : (
        <>
      <section className="rounded-3xl bg-gradient-to-r from-[#FFEAF0] to-[#FFF6DA] border-2 border-[#F5DFD7] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#826862]">目前體重與體態</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#4A3531] tabular-nums">
                {pet.weight.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-[#6E544E]">kg</span>
              <span className="text-sm font-extrabold text-[#D64470]">
                · {roundnessTier.label}
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/80 border border-[#F5D6DF] flex items-center justify-center text-[#D64470]">
            <Scale className="w-6 h-6" />
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6E544E] leading-relaxed">
          {roundnessTier.description}
        </p>
      </section>

      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#4A3531]">體重成長曲線</h2>
            <p className="text-xs font-bold text-[#826862] tabular-nums">
              {activePoint.dateStr}：{activePoint.weight.toFixed(1)} kg
            </p>
          </div>
          <div className="flex items-center gap-1 bg-[#F6ECE6] p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setRangeDays(7);
                setSelectedPoint(null);
              }}
              className={`min-h-[34px] px-2.5 rounded-lg text-xs font-extrabold transition ${
                rangeDays === 7 ? 'bg-white text-[#D64470] shadow-xs' : 'text-[#7D635D]'
              }`}
            >
              最近 7 天
            </button>
            <button
              type="button"
              onClick={() => {
                setRangeDays(30);
                setSelectedPoint(null);
              }}
              className={`min-h-[34px] px-2.5 rounded-lg text-xs font-extrabold transition ${
                rangeDays === 30 ? 'bg-white text-[#D64470] shadow-xs' : 'text-[#7D635D]'
              }`}
            >
              最近 30 天
            </button>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
            <defs>
              <linearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FF7A9E" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#FF7A9E" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((ratio) => {
              const y = padT + ratio * innerH;
              const val = roundWeight(maxW - ratio * spanW);
              return (
                <g key={ratio}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={svgW - padR}
                    y2={y}
                    stroke="#EFE1DA"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                  <text
                    x={padL - 6}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="700"
                    fill="#957B74"
                  >
                    {val.toFixed(1)}
                  </text>
                </g>
              );
            })}

            {coords.length > 1 && <path d={areaPath} fill="url(#weightArea)" />}
            {coords.length > 1 && (
              <polyline
                fill="none"
                stroke="#FF7A9E"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={polylinePoints}
              />
            )}

            {coords.map((c, idx) => {
              const showLabel =
                coords.length <= 7 ||
                idx === 0 ||
                idx === coords.length - 1 ||
                idx === Math.floor(coords.length / 2);
              const isSelected = activePoint.dateStr === c.dateStr;

              return (
                <g key={c.dateStr}>
                  <circle
                    cx={c.x}
                    cy={c.y}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#FF7A9E' : '#FFFFFF'}
                    stroke="#FF7A9E"
                    strokeWidth="2.5"
                    className="cursor-pointer"
                    onClick={() => setSelectedPoint(c)}
                  />
                  {showLabel && (
                    <text
                      x={c.x}
                      y={svgH - 6}
                      textAnchor="middle"
                      fontSize="10"
                      fontWeight="700"
                      fill="#957B74"
                    >
                      {c.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </section>

      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 space-y-3">
        <h2 className="text-base font-extrabold text-[#4A3531]">手動記錄或調整體重</h2>
        <form onSubmit={handleWeightSubmit} className="space-y-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep(-0.1)}
              aria-label="減少 0.1 公斤"
              className="min-h-[46px] min-w-[46px] rounded-2xl bg-[#F7ECE6] text-[#4A3531] flex items-center justify-center hover:bg-[#EEDCD3] active:scale-95 transition"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 relative">
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="30"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                aria-label="體重公斤數"
                className="w-full min-h-[46px] rounded-2xl bg-[#FFF8EB] border border-[#EFD7BD] px-4 pr-10 text-center text-lg font-extrabold text-[#4A3531] tabular-nums focus:outline-none focus:border-[#FF7A9E]"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#826862]">
                kg
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleStep(0.1)}
              aria-label="增加 0.1 公斤"
              className="min-h-[46px] min-w-[46px] rounded-2xl bg-[#F7ECE6] text-[#4A3531] flex items-center justify-center hover:bg-[#EEDCD3] active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              maxLength={24}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="備註（例如：散步後量體重）"
              className="flex-1 min-w-0 min-h-[44px] rounded-2xl bg-[#FFFDF8] border border-[#EED9D0] px-3.5 text-base font-medium text-[#4A3531] placeholder:text-xs placeholder:text-[#B5A19B] focus:outline-none focus:border-[#FF7A9E]"
            />
            <button
              type="submit"
              className="min-h-[44px] px-4 rounded-2xl bg-[#5CC9A7] text-white text-xs font-extrabold shadow-[0_3px_0_#3BA886] hover:bg-[#4DBE9B] active:translate-y-0.5 transition whitespace-nowrap shrink-0"
            >
              記錄體重
            </button>
          </div>

          {feedbackMsg && (
            <p className="text-xs font-bold text-[#256D57]">{feedbackMsg}</p>
          )}
        </form>
      </section>

      {/* 小屋紀念相簿 */}
      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold text-[#4A3531]">📸 小屋紀念相簿</h2>
            <p className="text-xs text-[#7D635D]">
              在「佈置小屋 → 拍照」留下的合照都會收藏在這裡
            </p>
          </div>
          {onOpenHousePhotoMode && (
            <button
              type="button"
              onClick={onOpenHousePhotoMode}
              className="min-h-[40px] px-3 rounded-2xl bg-[#FFEAF0] border border-[#F5C6D4] text-xs font-extrabold text-[#B83B64] inline-flex items-center gap-1 shrink-0 active:scale-95 transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>去拍照</span>
            </button>
          )}
        </div>

        {sharedPhotoNotice && (
          <p className="rounded-2xl bg-[#E5F8F0] border border-[#AEE3D0] px-3 py-2 text-xs font-extrabold text-[#1F6B54]">
            ✨ {sharedPhotoNotice}
          </p>
        )}

        {house.photos.length === 0 ? (
          <div className="rounded-2xl bg-[#FFF9F2] border border-[#EFE0D7] py-5 px-3 text-center space-y-2">
            <p className="text-xs text-[#8D746E]">
              還沒有拍攝小屋合照喔，佈置完房間快和 {pet.name} 合照一張吧！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {house.photos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="space-y-1.5">
                <RoomPhotoCard photo={photo} />
                {onSharePhotoToBoard && (
                  <button
                    type="button"
                    onClick={() => {
                      void onSharePhotoToBoard(photo, photo.caption).then((err) => {
                        setSharedPhotoNotice(
                          err ? err : `已將「${photo.title}」分享到留言板！`
                        );
                        window.setTimeout(() => setSharedPhotoNotice(''), 2600);
                      });
                    }}
                    className="w-full min-h-[40px] rounded-2xl bg-[#FFF3D8] border border-[#F2CE6D] text-xs font-extrabold text-[#8A5610] inline-flex items-center justify-center gap-1.5 hover:bg-[#FFE9BF] active:scale-[0.99] transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>分享這張合照到留言板</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#4A3531]">餵食與體重紀錄</h2>
          <span className="text-xs font-bold text-[#826862] tabular-nums">
            共 {weightLogs.length} 筆
          </span>
        </div>

        {weightLogs.length === 0 ? (
          <p className="py-6 text-center text-xs text-[#8D746E]">
            目前還沒有紀錄喔，餵小豬吃飯或手動量體重就會自動記在手帳裡！
          </p>
        ) : (
          <div className="divide-y divide-[#F4E6DF]">
            {weightLogs.slice(0, 30).map((rec) => {
              const deltaText =
                rec.weightDelta > 0
                  ? `+${rec.weightDelta.toFixed(1)} kg`
                  : rec.weightDelta < 0
                  ? `${rec.weightDelta.toFixed(1)} kg`
                  : '無變化';
              const deltaColor =
                rec.weightDelta > 0
                  ? 'text-[#D64470]'
                  : rec.weightDelta < 0
                  ? 'text-[#258064]'
                  : 'text-[#826862]';

              return (
                <div key={rec.id} className="py-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-extrabold text-[#4A3531]">
                        {rec.foodName}
                      </span>
                      <span className="text-[11px] font-bold text-[#957B74] tabular-nums">
                        {rec.date} {rec.timeStr}
                      </span>
                    </div>
                    <p className="text-xs text-[#7D635D] mt-0.5">{rec.note}</p>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <div className={`text-xs font-extrabold ${deltaColor}`}>
                      {deltaText}
                    </div>
                    <div className="text-[11px] font-bold text-[#826862]">
                      {rec.weight.toFixed(1)} kg
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {onOpenDialogueHistory && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#4A3531]">寵物對話紀錄與設定</h2>
            <p className="text-xs text-[#7D635D] mt-0.5 truncate">
              已保存 {dialogueCount} 則主動對話，可關閉天氣與夜間通知
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenDialogueHistory}
            className="min-h-[44px] px-4 rounded-2xl bg-[#EAF3FF] border border-[#B6D1FA] text-xs font-extrabold text-[#2F5B9E] inline-flex items-center gap-1.5 hover:bg-[#DCEBFF] active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>對話紀錄</span>
          </button>
        </section>
      )}

      {onOpenMessageBoard && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#4A3531]">小豬留言板與貼圖</h2>
            <p className="text-xs text-[#7D635D] mt-0.5 truncate">
              目前已累積 {messageCount} 則留言與可愛貼圖
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenMessageBoard}
            className="min-h-[44px] px-4 rounded-2xl bg-[#FFF3D8] border border-[#F2D59B] text-xs font-extrabold text-[#8A5A12] inline-flex items-center gap-1.5 hover:bg-[#FFE9BF] active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <MessageCircleHeart className="w-3.5 h-3.5" />
            <span>開啟留言板</span>
          </button>
        </section>
      )}

      {onOpenSharedPet && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#4A3531]">兩人共養與邀請碼</h2>
            <p className="text-xs text-[#7D635D] mt-0.5 truncate">
              {sharedRoom
                ? `共養中 · 邀請碼 ${sharedRoom.inviteCode}`
                : '產生邀請碼或輸入夥伴邀請碼一起養小豬'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenSharedPet}
            className="min-h-[44px] px-4 rounded-2xl bg-[#FFF0F4] border border-[#F5C4D3] text-xs font-extrabold text-[#B83B64] inline-flex items-center gap-1.5 hover:bg-[#FFE3EC] active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{sharedRoom ? '共養管理' : '建立 / 加入'}</span>
          </button>
        </section>
      )}

      {onOpenCloudAuth && (
        <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-[#4A3531]">雲端存檔與帳號</h2>
            <p className="text-xs text-[#7D635D] mt-0.5 truncate">
              {cloudUser
                ? `${cloudUser.email}（${
                    syncStatus === 'synced'
                      ? '已同步'
                      : syncStatus === 'syncing'
                      ? '同步中…'
                      : syncStatus === 'error'
                      ? '同步異常'
                      : '本機暫存'
                  }）`
                : '登入帳號即可跨裝置備份與同步進度'}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenCloudAuth}
            className="min-h-[44px] px-4 rounded-2xl bg-[#E3F7F0] border border-[#AEE3D0] text-xs font-extrabold text-[#256D57] inline-flex items-center gap-1.5 hover:bg-[#D2F2E7] active:scale-95 transition whitespace-nowrap shrink-0"
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>{cloudUser ? '管理同步' : '登入 / 註冊'}</span>
          </button>
        </section>
      )}

      <section className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD7] p-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-[#4A3531]">存檔與重置管理</h2>
          <p className="text-xs text-[#7D635D] mt-0.5">想重新孵化一隻新小豬時可重置存檔</p>
        </div>
        <button
          type="button"
          onClick={onRequestReset}
          className="min-h-[44px] px-4 rounded-2xl bg-[#FFE9EF] border border-[#F5B4C6] text-xs font-extrabold text-[#C4315B] inline-flex items-center gap-1.5 hover:bg-[#FFD9E3] active:scale-95 transition whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>重置遊戲</span>
        </button>
      </section>
      </>
      )}
    </div>
  );
};
