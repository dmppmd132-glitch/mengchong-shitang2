import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flame, Music } from 'lucide-react';
import { SPECIES_RHYTHM_REACTIONS } from '../../data/minigames';
import { Pet } from '../../types';
import { MinigameDifficultyProfile, MinigameResult } from '../../types/minigame';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';

interface PetRhythmMinigameViewProps {
  pet: Pet;
  soundEnabled: boolean;
  usedPaidReplay: boolean;
  difficulty: MinigameDifficultyProfile;
  onComplete: (result: MinigameResult) => void;
}

interface RhythmNote {
  id: number;
  x: number;
  emoji: string;
  speed: number;
}

type JudgmentLabel = 'Perfect!' | 'Good' | 'Miss';

const ROUND_SECONDS = 40;
const HIT_ZONE_X = 20;
const BASE_PERFECT_WINDOW = 9.5;
const BASE_GOOD_WINDOW = 18.5;
const NOTE_ICONS = ['🎵', '🩷', '🍎', '🍮'];

export const PetRhythmMinigameView: React.FC<PetRhythmMinigameViewProps> = ({
  pet,
  soundEnabled,
  usedPaidReplay,
  difficulty,
  onComplete,
}) => {
  const [notes, setNotes] = useState<RhythmNote[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [perfectCount, setPerfectCount] = useState<number>(0);
  const [goodCount, setGoodCount] = useState<number>(0);
  const [missCount, setMissCount] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_SECONDS);
  const [judgment, setJudgment] = useState<{ label: JudgmentLabel; key: number } | null>(
    null
  );
  const [ringPulse, setRingPulse] = useState<'idle' | 'perfect' | 'good'>('idle');

  const notesRef = useRef<RhythmNote[]>([]);
  const scoreRef = useRef<number>(0);
  const comboRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const perfectRef = useRef<number>(0);
  const goodRef = useRef<number>(0);
  const missRef = useRef<number>(0);
  const nextIdRef = useRef<number>(1);
  const beatIndexRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const finishedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const reaction = SPECIES_RHYTHM_REACTIONS[pet.species];
  const perfectWindow = BASE_PERFECT_WINDOW * difficulty.windowMultiplier;
  const goodWindow = BASE_GOOD_WINDOW * difficulty.windowMultiplier;

  const showJudgment = useCallback((label: JudgmentLabel) => {
    setJudgment({ label, key: nextIdRef.current++ });
  }, []);

  useEffect(() => {
    finishedRef.current = false;
    notesRef.current = [];
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    perfectRef.current = 0;
    goodRef.current = 0;
    missRef.current = 0;

    const roundStart = performance.now();
    let lastFrame = roundStart;
    let lastBeatAt = roundStart - 350;

    const step = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;

      const elapsed = (now - roundStart) / 1000;
      const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - elapsed));
      setTimeLeft(remaining);

      const baseInterval = Math.max(600, 780 - elapsed * 4.5);
      const beatInterval = baseInterval * difficulty.spawnMultiplier;
      if (now - lastBeatAt >= beatInterval && elapsed < ROUND_SECONDS - 1.8) {
        lastBeatAt = now;
        const beatNum = beatIndexRef.current++;
        soundFX.rhythmBeat(soundEnabled, beatNum);
        const emoji = NOTE_ICONS[beatNum % NOTE_ICONS.length];
        const newNote: RhythmNote = {
          id: nextIdRef.current++,
          x: 98,
          emoji,
          speed: (30 + Math.min(10, elapsed * 0.25)) * difficulty.speedMultiplier,
        };
        notesRef.current = [...notesRef.current, newNote];
      }

      const nextNotes: RhythmNote[] = [];
      let missedThisFrame = false;

      for (const note of notesRef.current) {
        const nextX = note.x - note.speed * dt;
        if (nextX < HIT_ZONE_X - goodWindow) {
          missedThisFrame = true;
          continue;
        }
        nextNotes.push({ ...note, x: nextX });
      }

      if (missedThisFrame) {
        comboRef.current = 0;
        missRef.current += 1;
        setCombo(0);
        setMissCount(missRef.current);
        showJudgment('Miss');
      }

      notesRef.current = nextNotes;
      setNotes(nextNotes);

      if (elapsed >= ROUND_SECONDS) {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
        if (!finishedRef.current) {
          finishedRef.current = true;
          soundFX.levelUp(soundEnabled);
          onCompleteRef.current({
            gameId: 'petRhythm',
            score: scoreRef.current,
            maxCombo: maxComboRef.current,
            perfectCount: perfectRef.current,
            goodCount: goodRef.current,
            missCount: missRef.current,
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
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [difficulty, goodWindow, showJudgment, soundEnabled, usedPaidReplay]);

  const handleTapBeat = useCallback(() => {
    if (finishedRef.current) return;

    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < notesRef.current.length; i += 1) {
      const dist = Math.abs(notesRef.current[i].x - HIT_ZONE_X);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx === -1 || bestDist > goodWindow) {
      comboRef.current = 0;
      missRef.current += 1;
      setCombo(0);
      setMissCount(missRef.current);
      soundFX.miss(soundEnabled);
      triggerHaptic(24);
      showJudgment('Miss');
      return;
    }

    const updated = [...notesRef.current];
    updated.splice(bestIdx, 1);
    notesRef.current = updated;
    setNotes(updated);

    if (bestDist <= perfectWindow) {
      comboRef.current += 1;
      perfectRef.current += 1;
      if (comboRef.current > maxComboRef.current) {
        maxComboRef.current = comboRef.current;
        setMaxCombo(comboRef.current);
      }
      const gained = 8 + Math.min(8, (comboRef.current - 1) * 2);
      scoreRef.current += gained;
      setScore(scoreRef.current);
      setCombo(comboRef.current);
      setPerfectCount(perfectRef.current);
      setRingPulse('perfect');
      window.setTimeout(() => setRingPulse('idle'), 130);
      triggerHaptic(16);
      if (comboRef.current >= 3) {
        soundFX.combo(soundEnabled, comboRef.current);
      } else {
        soundFX.rhythmPerfect(soundEnabled);
      }
      showJudgment('Perfect!');
    } else {
      goodRef.current += 1;
      comboRef.current = 0;
      scoreRef.current += 4;
      setScore(scoreRef.current);
      setCombo(0);
      setGoodCount(goodRef.current);
      setRingPulse('good');
      window.setTimeout(() => setRingPulse('idle'), 130);
      triggerHaptic(10);
      soundFX.rhythmGood(soundEnabled);
      showJudgment('Good');
    }
  }, [goodWindow, perfectWindow, showJudgment, soundEnabled]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleTapBeat();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleTapBeat]);

  return (
    <div className="space-y-2.5 overflow-x-hidden">
      <div className="flex items-center justify-between px-1 text-xs font-extrabold tabular-nums">
        <span className="text-[#5A3EA6]">得分 {score}</span>
        {combo >= 2 ? (
          <span
            key={combo}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFE7B3] text-[#8F5306] animate-combo-pop"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{combo} Perfect 連擊！</span>
          </span>
        ) : (
          <span className="text-[#826862]">
            P:{perfectCount} · G:{goodCount}
          </span>
        )}
        <span className={timeLeft <= 6 ? 'text-[#D64470]' : 'text-[#5A423C]'}>
          {timeLeft}秒
        </span>
      </div>

      <div className="relative rounded-2xl border-2 border-[#D2C6F5] bg-gradient-to-b from-[#F5F1FF] to-[#FFF6FB] px-3 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <PiggyCharacter
            species={pet.species}
            growth={pet.growth}
            roundness={pet.roundness}
            action="walking"
            expression={combo >= 3 ? 'sparkle' : 'normal'}
            equipped={pet.accessories}
            interactive={false}
            customAnimClass={reaction.animClass}
            size={82}
          />
          <div className="min-w-0">
            <p className="text-xs font-extrabold text-[#5A3EA6]">{reaction.danceLabel}</p>
            <p className="text-[11px] font-bold text-[#7D635D] leading-snug mt-0.5">
              {combo >= 3 ? `太讚了！Perfect ${combo} 連擊加分中！` : reaction.speech}
            </p>
          </div>
        </div>

        {judgment && (
          <span
            key={judgment.key}
            className={`text-sm font-extrabold shrink-0 px-2.5 py-1 rounded-xl animate-combo-pop ${
              judgment.label === 'Perfect!'
                ? 'bg-[#FFE7B3] text-[#8F5306]'
                : judgment.label === 'Good'
                ? 'bg-[#E4F7EE] text-[#1F6B54]'
                : 'bg-[#FFE5EC] text-[#C83B67]'
            }`}
          >
            {judgment.label}
          </span>
        )}
      </div>

      <div
        onPointerDown={(e) => {
          e.preventDefault();
          handleTapBeat();
        }}
        className="relative w-full h-[96px] rounded-2xl border-2 border-[#C7B7F2] bg-[#FAF7FF] overflow-hidden select-none touch-none cursor-pointer"
      >
        <div
          className="absolute inset-x-4 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#E5DCF8]"
          aria-hidden="true"
        />

        <div
          style={{ left: `${HIT_ZONE_X}%` }}
          className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border-4 flex items-center justify-center transition-transform duration-75 ${
            ringPulse === 'perfect'
              ? 'border-[#F59E0B] bg-[#FEF3C7] scale-115'
              : ringPulse === 'good'
              ? 'border-[#3BA886] bg-[#D1FAE5] scale-110'
              : 'border-[#7E60D6] bg-white/90'
          }`}
        >
          <span className="text-[10px] font-extrabold text-[#5A3EA6]">TAP</span>
        </div>

        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              left: `${note.x}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute top-1/2 text-3xl leading-none pointer-events-none select-none will-change-transform"
            aria-hidden="true"
          >
            {note.emoji}
          </div>
        ))}
      </div>

      <button
        type="button"
        onPointerDown={(e) => {
          e.preventDefault();
          handleTapBeat();
        }}
        className="w-full min-h-[76px] rounded-2xl bg-gradient-to-b from-[#8A6EE8] to-[#6F52D2] text-white font-extrabold text-base shadow-[0_4px_0_#5238AD] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2 select-none touch-none"
      >
        <Music className="w-5 h-5" />
        <span>圖示進圈點擊節拍！</span>
      </button>

      <p className="text-center text-[11px] font-bold text-[#826862] tabular-nums">
        最高連擊 {maxCombo} · Perfect {perfectCount} · Good {goodCount} · Miss {missCount}
      </p>
    </div>
  );
};
