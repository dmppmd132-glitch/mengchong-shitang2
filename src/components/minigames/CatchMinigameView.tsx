import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Wind, Zap } from 'lucide-react';
import { CatchGameMode, Pet } from '../../types';
import { MinigameDifficultyProfile, MinigameResult } from '../../types/minigame';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';

interface CatchMinigameViewProps {
  mode: CatchGameMode;
  pet: Pet;
  soundEnabled: boolean;
  usedPaidReplay: boolean;
  difficulty: MinigameDifficultyProfile;
  onComplete: (result: MinigameResult) => void;
}

interface FallingItem {
  id: number;
  x: number;
  y: number;
  speed: number;
  swayPhase: number;
  swayFreq: number;
  swayAmp: number;
  kind: 'normal' | 'bonus' | 'hazard';
  emoji: string;
  points: number;
}

interface FloatingHit {
  id: number;
  x: number;
  text: string;
  isPositive: boolean;
}

type WindDirection = -1 | 0 | 1;

const ROUND_SECONDS = 25;
const DASH_DURATION_MS = 650;
const DASH_COOLDOWN_MS = 1600;

const CATCH_MODE_META: Record<
  CatchGameMode,
  {
    title: string;
    normalEmoji: string;
    bonusEmoji: string;
    hazardEmoji: string;
    legendText: string;
    bgGradient: string;
    borderColor: string;
  }
> = {
  apple: {
    title: '蘋果接接樂',
    normalEmoji: '🍎',
    bonusEmoji: '🍏',
    hazardEmoji: '🪱',
    legendText: '🍎 +2 · 🍏 +5 · 🪱 -2',
    bgGradient: 'from-[#E2F4FF] via-[#F2FBF0] to-[#FFF6D6]',
    borderColor: '#B5DFC4',
  },
  fries: {
    title: '薯條接接樂',
    normalEmoji: '🍟',
    bonusEmoji: '🍔',
    hazardEmoji: '🌶️',
    legendText: '🍟 +2 · 🍔 +5 · 🌶️ -3',
    bgGradient: 'from-[#FFF1C4] via-[#FFE6B8] to-[#FFD8CC]',
    borderColor: '#F0C070',
  },
};

