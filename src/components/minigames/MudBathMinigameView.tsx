import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Droplets, Flame, Sparkles } from 'lucide-react';
import { SPECIES_BATH_REACTIONS } from '../../data/minigames';
import { Pet, PetExpression } from '../../types';
import { MinigameDifficultyProfile, MinigameResult } from '../../types/minigame';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';

interface MudBathMinigameViewProps {
  pet: Pet;
  soundEnabled: boolean;
  usedPaidReplay: boolean;
  difficulty: MinigameDifficultyProfile;
  onComplete: (result: MinigameResult) => void;
}

type SpotKind = 'mud' | 'leaf' | 'bubble' | 'chili' | 'eyeSoap';

interface BathSpot {
  id: number;
  kind: SpotKind;
  x: number;
  y: number;
  emoji: string;
}

interface CleanParticle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  label: string;
  positive: boolean;
}

const ROUND_SECONDS = 30;
const MESS_PER_WAVE = 10;

function createBathWave(
  startId: number,
  difficulty: MinigameDifficultyProfile
): { spots: BathSpot[]; nextId: number } {
  let id = startId;
  const spots: BathSpot[] = [];

  const mudPositions = [
    { x: 30, y: 54 },
    { x: 68, y: 56 },
    { x: 48, y: 66 },
    { x: 38, y: 38 },
  ];
  for (const pos of mudPositions) {
    spots.push({
      id: id++,
      kind: 'mud',
      x: pos.x + (Math.random() * 8 - 4),
      y: pos.y + (Math.random() * 6 - 3),
      emoji: '🟫',
    });
  }

  spots.push({
    id: id++,
    kind: 'leaf',
    x: 64 + (Math.random() * 8 - 4),
    y: 35 + (Math.random() * 6 - 3),
    emoji: '🍂',
  });
  spots.push({
    id: id++,
    kind: 'leaf',
    x: 26 + (Math.random() * 6 - 3),
    y: 66 + (Math.random() * 6 - 3),
    emoji: '🍁',
  });

  const bubblePositions = [
    { x: 33, y: 28 },
    { x: 54, y: 46 },
    { x: 70, y: 42 },
    { x: 56, y: 68 },
  ];
  for (const pos of bubblePositions) {
    spots.push({
      id: id++,
      kind: 'bubble',
      x: pos.x + (Math.random() * 6 - 3),
      y: pos.y + (Math.random() * 6 - 3),
      emoji: '🫧',
    });
  }

  // Lv.1-2 gets 1 hazard; Lv.3+ gets both chili and eye soap hazards
  spots.push({
    id: id++,
    kind: 'chili',
    x: Math.random() > 0.5 ? 22 : 78,
    y: 48 + (Math.random() * 14 - 7),
    emoji: '🌶️',
  });
  if (difficulty.tier !== 'relaxed') {
    spots.push({
      id: id++,
      kind: 'eyeSoap',
      x: 49 + (Math.random() * 6 - 3),
      y: 31,
      emoji: '🧼',
    });
  }

  return { spots, nextId: id };
}

