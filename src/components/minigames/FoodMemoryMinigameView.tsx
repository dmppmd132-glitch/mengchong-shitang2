import React, { useEffect, useRef, useState } from 'react';
import { Flame } from 'lucide-react';
import { MEMORY_FOOD_POOL } from '../../data/minigames';
import { getPetSpeciesInfo } from '../../data/species';
import { Pet, PetExpression } from '../../types';
import { MinigameDifficultyProfile, MinigameResult } from '../../types/minigame';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';

interface FoodMemoryMinigameViewProps {
  pet: Pet;
  soundEnabled: boolean;
  usedPaidReplay: boolean;
  difficulty: MinigameDifficultyProfile;
  onComplete: (result: MinigameResult) => void;
}

interface MemoryCard {
  uid: number;
  kind: 'food' | 'chili';
  pairId: string;
  foodId: string;
  name: string;
  emoji: string;
  isFavorite: boolean;
  flipped: boolean;
  matched: boolean;
}

const ROUND_SECONDS = 50;

function buildMemoryDeck(favoriteFoodIds: string[], startOpen: boolean): MemoryCard[] {
  const cards: MemoryCard[] = [];
  let uid = 1;

  for (const food of MEMORY_FOOD_POOL) {
    const isFav = favoriteFoodIds.includes(food.foodId);
    for (let copy = 0; copy < 2; copy += 1) {
      cards.push({
        uid: uid++,
        kind: 'food',
        pairId: food.pairId,
        foodId: food.foodId,
        name: food.name,
        emoji: food.emoji,
        isFavorite: isFav,
        flipped: startOpen,
        matched: false,
      });
    }
  }

  for (let i = 0; i < 4; i += 1) {
    cards.push({
      uid: uid++,
      kind: 'chili',
      pairId: `chili_${i}`,
      foodId: 'chili',
      name: '超辣辣椒',
      emoji: '🌶️',
      isFavorite: false,
      flipped: startOpen,
      matched: false,
    });
  }

  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }

  return cards;
}