export const CatchMinigameView: React.FC<CatchMinigameViewProps> = ({
  mode,
  pet,
  soundEnabled,
  usedPaidReplay,
  difficulty,
  onComplete,
}) => {
  const [playerX, setPlayerX] = useState<number>(50);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_SECONDS);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [hits, setHits] = useState<FloatingHit[]>([]);
  const [windDir, setWindDir] = useState<WindDirection>(1);
  const [dashActive, setDashActive] = useState<boolean>(false);
  const [dashReady, setDashReady] = useState<boolean>(true);
  const [waveBanner, setWaveBanner] = useState<string>('');

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const playerXRef = useRef<number>(50);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const itemsRef = useRef<FallingItem[]>([]);
  const rafRef = useRef<number | null>(null);
  const holdDirRef = useRef<-1 | 0 | 1>(0);
  const keysPressedRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const nextIdRef = useRef<number>(1);
  const lastSpawnAtRef = useRef<number>(0);
  const lastWindShiftAtRef = useRef<number>(0);
  const windDirRef = useRef<WindDirection>(1);
  const dashUntilRef = useRef<number>(0);
  const dashCooldownUntilRef = useRef<number>(0);
  const roundStartAtRef = useRef<number>(0);
  const finishedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    holdDirRef.current = 0;
    keysPressedRef.current = { left: false, right: false };
  }, []);

  const spawnHitFeedback = useCallback((x: number, text: string, isPositive: boolean) => {
    const id = nextIdRef.current++;
    setHits((prev) => [...prev.slice(-4), { id, x, text, isPositive }]);
    window.setTimeout(() => {
      setHits((prev) => prev.filter((h) => h.id !== id));
    }, 620);
  }, []);

  const triggerDash = useCallback(() => {
    if (mode !== 'fries') return;
    const now = performance.now();
    if (now < dashCooldownUntilRef.current) return;
    dashUntilRef.current = now + DASH_DURATION_MS;
    dashCooldownUntilRef.current = now + DASH_COOLDOWN_MS;
    setDashActive(true);
    setDashReady(false);
    soundFX.dash(soundEnabled);
    triggerHaptic(15);

    window.setTimeout(() => {
      setDashActive(false);
    }, DASH_DURATION_MS);
    window.setTimeout(() => {
      setDashReady(true);
    }, DASH_COOLDOWN_MS);
  }, [mode, soundEnabled]);

  useEffect(() => {
    stopLoop();
    playerXRef.current = 50;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    itemsRef.current = [];
    finishedRef.current = false;
    const nowStart = performance.now();
    roundStartAtRef.current = nowStart;
    lastSpawnAtRef.current = nowStart - 350;
    lastWindShiftAtRef.current = nowStart;
    const initialWind: WindDirection = Math.random() > 0.5 ? 1 : -1;
    windDirRef.current = mode === 'apple' ? initialWind : 0;
    setWindDir(windDirRef.current);
    setCombo(0);
    setDashActive(false);
    setDashReady(true);
    setWaveBanner('');

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressedRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressedRef.current.right = true;
      } else if ((e.key === 'Shift' || e.key === ' ') && mode === 'fries') {
        e.preventDefault();
        triggerDash();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysPressedRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let lastFrameTime = performance.now();
    const cfg = CATCH_MODE_META[mode];

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
      lastFrameTime = now;

      const elapsedSec = (now - roundStartAtRef.current) / 1000;
      const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - elapsedSec));
      setTimeLeft(remaining);

      if (mode === 'apple' && now - lastWindShiftAtRef.current >= 5200) {
        lastWindShiftAtRef.current = now;
        const dirs: WindDirection[] = [-1, 0, 1];
        const candidates = dirs.filter((d) => d !== windDirRef.current);
        const nextWind = candidates[Math.floor(Math.random() * candidates.length)];
        windDirRef.current = nextWind;
        setWindDir(nextWind);
        soundFX.bubble(soundEnabled);
      }

      let moveDir = holdDirRef.current;
      if (keysPressedRef.current.left && !keysPressedRef.current.right) moveDir = -1;
      if (keysPressedRef.current.right && !keysPressedRef.current.left) moveDir = 1;

      if (moveDir !== 0) {
        const isDashing = mode === 'fries' && now < dashUntilRef.current;
        const baseSpeed = mode === 'fries' ? 76 : 68;
        const speed = isDashing ? baseSpeed * 1.9 : baseSpeed;
        const nextX = Math.min(89, Math.max(11, playerXRef.current + moveDir * speed * dt));
        playerXRef.current = nextX;
        setPlayerX(nextX);
      }

      if (mode === 'apple') {
        const baseInterval = Math.max(460, 660 - elapsedSec * 7.5);
        const spawnInterval = baseInterval * difficulty.spawnMultiplier;
        if (now - lastSpawnAtRef.current >= spawnInterval) {
          lastSpawnAtRef.current = now;
          const hazardChance = Math.min(0.26, 0.18 * difficulty.hazardMultiplier);
          const roll = Math.random();
          const kind: FallingItem['kind'] =
            roll < hazardChance ? 'hazard' : roll < hazardChance + 0.18 ? 'bonus' : 'normal';
          const newItem: FallingItem = {
            id: nextIdRef.current++,
            x: 16 + Math.random() * 68,
            y: -6,
            speed: (30 + Math.random() * 14 + elapsedSec * 0.35) * difficulty.speedMultiplier,
            swayPhase: Math.random() * Math.PI * 2,
            swayFreq: 2.1 + Math.random() * 1.3,
            swayAmp: (14 + Math.random() * 10) * difficulty.speedMultiplier,
            kind,
            emoji:
              kind === 'hazard'
                ? cfg.hazardEmoji
                : kind === 'bonus'
                ? cfg.bonusEmoji
                : cfg.normalEmoji,
            points: kind === 'hazard' ? (difficulty.tier === 'relaxed' ? -1 : -2) : kind === 'bonus' ? 5 : 2,
          };
          itemsRef.current = [...itemsRef.current, newItem];
        }
      } else {
        const baseBatchInterval = Math.max(760, 1020 - elapsedSec * 10);
        const batchInterval = baseBatchInterval * difficulty.spawnMultiplier;
        if (now - lastSpawnAtRef.current >= batchInterval) {
          lastSpawnAtRef.current = now;
          const clusterCount = difficulty.tier === 'relaxed' ? 2 : Math.random() < 0.45 ? 3 : 2;
          const anchorX = 16 + Math.random() * 68;
          const batch: FallingItem[] = [];
          const hasChiliInCluster = Math.random() < Math.min(0.7, 0.54 * difficulty.hazardMultiplier);
          if (hasChiliInCluster) {
            setWaveBanner('🍟 成串出鍋中！閃開紅辣椒');
          } else {
            setWaveBanner('');
          }

          for (let i = 0; i < clusterCount; i += 1) {
            const offset = (i - (clusterCount - 1) / 2) * 14;
            const itemX = Math.min(90, Math.max(10, anchorX + offset));
            const isBonus = i === 0 && Math.random() < 0.25;
            batch.push({
              id: nextIdRef.current++,
              x: itemX,
              y: -6 - i * 8,
              speed: (50 + Math.random() * 14 + elapsedSec * 0.5) * difficulty.speedMultiplier,
              swayPhase: 0,
              swayFreq: 0,
              swayAmp: 0,
              kind: isBonus ? 'bonus' : 'normal',
              emoji: isBonus ? cfg.bonusEmoji : cfg.normalEmoji,
              points: isBonus ? 5 : 2,
            });
          }

          if (hasChiliInCluster) {
            const chiliOffset = Math.random() > 0.5 ? 18 : -18;
            const chiliX = Math.min(90, Math.max(10, anchorX + chiliOffset));
            batch.push({
              id: nextIdRef.current++,
              x: chiliX,
              y: -10,
              speed: (53 + Math.random() * 12 + elapsedSec * 0.45) * difficulty.speedMultiplier,
              swayPhase: 0,
              swayFreq: 0,
              swayAmp: 0,
              kind: 'hazard',
              emoji: cfg.hazardEmoji,
              points: difficulty.tier === 'relaxed' ? -2 : -3,
            });
          }

          itemsRef.current = [...itemsRef.current, ...batch];
        }
      }

      const nextItems: FallingItem[] = [];
      let scoreDelta = 0;
      const windPush = mode === 'apple' ? windDirRef.current * 18 * difficulty.speedMultiplier : 0;
      const catchWidth = 12.5 * difficulty.windowMultiplier;

      for (const item of itemsRef.current) {
        const nextY = item.y + item.speed * dt;
        let nextX = item.x;

        if (mode === 'apple') {
          const swayVel = Math.sin(elapsedSec * item.swayFreq + item.swayPhase) * item.swayAmp;
          nextX = item.x + (windPush + swayVel) * dt;
          if (nextX < 8) nextX = 8;
          if (nextX > 92) nextX = 92;
        }

        const inCatchBand = nextY >= 74 && nextY <= 89;
        const dx = Math.abs(nextX - playerXRef.current);

        if (inCatchBand && dx <= catchWidth) {
          if (item.kind === 'hazard') {
            scoreDelta += item.points;
            comboRef.current = 0;
            setCombo(0);
            soundFX.miss(soundEnabled);
            triggerHaptic(28);
            spawnHitFeedback(nextX, `${item.points}`, false);
          } else {
            comboRef.current += 1;
            if (comboRef.current > maxComboRef.current) {
              maxComboRef.current = comboRef.current;
            }
            setCombo(comboRef.current);
            const comboBonus = comboRef.current >= 4 && comboRef.current % 3 === 0 ? 1 : 0;
            const gained = item.points + comboBonus;
            scoreDelta += gained;
            if (item.kind === 'bonus') {
              soundFX.heart(soundEnabled);
              triggerHaptic(14);
              spawnHitFeedback(nextX, `+${gained}`, true);
            } else if (comboBonus > 0) {
              soundFX.combo(soundEnabled, comboRef.current);
              spawnHitFeedback(nextX, `連擊 +${gained}`, true);
            } else {
              soundFX.pop(soundEnabled);
              spawnHitFeedback(nextX, `+${gained}`, true);
            }
          }
          continue;
        }

        if (nextY <= 104) {
          nextItems.push({ ...item, x: nextX, y: nextY });
        }
      }

      itemsRef.current = nextItems;
      setItems(nextItems);

      if (scoreDelta !== 0) {
        const updatedScore = Math.max(0, scoreRef.current + scoreDelta);
        scoreRef.current = updatedScore;
        setScore(updatedScore);
      }

      if (elapsedSec >= ROUND_SECONDS) {
        stopLoop();
        if (!finishedRef.current) {
          finishedRef.current = true;
          soundFX.levelUp(soundEnabled);
          onCompleteRef.current({
            gameId: mode,
            score: scoreRef.current,
            maxCombo: maxComboRef.current,
            usedPaidReplay,
            playedAt: Date.now(),
          });
        }
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      stopLoop();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [difficulty, mode, soundEnabled, spawnHitFeedback, stopLoop, triggerDash, usedPaidReplay]);

  const updatePointerPosition = (clientX: number) => {
    const el = arenaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = Math.min(89, Math.max(11, pct));
    playerXRef.current = clamped;
    setPlayerX(clamped);
  };

  const cfg = CATCH_MODE_META[mode];
  const windText =
    windDir === -1 ? '🍃 微風向左 ◀' : windDir === 1 ? '🍃 微風向右 ▶' : '🌤️ 風向平穩';

  return (
    <div className="space-y-2.5 overflow-x-hidden">
      <div className="flex items-center justify-between px-1 text-xs font-extrabold tabular-nums">
        <span className="text-[#D64470]">得分 {score}</span>
        {combo >= 3 ? (
          <span
            key={combo}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFE4C4] text-[#B84A00] animate-combo-pop"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{combo} 連擊</span>
          </span>
        ) : (
          <span className="text-[#826862]">{cfg.legendText}</span>
        )}
        <span className={timeLeft <= 5 ? 'text-[#D64470]' : 'text-[#5A423C]'}>
          {timeLeft}秒
        </span>
      </div>

      <div
        ref={arenaRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          updatePointerPosition(e.clientX);
        }}
        onPointerMove={(e) => {
          if (e.buttons > 0 || e.pointerType === 'touch') {
            updatePointerPosition(e.clientX);
          }
        }}
        style={{ borderColor: cfg.borderColor }}
        className={`relative w-full h-[288px] rounded-2xl border-2 bg-gradient-to-b ${cfg.bgGradient} overflow-hidden select-none touch-none`}
      >
        {mode === 'apple' ? (
          <div className="absolute top-2 inset-x-3 flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-[#B5DFC4] px-3 py-0.5 text-[11px] font-extrabold text-[#256D57] shadow-2xs">
              <Wind className="w-3.5 h-3.5" />
              <span>{windText}（蘋果會飄移，請預判落點）</span>
            </span>
          </div>
        ) : (
          <div className="absolute top-2 inset-x-3 flex items-center justify-center pointer-events-none">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/85 border border-[#F0C070] px-3 py-0.5 text-[11px] font-extrabold text-[#9D5B12] shadow-2xs">
              <span>{waveBanner || '🍟 薯條高速成串掉落 · 善用加速躲辣椒！'}</span>
            </span>
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute text-2xl leading-none pointer-events-none select-none will-change-transform"
            aria-hidden="true"
          >
            {item.emoji}
          </div>
        ))}

        {hits.map((hit) => (
          <div
            key={hit.id}
            style={{
              left: `${hit.x}%`,
              bottom: '74px',
              transform: 'translateX(-50%)',
            }}
            className={`absolute text-sm font-extrabold pointer-events-none animate-float-up ${
              hit.isPositive ? 'text-[#256D57]' : 'text-[#D64470]'
            }`}
          >
            {hit.text}
          </div>
        ))}

        <div
          style={{
            left: `${playerX}%`,
            bottom: '6px',
            transform: 'translateX(-50%)',
          }}
          className="absolute flex flex-col items-center pointer-events-none will-change-transform"
        >
          {dashActive && (
            <span className="text-[10px] font-extrabold text-[#D95700] mb-0.5 animate-pulse">
              ⚡ 加速中!
            </span>
          )}
          <div
            className={`mb-[-14px] w-14 h-5 rounded-b-xl rounded-t-sm border-2 border-[#5A3E36] z-10 flex items-center justify-center text-[10px] font-extrabold text-[#4A3531] ${
              dashActive ? 'bg-[#FFD54F]' : 'bg-[#E6B066]'
            }`}
          >
            🧺
          </div>
          <PiggyCharacter
            species={pet.species}
            growth={pet.growth}
            roundness={pet.roundness}
            action="walking"
            equipped={pet.accessories}
            interactive={false}
            size={66}
          />
        </div>
      </div>

      {mode === 'apple' ? (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onPointerDown={() => {
              holdDirRef.current = -1;
            }}
            onPointerUp={() => {
              holdDirRef.current = 0;
            }}
            onPointerLeave={() => {
              holdDirRef.current = 0;
            }}
            onPointerCancel={() => {
              holdDirRef.current = 0;
            }}
            className="min-h-[48px] rounded-2xl bg-[#E7F7EF] border-2 border-[#A2DEC0] text-[#1F6B54] font-extrabold text-sm inline-flex items-center justify-center gap-1 active:scale-95 select-none touch-none"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>往左接</span>
          </button>
          <button
            type="button"
            onPointerDown={() => {
              holdDirRef.current = 1;
            }}
            onPointerUp={() => {
              holdDirRef.current = 0;
            }}
            onPointerLeave={() => {
              holdDirRef.current = 0;
            }}
            onPointerCancel={() => {
              holdDirRef.current = 0;
            }}
            className="min-h-[48px] rounded-2xl bg-[#E7F7EF] border-2 border-[#A2DEC0] text-[#1F6B54] font-extrabold text-sm inline-flex items-center justify-center gap-1 active:scale-95 select-none touch-none"
          >
            <span>往右接</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onPointerDown={() => {
              holdDirRef.current = -1;
            }}
            onPointerUp={() => {
              holdDirRef.current = 0;
            }}
            onPointerLeave={() => {
              holdDirRef.current = 0;
            }}
            onPointerCancel={() => {
              holdDirRef.current = 0;
            }}
            className="min-h-[48px] rounded-2xl bg-[#FFF3D1] border-2 border-[#F2CE6D] text-[#7A540E] font-extrabold text-sm inline-flex items-center justify-center gap-1 active:scale-95 select-none touch-none"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>左</span>
          </button>
          <button
            type="button"
            disabled={!dashReady}
            onPointerDown={(e) => {
              e.preventDefault();
              triggerDash();
            }}
            className={`min-h-[48px] rounded-2xl border-2 font-extrabold text-xs inline-flex items-center justify-center gap-1 transition select-none touch-none ${
              dashActive
                ? 'bg-[#FF9F43] border-[#D97706] text-white scale-95'
                : dashReady
                ? 'bg-[#FFE1A8] border-[#F0A53A] text-[#8B4800] active:scale-95'
                : 'bg-[#F3EAE4] border-[#DFD2CA] text-[#9E8B84] cursor-not-allowed'
            }`}
          >
            <Zap className="w-4 h-4 shrink-0" />
            <span>{dashActive ? '衝刺中' : dashReady ? '短暫加速' : '冷卻中'}</span>
          </button>
          <button
            type="button"
            onPointerDown={() => {
              holdDirRef.current = 1;
            }}
            onPointerUp={() => {
              holdDirRef.current = 0;
            }}
            onPointerLeave={() => {
              holdDirRef.current = 0;
            }}
            onPointerCancel={() => {
              holdDirRef.current = 0;
            }}
            className="min-h-[48px] rounded-2xl bg-[#FFF3D1] border-2 border-[#F2CE6D] text-[#7A540E] font-extrabold text-sm inline-flex items-center justify-center gap-1 active:scale-95 select-none touch-none"
          >
            <span>右</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