export const MudBathMinigameView: React.FC<MudBathMinigameViewProps> = ({
  pet,
  soundEnabled,
  usedPaidReplay,
  difficulty,
  onComplete,
}) => {
  const initialWave = useRef(createBathWave(1, difficulty));
  const [spots, setSpots] = useState<BathSpot[]>(initialWave.current.spots);
  const [particles, setParticles] = useState<CleanParticle[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_SECONDS);
  const [isRinsing, setIsRinsing] = useState<boolean>(false);
  const [towelProgress, setTowelProgress] = useState<number>(0);
  const [bathCount, setBathCount] = useState<number>(0);
  const [petExpression, setPetExpression] = useState<PetExpression>('normal');

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const towelTrackRef = useRef<HTMLDivElement | null>(null);
  const nextIdRef = useRef<number>(initialWave.current.nextId);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const bathCountRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const lastSwipeHitAtRef = useRef<number>(0);
  const towelLastXRef = useRef<number | null>(null);
  const isSwipingRef = useRef<boolean>(false);
  const isDraggingTowelRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reaction = SPECIES_BATH_REACTIONS[pet.species];

  const spawnParticle = useCallback(
    (x: number, y: number, emoji: string, label: string, positive: boolean) => {
      const id = nextIdRef.current++;
      setParticles((prev) => [...prev.slice(-5), { id, x, y, emoji, label, positive }]);
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id));
      }, 540);
    },
    []
  );

  const addScore = useCallback((delta: number) => {
    const next = Math.max(0, scoreRef.current + delta);
    scoreRef.current = next;
    setScore(next);
  }, []);

  const incrementCombo = useCallback(() => {
    comboRef.current += 1;
    if (comboRef.current > maxComboRef.current) {
      maxComboRef.current = comboRef.current;
    }
    setCombo(comboRef.current);
  }, []);

  const triggerHazard = useCallback(
    (x: number, y: number, label: string) => {
      const penalty = difficulty.tier === 'relaxed' ? -1 : -2;
      soundFX.miss(soundEnabled);
      triggerHaptic(30);
      comboRef.current = 0;
      setCombo(0);
      addScore(penalty);
      setPetExpression('ticklish');
      spawnParticle(x, y, '💥', `${label} ${penalty}`, false);
      window.setTimeout(() => setPetExpression('normal'), 600);
    },
    [addScore, difficulty.tier, soundEnabled, spawnParticle]
  );

  useEffect(() => {
    const startAt = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - elapsed));
      setTimeLeft(remaining);
      if (elapsed >= ROUND_SECONDS && !finishedRef.current) {
        finishedRef.current = true;
        window.clearInterval(timer);
        soundFX.levelUp(soundEnabled);
        onCompleteRef.current({
          gameId: 'mudBath',
          score: scoreRef.current,
          maxCombo: maxComboRef.current,
          bathCompleted: bathCountRef.current > 0,
          usedPaidReplay,
          playedAt: Date.now(),
        });
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [soundEnabled, usedPaidReplay]);

  useEffect(() => {
    if (!isRinsing) return;
    const rinseTick = () => {
      setSpots((prev) => {
        const bubbleIdx = prev.findIndex((s) => s.kind === 'bubble');
        if (bubbleIdx === -1) return prev;
        const target = prev[bubbleIdx];
        const next = [...prev];
        next.splice(bubbleIdx, 1);
        soundFX.splash(soundEnabled);
        triggerHaptic(10);
        incrementCombo();
        addScore(1);
        spawnParticle(target.x, target.y, '💧', '沖乾淨 +1', true);
        return next;
      });
    };
    rinseTick();
    const interval = window.setInterval(rinseTick, 230);
    return () => window.clearInterval(interval);
  }, [addScore, incrementCombo, isRinsing, soundEnabled, spawnParticle]);

  const handleArenaPointerAt = (clientX: number, clientY: number) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const px = ((clientX - rect.left) / rect.width) * 100;
    const py = ((clientY - rect.top) / rect.height) * 100;

    const now = performance.now();
    if (now - lastSwipeHitAtRef.current < 55) return;

    const hitRadius = 15.5 * difficulty.windowMultiplier;

    setSpots((prev) => {
      let hitIndex = -1;
      for (let i = 0; i < prev.length; i += 1) {
        const spot = prev[i];
        const dist = Math.hypot(spot.x - px, spot.y - py);
        if (dist <= hitRadius) {
          hitIndex = i;
          break;
        }
      }
      if (hitIndex === -1) return prev;

      const target = prev[hitIndex];
      if (target.kind === 'bubble') {
        return prev;
      }

      lastSwipeHitAtRef.current = now;
      const next = [...prev];
      next.splice(hitIndex, 1);

      if (target.kind === 'chili') {
        triggerHazard(target.x, target.y, '碰到辣椒');
      } else if (target.kind === 'eyeSoap') {
        triggerHazard(target.x, target.y, '泡泡進眼');
      } else if (target.kind === 'mud') {
        soundFX.scrub(soundEnabled);
        triggerHaptic(10);
        incrementCombo();
        addScore(1);
        spawnParticle(target.x, target.y, '✨', '擦掉泥巴 +1', true);
      } else if (target.kind === 'leaf') {
        soundFX.scrub(soundEnabled);
        triggerHaptic(10);
        incrementCombo();
        addScore(1);
        spawnParticle(target.x, target.y, '🌿', '清掉落葉 +1', true);
      }
      return next;
    });
  };

  const remainingMudAndLeaves = spots.filter(
    (s) => s.kind === 'mud' || s.kind === 'leaf'
  ).length;
  const remainingBubbles = spots.filter((s) => s.kind === 'bubble').length;
  const remainingMess = remainingMudAndLeaves + remainingBubbles;

  const spotsCleared = MESS_PER_WAVE - remainingMess;
  const waveCleanPercent = Math.min(
    100,
    Math.round((spotsCleared / MESS_PER_WAVE) * 80 + (towelProgress / 100) * 20)
  );

  const activeStep: 1 | 2 | 3 =
    remainingMudAndLeaves > 0 ? 1 : remainingBubbles > 0 ? 2 : 3;

  const advanceTowelSwipe = (clientX: number) => {
    if (!towelTrackRef.current) return;
    if (towelLastXRef.current === null) {
      towelLastXRef.current = clientX;
      return;
    }
    const dx = Math.abs(clientX - towelLastXRef.current);
    if (dx < 5) return;
    towelLastXRef.current = clientX;

    setTowelProgress((prev) => {
      if (prev >= 100) return prev;
      const gain =
        remainingMess === 0 ? Math.min(28, dx * 0.65) : Math.min(10, dx * 0.16);
      const next = Math.min(100, prev + gain);
      if (next >= 100) {
        soundFX.combo(soundEnabled, 3);
        triggerHaptic(22);
        incrementCombo();
        addScore(5);
        bathCountRef.current += 1;
        setBathCount(bathCountRef.current);
        spawnParticle(50, 46, '🌟', '擦乾完成 +5！', true);
        const fresh = createBathWave(nextIdRef.current, difficulty);
        nextIdRef.current = fresh.nextId;
        window.setTimeout(() => {
          setSpots(fresh.spots);
          setTowelProgress(0);
        }, 300);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2 overflow-x-hidden">
      <div className="flex items-center justify-between px-1 text-xs font-extrabold tabular-nums">
        <span className="text-[#1F6B54]">
          得分 {score} · 完成 {bathCount} 輪
        </span>
        {combo >= 3 ? (
          <span
            key={combo}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFE4C4] text-[#B84A00] animate-combo-pop"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{combo} 連清</span>
          </span>
        ) : (
          <span className="text-[#6E544E]">{reaction.actionLabel}</span>
        )}
        <span className={timeLeft <= 5 ? 'text-[#D64470]' : 'text-[#5A423C]'}>
          {timeLeft}秒
        </span>
      </div>

      <div className="rounded-xl bg-[#EEF9F5] border border-[#BDE7D8] px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#1F6B54] tabular-nums">
          <span>本輪清潔度進度</span>
          <span>{waveCleanPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-white overflow-hidden">
          <div
            className="h-full rounded-full bg-[#3BA886] transition-all duration-150"
            style={{ width: `${waveCleanPercent}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-extrabold pt-0.5">
          <span
            className={`rounded-lg py-0.5 ${
              activeStep === 1
                ? 'bg-[#3BA886] text-white'
                : remainingMudAndLeaves === 0
                ? 'bg-[#D7F2E7] text-[#1F6B54]'
                : 'text-[#7D635D]'
            }`}
          >
            1. 滑動擦泥 ({remainingMudAndLeaves})
          </span>
          <span
            className={`rounded-lg py-0.5 ${
              activeStep === 2
                ? 'bg-[#2C8EBC] text-white'
                : remainingBubbles === 0 && remainingMudAndLeaves === 0
                ? 'bg-[#D7F2E7] text-[#1F6B54]'
                : 'text-[#7D635D]'
            }`}
          >
            2. 按住沖水 ({remainingBubbles})
          </span>
          <span
            className={`rounded-lg py-0.5 ${
              activeStep === 3 ? 'bg-[#E6A222] text-white' : 'text-[#7D635D]'
            }`}
          >
            3. 拖曳擦乾
          </span>
        </div>
      </div>

      <div
        ref={arenaRef}
        onPointerDown={(e) => {
          isSwipingRef.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          handleArenaPointerAt(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (isSwipingRef.current || e.buttons > 0) {
            handleArenaPointerAt(e.clientX, e.clientY);
          }
        }}
        onPointerUp={() => {
          isSwipingRef.current = false;
        }}
        onPointerCancel={() => {
          isSwipingRef.current = false;
        }}
        className="relative w-full h-[214px] rounded-2xl border-2 border-[#AEE3D0] bg-gradient-to-b from-[#E7F8F3] via-[#F4FCFA] to-[#D9F2EA] overflow-hidden flex flex-col items-center justify-center select-none touch-none"
      >
        {isRinsing && (
          <div
            className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#7CD4F8]/45 to-transparent pointer-events-none flex justify-around pt-2"
            aria-hidden="true"
          >
            <span className="text-xl">💧</span>
            <span className="text-2xl">🚿</span>
            <span className="text-xl">💧</span>
          </div>
        )}

        <PiggyCharacter
          species={pet.species}
          growth={pet.growth}
          roundness={pet.roundness}
          action="bathing"
          expression={petExpression}
          equipped={pet.accessories}
          interactive={false}
          customAnimClass={reaction.animClass}
          size={144}
        />

        {spots.map((spot) => {
          const isHazard = spot.kind === 'chili' || spot.kind === 'eyeSoap';
          return (
            <div
              key={spot.id}
              style={{
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute pointer-events-none select-none ${
                isHazard
                  ? 'w-9 h-9 rounded-full bg-[#FFE5EC]/80 border border-[#FF7A9E] flex items-center justify-center text-xl'
                  : spot.kind === 'bubble'
                  ? 'text-3xl'
                  : 'text-2xl drop-shadow-xs'
              }`}
              aria-hidden="true"
            >
              {spot.emoji}
            </div>
          );
        })}

        {particles.map((pt) => (
          <div
            key={pt.id}
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            className="absolute pointer-events-none flex flex-col items-center animate-clean-spark z-20"
          >
            <span className="text-xl leading-none">{pt.emoji}</span>
            <span
              className={`text-[11px] font-extrabold px-1.5 rounded-full whitespace-nowrap ${
                pt.positive
                  ? 'bg-[#E5F7EF] text-[#1F6B54]'
                  : 'bg-[#FFE5EC] text-[#C83B67]'
              }`}
            >
              {pt.label}
            </span>
          </div>
        ))}

        <p className="absolute bottom-1.5 inset-x-2 text-center text-[11px] font-bold text-[#336958] pointer-events-none">
          {activeStep === 1
            ? '用手指在寵物身上來回滑動擦掉泥巴與落葉（避開紅圈🌶️🧼）'
            : activeStep === 2
            ? '泥巴擦完啦！按住下方水龍頭沖掉所有泡泡'
            : '太乾淨了！左右拖曳下方毛巾擦乾 +5 分'}
        </p>
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onPointerDown={() => setIsRinsing(true)}
          onPointerUp={() => setIsRinsing(false)}
          onPointerLeave={() => setIsRinsing(false)}
          onPointerCancel={() => setIsRinsing(false)}
          className={`w-full min-h-[46px] rounded-2xl border-2 font-extrabold text-sm inline-flex items-center justify-center gap-2 transition select-none touch-none ${
            isRinsing
              ? 'bg-[#4EB6E5] border-[#2C8EBC] text-white scale-[0.98]'
              : activeStep === 2
              ? 'bg-[#CBEFFD] border-[#3FA9DB] text-[#115575] shadow-xs'
              : 'bg-[#E4F6FD] border-[#96D7F4] text-[#1D6385] hover:bg-[#D5F0FB]'
          }`}
        >
          <Droplets className="w-4 h-4" />
          <span>
            {isRinsing
              ? '沖水中！泡泡正在沖走…'
              : `按住水龍頭沖掉泡泡（剩 ${remainingBubbles} 顆）`}
          </span>
        </button>

        <div
          ref={towelTrackRef}
          onPointerDown={(e) => {
            isDraggingTowelRef.current = true;
            towelLastXRef.current = e.clientX;
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (isDraggingTowelRef.current) {
              advanceTowelSwipe(e.clientX);
            }
          }}
          onPointerUp={() => {
            isDraggingTowelRef.current = false;
            towelLastXRef.current = null;
          }}
          onPointerCancel={() => {
            isDraggingTowelRef.current = false;
            towelLastXRef.current = null;
          }}
          className={`relative w-full min-h-[48px] rounded-2xl border-2 overflow-hidden flex items-center justify-center select-none touch-none cursor-ew-resize ${
            activeStep === 3
              ? 'border-[#E6A222] bg-[#FFF5D1] shadow-xs'
              : 'border-[#E6DAD4] bg-[#FAF4F0]'
          }`}
        >
          <div
            className="absolute inset-y-0 left-0 bg-[#FFE082]/80 transition-all duration-75"
            style={{ width: `${towelProgress}%` }}
          />
          <div className="relative z-10 flex items-center gap-1.5 text-xs font-extrabold text-[#5A423C] tabular-nums pointer-events-none">
            <Sparkles className="w-4 h-4 text-[#D99B26]" />
            <span>
              🧻 左右拖曳毛巾擦乾 {pet.name}（{Math.round(towelProgress)}%）
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