export const FoodMemoryMinigameView: React.FC<FoodMemoryMinigameViewProps> = ({
  pet,
  soundEnabled,
  usedPaidReplay,
  difficulty,
  onComplete,
}) => {
  const speciesInfo = getPetSpeciesInfo(pet.species);
  const hasPeekPhase = difficulty.memoryPeekMs > 0;
  const [cards, setCards] = useState<MemoryCard[]>(() =>
    buildMemoryDeck(speciesInfo.favoriteFoodIds, hasPeekPhase)
  );
  const [isPeeking, setIsPeeking] = useState<boolean>(hasPeekPhase);
  const [selectedUids, setSelectedUids] = useState<number[]>([]);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [matchedPairs, setMatchedPairs] = useState<number>(0);
  const [chiliHits, setChiliHits] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(ROUND_SECONDS);
  const [petExpression, setPetExpression] = useState<PetExpression>('normal');
  const [statusMessage, setStatusMessage] = useState<string>(
    hasPeekPhase
      ? `快記住位置！牌面將在 ${(difficulty.memoryPeekMs / 1000).toFixed(1)} 秒後蓋上`
      : `翻出配對點心！${speciesInfo.shortName}最愛食物雙倍分，小心辣椒 🌶️`
  );

  const lockBoardRef = useRef<boolean>(hasPeekPhase);
  const scoreRef = useRef<number>(0);
  const maxComboRef = useRef<number>(0);
  const matchedPairsRef = useRef<number>(0);
  const chiliHitsRef = useRef<number>(0);
  const timeLeftRef = useRef<number>(ROUND_SECONDS);
  const finishedRef = useRef<boolean>(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finishRound = (bonusPoints = 0) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    lockBoardRef.current = true;
    const finalScore = Math.max(0, scoreRef.current + bonusPoints);
    soundFX.levelUp(soundEnabled);
    onCompleteRef.current({
      gameId: 'foodMemory',
      score: finalScore,
      maxCombo: maxComboRef.current,
      matchedPairs: matchedPairsRef.current,
      chiliHits: chiliHitsRef.current,
      usedPaidReplay,
      playedAt: Date.now(),
    });
  };

  // Optional Lv.1-3 initial card peek before round starts
  useEffect(() => {
    if (!hasPeekPhase) return;
    const peekTimer = window.setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
      lockBoardRef.current = false;
      setIsPeeking(false);
      setStatusMessage(
        `翻出配對點心！${speciesInfo.shortName}最愛食物雙倍分，小心辣椒 🌶️`
      );
      soundFX.pop(soundEnabled);
    }, difficulty.memoryPeekMs);
    return () => window.clearTimeout(peekTimer);
  }, [difficulty.memoryPeekMs, hasPeekPhase, soundEnabled, speciesInfo.shortName]);

  useEffect(() => {
    const startAt = performance.now();
    const timer = window.setInterval(() => {
      const elapsed = (performance.now() - startAt) / 1000;
      const remaining = Math.max(0, Math.ceil(ROUND_SECONDS - elapsed));
      timeLeftRef.current = remaining;
      setTimeLeft(remaining);
      if (elapsed >= ROUND_SECONDS && !finishedRef.current) {
        window.clearInterval(timer);
        finishRound(0);
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, []);

  const handleCardTap = (cardUid: number) => {
    if (finishedRef.current || lockBoardRef.current || isChecking || isPeeking) return;
    const clicked = cards.find((c) => c.uid === cardUid);
    if (!clicked || clicked.flipped || clicked.matched) return;
    if (selectedUids.includes(cardUid)) return;

    if (clicked.kind === 'chili') {
      const chiliPenalty = difficulty.tier === 'relaxed' ? -1 : -2;
      lockBoardRef.current = true;
      setIsChecking(true);
      soundFX.miss(soundEnabled);
      triggerHaptic(32);
      chiliHitsRef.current += 1;
      setChiliHits(chiliHitsRef.current);
      const nextScore = Math.max(0, scoreRef.current + chiliPenalty);
      scoreRef.current = nextScore;
      setScore(nextScore);
      setCombo(0);
      setPetExpression('happyTongue');
      setStatusMessage(`好辣好辣！吐舌頭散熱中… (${chiliPenalty} 分)`);

      setCards((prev) =>
        prev.map((c) => (c.uid === cardUid ? { ...c, flipped: true } : c))
      );

      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.uid === cardUid || selectedUids.includes(c.uid)
              ? { ...c, flipped: false }
              : c
          )
        );
        setSelectedUids([]);
        lockBoardRef.current = false;
        setIsChecking(false);
        setPetExpression('normal');
      }, 640);
      return;
    }

    soundFX.pop(soundEnabled);
    const updatedCards = cards.map((c) =>
      c.uid === cardUid ? { ...c, flipped: true } : c
    );
    setCards(updatedCards);

    if (selectedUids.length === 0) {
      setSelectedUids([cardUid]);
      return;
    }

    const firstUid = selectedUids[0];
    if (firstUid === cardUid) return;
    const firstCard = updatedCards.find((c) => c.uid === firstUid);
    const secondCard = updatedCards.find((c) => c.uid === cardUid);
    if (!firstCard || !secondCard) return;

    lockBoardRef.current = true;
    setSelectedUids([firstUid, cardUid]);
    setIsChecking(true);

    if (firstCard.pairId === secondCard.pairId) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxComboRef.current) {
        maxComboRef.current = nextCombo;
        setMaxCombo(nextCombo);
      }

      const base = 5 + (nextCombo > 1 ? (nextCombo - 1) * 2 : 0);
      const earned = firstCard.isFavorite ? base * 2 : base;
      scoreRef.current += earned;
      setScore(scoreRef.current);

      matchedPairsRef.current += 1;
      const newPairCount = matchedPairsRef.current;
      setMatchedPairs(newPairCount);

      triggerHaptic(14);
      if (nextCombo > 1) {
        soundFX.combo(soundEnabled, nextCombo);
      } else if (firstCard.isFavorite) {
        soundFX.heart(soundEnabled);
      }

      if (firstCard.isFavorite) {
        setPetExpression('sparkle');
        setStatusMessage(`最愛「${firstCard.name}」雙倍 +${earned}！`);
      } else {
        setPetExpression('wink');
        setStatusMessage(
          nextCombo > 1
            ? `${nextCombo} 連擊！配對「${firstCard.name}」+${earned}`
            : `配對成功「${firstCard.name}」+${earned}`
        );
      }

      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.uid === firstUid || c.uid === cardUid ? { ...c, matched: true } : c
          )
        );
        setSelectedUids([]);
        lockBoardRef.current = false;
        setIsChecking(false);
        setPetExpression('normal');

        if (newPairCount >= MEMORY_FOOD_POOL.length) {
          const speedBonus = 8 + Math.min(8, Math.floor(timeLeftRef.current / 3));
          finishRound(speedBonus);
        }
      }, 360);
    } else {
      setCombo(0);
      setStatusMessage('差一點點，記住位置再試試～');
      window.setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.uid === firstUid || c.uid === cardUid ? { ...c, flipped: false } : c
          )
        );
        setSelectedUids([]);
        lockBoardRef.current = false;
        setIsChecking(false);
      }, 560);
    }
  };

  const favoriteLabels = MEMORY_FOOD_POOL.filter((item) =>
    speciesInfo.favoriteFoodIds.includes(item.foodId)
  )
    .map((item) => item.emoji)
    .join('');

  return (
    <div className="space-y-2.5 overflow-x-hidden">
      <div className="flex items-center justify-between px-1 text-xs font-extrabold tabular-nums">
        <span className="text-[#A24B18]">
          得分 {score} · 配對 {matchedPairs}/6
        </span>
        {combo > 1 ? (
          <span
            key={combo}
            className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FFE4C4] text-[#B84A00] animate-combo-pop"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{combo} 連擊！</span>
          </span>
        ) : (
          <span className="text-[#D64470]">最愛 {favoriteLabels || '🍮'} 2倍</span>
        )}
        <span className={timeLeft <= 8 ? 'text-[#D64470]' : 'text-[#5A423C]'}>
          {timeLeft}秒
        </span>
      </div>

      <div className="rounded-2xl bg-[#FFF6EC] border border-[#F3D5B7] px-3 py-2 flex items-center gap-2.5">
        <div className="shrink-0 relative">
          <PiggyCharacter
            species={pet.species}
            growth={pet.growth}
            roundness={pet.roundness}
            action={petExpression === 'sparkle' ? 'eating' : 'idle'}
            expression={petExpression}
            equipped={pet.accessories}
            interactive={false}
            size={60}
          />
          {petExpression === 'happyTongue' && (
            <span className="absolute -top-1 -right-1 text-base" aria-hidden="true">
              🥵
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold text-[#4A3531] leading-snug">
            {statusMessage}
          </p>
          <p className="text-[10px] font-bold text-[#8A716B] mt-0.5 tabular-nums">
            最高連擊 {maxCombo} · 踩到辣椒 {chiliHits} 次 · 全配對完成加碼獎勵！
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((card) => {
          const isOpen = card.flipped || card.matched;
          return (
            <button
              key={card.uid}
              type="button"
              disabled={isOpen || isChecking || isPeeking}
              onClick={() => handleCardTap(card.uid)}
              aria-label={isOpen ? card.name : '未翻開卡牌'}
              className={`min-h-[60px] rounded-2xl border-2 flex flex-col items-center justify-center transition-transform duration-150 select-none ${
                card.matched
                  ? 'bg-[#E9F9F2] border-[#9CDDC5] opacity-75 animate-card-match'
                  : isOpen && card.kind === 'chili'
                  ? 'bg-[#FFE5EC] border-[#FF7A9E] animate-card-reveal'
                  : isOpen
                  ? card.isFavorite
                    ? 'bg-[#FFF3D6] border-[#F0B849] animate-card-reveal'
                    : 'bg-white border-[#F3D5B7] animate-card-reveal'
                  : 'bg-gradient-to-b from-[#FFE6EE] to-[#FFD5E2] border-[#F4AFC3] hover:brightness-98 active:scale-95 shadow-[0_2px_0_#E897AF]'
              }`}
            >
              {isOpen ? (
                <>
                  <span className="text-2xl leading-none" aria-hidden="true">
                    {card.emoji}
                  </span>
                  {card.isFavorite && !card.matched && (
                    <span className="text-[9px] font-extrabold text-[#B85414] mt-0.5 leading-none">
                      ♥ 2x
                    </span>
                  )}
                </>
              ) : (
                <span className="text-lg font-extrabold text-[#C85A7C]" aria-hidden="true">
                  ?
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
