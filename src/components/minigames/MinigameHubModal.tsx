import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Coins,
  Gamepad2,
  Home,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  X,
} from 'lucide-react';
import { INGREDIENTS } from '../../data/kitchen';
import {
  MAX_FREE_PLAYS_PER_DAY,
  MINIGAME_BADGES,
  MINIGAME_BY_ID,
  MINIGAME_TUTORIALS,
  MINIGAME_WEEKLY_CHALLENGES,
  REPLAY_COST_COINS,
} from '../../data/minigames';
import { Pet } from '../../types';
import {
  MinigameBadgeId,
  MinigameHubState,
  MinigameId,
  MinigameResult,
  MinigameReward,
  MinigameWeeklyChallengeId,
} from '../../types/minigame';
import {
  getDailyRecommendedMinigame,
  getLocalDateKey,
  getMinigameDifficulty,
  getMinigamePlayAccess,
  getSortedMinigamesForToday,
  getWeeklyChallengeProgress,
  hasSeenMinigameTutorial,
  markMinigameTutorialSeen,
  syncMinigameHubState,
} from '../../utils/minigame';
import { soundFX, triggerHaptic } from '../../utils/sound';
import { PiggyCharacter } from '../PiggyCharacter';
import { CatchMinigameView } from './CatchMinigameView';
import { FoodMemoryMinigameView } from './FoodMemoryMinigameView';
import { MudBathMinigameView } from './MudBathMinigameView';
import { PetRhythmMinigameView } from './PetRhythmMinigameView';

export interface MinigameSettlementSummary {
  result: MinigameResult;
  reward: MinigameReward;
  isNewHighScore: boolean;
  newlyUnlockedBadges: MinigameBadgeId[];
}

interface MinigameHubModalProps {
  open: boolean;
  onClose: () => void;
  pet: Pet;
  coins: number;
  soundEnabled: boolean;
  hubState: MinigameHubState;
  onSpendReplayCoins: (cost: number) => boolean;
  onFinishMinigame: (result: MinigameResult) => MinigameSettlementSummary;
  onClaimWeeklyChallenge: (challengeId: MinigameWeeklyChallengeId) => void;
}

type ModalPhase = 'HUB' | 'TUTORIAL' | 'READY' | 'PLAYING' | 'ROUND_SUMMARY';
type HubTab = 'games' | 'weekly' | 'badges';

export const MinigameHubModal: React.FC<MinigameHubModalProps> = ({
  open,
  onClose,
  pet,
  coins,
  soundEnabled,
  hubState,
  onSpendReplayCoins,
  onFinishMinigame,
  onClaimWeeklyChallenge,
}) => {
  const [phase, setPhase] = useState<ModalPhase>('HUB');
  const [hubTab, setHubTab] = useState<HubTab>('games');
  const [activeGameId, setActiveGameId] = useState<MinigameId>('apple');
  const [tutorialStepIdx, setTutorialStepIdx] = useState<number>(0);
  const [activePaidReplay, setActivePaidReplay] = useState<boolean>(false);
  const [runNonce, setRunNonce] = useState<number>(0);
  const [summary, setSummary] = useState<MinigameSettlementSummary | null>(null);
  const [errorBanner, setErrorBanner] = useState<string>('');
  const [confirmExitMode, setConfirmExitMode] = useState<'none' | 'hub' | 'close'>('none');

  useEffect(() => {
    if (!open) {
      setPhase('HUB');
      setHubTab('games');
      setTutorialStepIdx(0);
      setSummary(null);
      setErrorBanner('');
      setConfirmExitMode('none');
    }
  }, [open]);

  // Guard against accidental page refresh or browser back button while actively playing
  useEffect(() => {
    if (!open || phase !== 'PLAYING') return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePopState = () => {
      window.history.pushState({ minigamePlaying: true }, '');
      setConfirmExitMode('hub');
    };

    window.history.pushState({ minigamePlaying: true }, '');
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [open, phase]);

  if (!open) return null;

  const todayStr = getLocalDateKey();
  const syncedHub = syncMinigameHubState(hubState, todayStr);
  const sortedGames = getSortedMinigamesForToday(todayStr);
  const recommendedGameId = getDailyRecommendedMinigame(todayStr);
  const recommendedCfg = MINIGAME_BY_ID[recommendedGameId];
  const difficulty = getMinigameDifficulty(pet.level);

  const completedWeeklyCount = MINIGAME_WEEKLY_CHALLENGES.filter((ch) => {
    const progress = getWeeklyChallengeProgress(syncedHub, ch.id);
    return progress >= ch.target;
  }).length;

  const claimableWeeklyCount = MINIGAME_WEEKLY_CHALLENGES.filter((ch) => {
    const progress = getWeeklyChallengeProgress(syncedHub, ch.id);
    return progress >= ch.target && !syncedHub.weeklyClaimedIds.includes(ch.id);
  }).length;

  const handleSelectGame = (gameId: MinigameId) => {
    const access = getMinigamePlayAccess(syncedHub, gameId, coins, pet.level, todayStr);
    if (!access.canStart) {
      soundFX.miss(soundEnabled);
      setErrorBanner(access.reason ?? '目前無法開始此關卡');
      return;
    }

    setErrorBanner('');
    setConfirmExitMode('none');
    soundFX.pop(soundEnabled);
    setActiveGameId(gameId);
    setSummary(null);

    if (!hasSeenMinigameTutorial(gameId)) {
      setTutorialStepIdx(0);
      setPhase('TUTORIAL');
    } else {
      setPhase('READY');
    }
  };

  const handleFinishTutorial = () => {
    markMinigameTutorialSeen(activeGameId);
    soundFX.pop(soundEnabled);
    setPhase('READY');
  };

  const handleBeginPlaying = () => {
    const access = getMinigamePlayAccess(syncedHub, activeGameId, coins, pet.level, todayStr);
    if (!access.canStart) {
      soundFX.miss(soundEnabled);
      setErrorBanner(access.reason ?? '目前無法開始此關卡');
      setPhase('HUB');
      return;
    }

    let usedPaid = false;
    if (access.requiresCoinReplay) {
      const paid = onSpendReplayCoins(REPLAY_COST_COINS);
      if (!paid) {
        soundFX.miss(soundEnabled);
        setErrorBanner(`金幣不足 ${REPLAY_COST_COINS}，無法重玩`);
        setPhase('HUB');
        return;
      }
      usedPaid = true;
    }

    setErrorBanner('');
    setConfirmExitMode('none');
    setActivePaidReplay(usedPaid);
    setRunNonce((n) => n + 1);
    setSummary(null);
    soundFX.pop(soundEnabled);
    triggerHaptic(15);
    setPhase('PLAYING');
  };

  const handleCompleteRun = (result: MinigameResult) => {
    setConfirmExitMode('none');
    const settled = onFinishMinigame(result);
    setSummary(settled);
    setPhase('ROUND_SUMMARY');
  };

  const handleRequestClose = () => {
    if (phase === 'PLAYING') {
      setConfirmExitMode('close');
      return;
    }
    onClose();
  };

  const activeCfg = MINIGAME_BY_ID[activeGameId];
  const activeTutorialSteps = MINIGAME_TUTORIALS[activeGameId];
  const currentTutorialStep = activeTutorialSteps[tutorialStepIdx] ?? activeTutorialSteps[0];
  const activeAccess = getMinigamePlayAccess(
    syncedHub,
    activeGameId,
    coins,
    pet.level,
    todayStr
  );
  const recommendedAccess = getMinigamePlayAccess(
    syncedHub,
    recommendedGameId,
    coins,
    pet.level,
    todayStr
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B2621]/55 backdrop-blur-xs flex items-center justify-center p-2.5 overflow-x-hidden overscroll-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="minigame-hub-title"
    >
      <div className="w-full max-w-[404px] max-h-[92vh] rounded-3xl bg-[#FFFDF8] border-2 border-[#F4DFD8] shadow-2xl flex flex-col overflow-hidden">
        {/* Sticky modal header */}
        <div className="px-4 pt-3 pb-2.5 border-b border-[#F2E5DF] flex items-center justify-between gap-2 shrink-0 bg-[#FFFDF8]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#FFEAF0] text-[#D64470] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2
                id="minigame-hub-title"
                className="text-base font-extrabold text-[#4A3531] truncate"
              >
                {phase === 'HUB' || phase === 'ROUND_SUMMARY'
                  ? '萌寵小遊戲中心'
                  : activeCfg.name}
              </h2>
              <p className="text-[11px] font-bold text-[#826862] tabular-nums truncate">
                Lv.{pet.level} · {coins} 金幣 · 徽章 {syncedHub.unlockedBadges.length}/
                {MINIGAME_BADGES.length}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRequestClose}
            aria-label="關閉小遊戲中心"
            className="min-h-[44px] min-w-[44px] rounded-full bg-[#F7ECE6] text-[#5A3E36] flex items-center justify-center hover:bg-[#EEDCD3] active:scale-95 transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-3.5 overflow-y-auto overflow-x-hidden overscroll-contain space-y-3">
          {phase === 'HUB' && (
            <>
              {/* Recommended Game + Weekly Summary Spotlight */}
              <div className="rounded-2xl bg-gradient-to-br from-[#FFF5E4] to-[#FFEAF0] border border-[#F3D8CE] p-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="shrink-0">
                      <PiggyCharacter
                        species={pet.species}
                        growth={pet.growth}
                        roundness={pet.roundness}
                        action="petted"
                        equipped={pet.accessories}
                        interactive={false}
                        size={56}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-extrabold text-[#C83B67] flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>今日推薦：{recommendedCfg.emoji} {recommendedCfg.name}</span>
                      </p>
                      <p className="text-[11px] text-[#6E544E] mt-0.5 leading-snug">
                        每日隨機開放 3 款（免費 {MAX_FREE_PLAYS_PER_DAY} 次/款 · 第 4 次起 {REPLAY_COST_COINS} 金幣）
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!recommendedAccess.canStart}
                    onClick={() => handleSelectGame(recommendedGameId)}
                    className={`min-h-[44px] px-3 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 transition ${
                      recommendedAccess.canStart
                        ? 'bg-[#FF7A9E] text-white hover:bg-[#F45D86] active:scale-95'
                        : 'bg-[#EFE4DE] text-[#9E8780] cursor-not-allowed'
                    }`}
                  >
                    馬上玩
                  </button>
                </div>

                {/* Compact weekly challenge status strip */}
                <button
                  type="button"
                  onClick={() => setHubTab('weekly')}
                  className="w-full min-h-[44px] rounded-xl bg-white/80 border border-[#F2E0D9] px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-white transition"
                >
                  <div className="min-w-0">
                    <p className="text-[11px] font-extrabold text-[#9D5B12] flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        本週挑戰進度：{completedWeeklyCount}/{MINIGAME_WEEKLY_CHALLENGES.length} 項達成 · 累積 {syncedHub.weeklyTotalScore}/150 分
                      </span>
                    </p>
                  </div>
                  <span className="text-[11px] font-extrabold text-[#9D5B12] whitespace-nowrap shrink-0 flex items-center">
                    {claimableWeeklyCount > 0 ? `領獎 (${claimableWeeklyCount})` : '詳情'}
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              </div>

              {/* Hub Tabs */}
              <div className="grid grid-cols-3 gap-1.5 bg-[#F2E5DE] p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setHubTab('games');
                    setErrorBanner('');
                  }}
                  className={`min-h-[44px] rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    hubTab === 'games'
                      ? 'bg-white text-[#D64470] shadow-xs'
                      : 'text-[#7D635D] hover:text-[#4A3531]'
                  }`}
                >
                  全部關卡 (5)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHubTab('weekly');
                    setErrorBanner('');
                  }}
                  className={`min-h-[44px] rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    hubTab === 'weekly'
                      ? 'bg-white text-[#9D5B12] shadow-xs'
                      : 'text-[#7D635D] hover:text-[#4A3531]'
                  }`}
                >
                  每週挑戰{claimableWeeklyCount > 0 ? ` (${claimableWeeklyCount})` : ''}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHubTab('badges');
                    setErrorBanner('');
                  }}
                  className={`min-h-[44px] rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                    hubTab === 'badges'
                      ? 'bg-white text-[#256D57] shadow-xs'
                      : 'text-[#7D635D] hover:text-[#4A3531]'
                  }`}
                >
                  徽章 ({syncedHub.unlockedBadges.length})
                </button>
              </div>

              {errorBanner && (
                <div className="rounded-xl bg-[#FFEAF0] border border-[#F5B4C6] px-3 py-2 text-xs font-extrabold text-[#B83B64] text-center">
                  {errorBanner}
                </div>
              )}

              {hubTab === 'games' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-[#7D635D] px-1">
                    目前難度：{difficulty.label} · {difficulty.hint}
                  </p>
                  {sortedGames.map((cfg) => {
                    const access = getMinigamePlayAccess(
                      syncedHub,
                      cfg.id,
                      coins,
                      pet.level,
                      todayStr
                    );
                    const highScore = syncedHub.highScores[cfg.id] ?? 0;
                    const isRecommended = cfg.id === recommendedGameId;

                    return (
                      <article
                        key={cfg.id}
                        className={`rounded-2xl border-2 p-3 transition ${
                          isRecommended
                            ? 'bg-[#FFFDF8] border-[#FF9EB8]'
                            : access.isOpenToday
                            ? 'bg-[#FFFDF8] border-[#F2E0D9]'
                            : 'bg-[#F8F3F0] border-[#E8DCD6] opacity-80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-2xl border flex items-center justify-center text-2xl shrink-0 ${cfg.accentBg} ${cfg.accentBorder}`}
                            >
                              <span aria-hidden="true">{cfg.emoji}</span>
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-sm font-extrabold text-[#4A3531]">
                                {cfg.name}
                                {isRecommended && (
                                  <span className="ml-1.5 text-[11px] font-extrabold text-[#D64470]">
                                    · 今日推薦
                                  </span>
                                )}
                              </h3>
                              <p className="text-[11px] font-bold text-[#7D635D] tabular-nums">
                                {cfg.durationSeconds}秒 · 最高 {highScore} 分 ·{' '}
                                {access.isOpenToday
                                  ? access.freeRemaining > 0
                                    ? `今日免費 ${access.freeRemaining}/${MAX_FREE_PLAYS_PER_DAY}`
                                    : '免費已用完'
                                  : '今日輪休'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!access.canStart}
                            onClick={() => handleSelectGame(cfg.id)}
                            className={`min-h-[44px] px-3.5 rounded-xl text-xs font-extrabold whitespace-nowrap shrink-0 inline-flex items-center justify-center gap-1 transition ${
                              !access.isOpenToday
                                ? 'bg-[#E8DCD6] text-[#8A716B] cursor-not-allowed'
                                : !access.canStart
                                ? 'bg-[#EFE4DE] text-[#9E8780] cursor-not-allowed'
                                : access.requiresCoinReplay
                                ? 'bg-[#F8C956] text-[#4A3531] hover:bg-[#F3BE40] active:scale-95'
                                : 'bg-[#FF7A9E] text-white hover:bg-[#F45D86] active:scale-95'
                            }`}
                          >
                            {!access.isOpenToday ? (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>明日輪替</span>
                              </>
                            ) : access.requiresCoinReplay ? (
                              <>
                                <Coins className="w-3.5 h-3.5" />
                                <span>{REPLAY_COST_COINS} 重玩</span>
                              </>
                            ) : (
                              <span>開始玩</span>
                            )}
                          </button>
                        </div>

                        <p className="text-xs text-[#6E544E] mt-2 leading-relaxed">
                          {cfg.description}
                        </p>
                        <p className="text-[11px] font-bold text-[#826862] mt-1.5">
                          獎勵：{cfg.rewardRuleSummary}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}

              {hubTab === 'weekly' && (
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-[#7D635D] px-1">
                    每週一重置挑戰進度，完成可額外獲得大量金幣與成長值！
                  </p>
                  {MINIGAME_WEEKLY_CHALLENGES.map((challenge) => {
                    const progress = Math.min(
                      challenge.target,
                      getWeeklyChallengeProgress(syncedHub, challenge.id)
                    );
                    const pct = Math.round((progress / challenge.target) * 100);
                    const claimed = syncedHub.weeklyClaimedIds.includes(challenge.id);
                    const completed = progress >= challenge.target;

                    return (
                      <article
                        key={challenge.id}
                        className="rounded-2xl border-2 border-[#F2E0D9] bg-[#FFFDF8] p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-[#4A3531]">
                              {challenge.title}
                            </h3>
                            <p className="text-xs text-[#7D635D] mt-0.5">
                              {challenge.description}
                            </p>
                          </div>
                          <span className="text-xs font-extrabold text-[#9D5B12] tabular-nums whitespace-nowrap">
                            {progress} / {challenge.target}
                          </span>
                        </div>

                        <div className="w-full h-2.5 rounded-full bg-[#F2E5DE] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#F8C956] transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span className="text-xs font-bold text-[#6E544E] tabular-nums">
                            獎勵：🪙 +{challenge.rewardCoins} · 🌱 +{challenge.rewardGrowth}
                          </span>
                          <button
                            type="button"
                            disabled={!completed || claimed}
                            onClick={() => onClaimWeeklyChallenge(challenge.id)}
                            className={`min-h-[44px] px-4 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                              claimed
                                ? 'bg-[#E8F8F2] text-[#256D57] cursor-default'
                                : completed
                                ? 'bg-[#5CC9A7] text-white hover:bg-[#49B895] active:scale-95'
                                : 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                            }`}
                          >
                            {claimed ? '已領取' : completed ? '領取獎勵' : '進行中'}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {hubTab === 'badges' && (
                <div className="grid grid-cols-2 gap-2.5">
                  {MINIGAME_BADGES.map((badge) => {
                    const unlocked = syncedHub.unlockedBadges.includes(badge.id);
                    return (
                      <article
                        key={badge.id}
                        className={`rounded-2xl border-2 p-3 flex flex-col justify-between gap-1.5 ${
                          unlocked
                            ? 'bg-[#FFF8E8] border-[#F2D392]'
                            : 'bg-[#F8F3F0] border-[#E7DBD5] opacity-75'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-2xl leading-none ${unlocked ? '' : 'grayscale opacity-55'}`}
                            aria-hidden="true"
                          >
                            {badge.emoji}
                          </span>
                          <div className="min-w-0">
                            <h3 className="text-xs font-extrabold text-[#4A3531] truncate">
                              {badge.name}
                            </h3>
                            <p className="text-[10px] font-bold text-[#9D5B12]">
                              {unlocked ? '已解鎖' : '未解鎖'}
                            </p>
                          </div>
                        </div>
                        <p className="text-[11px] text-[#6E544E] leading-snug">
                          {badge.description}
                        </p>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* First-Time Play Tutorial (<= 3 steps, stored in localStorage, skippable) */}
          {phase === 'TUTORIAL' && currentTutorialStep && (
            <div className="space-y-4 py-1 animate-summary-pop">
              <div className="flex items-center justify-between text-xs font-extrabold text-[#7D635D]">
                <span className="inline-flex items-center gap-1 text-[#D64470]">
                  <BookOpen className="w-4 h-4" />
                  <span>第一次遊玩教學 · {activeCfg.name}</span>
                </span>
                <span className="tabular-nums">
                  第 {tutorialStepIdx + 1} / {activeTutorialSteps.length} 步
                </span>
              </div>

              <div className="rounded-3xl bg-gradient-to-b from-[#FFF7EC] to-[#FFFDF8] border-2 border-[#F2DFD5] p-5 text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white border border-[#F2DFD5] flex items-center justify-center text-4xl shadow-2xs">
                  <span aria-hidden="true">{currentTutorialStep.emoji}</span>
                </div>
                <h3 className="text-base font-extrabold text-[#4A3531]">
                  {currentTutorialStep.title}
                </h3>
                <p className="text-xs font-bold text-[#6E544E] leading-relaxed">
                  {currentTutorialStep.instruction}
                </p>

                {/* Step progress dots */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  {activeTutorialSteps.map((step, idx) => (
                    <span
                      key={step.title}
                      className={`h-2 rounded-full transition-all ${
                        idx === tutorialStepIdx
                          ? 'w-6 bg-[#FF7A9E]'
                          : idx < tutorialStepIdx
                          ? 'w-2 bg-[#FFB3C8]'
                          : 'w-2 bg-[#E8D9D2]'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleFinishTutorial}
                  className="min-h-[46px] rounded-2xl bg-[#F7ECE6] text-[#6E544E] text-xs font-extrabold hover:bg-[#EEDCD3] active:scale-95 transition"
                >
                  跳過教學
                </button>
                {tutorialStepIdx < activeTutorialSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.pop(soundEnabled);
                      setTutorialStepIdx((prev) => prev + 1);
                    }}
                    className="min-h-[46px] rounded-2xl bg-[#FF7A9E] text-white text-sm font-extrabold hover:bg-[#F45D86] active:scale-95 transition"
                  >
                    下一步
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinishTutorial}
                    className="min-h-[46px] rounded-2xl bg-[#5CC9A7] text-white text-sm font-extrabold hover:bg-[#49B895] active:scale-95 transition"
                  >
                    看懂了！
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Pre-Start Goal & Controls Screen */}
          {phase === 'READY' && (
            <div className="space-y-3.5 py-1 animate-summary-pop">
              <div className="rounded-3xl bg-gradient-to-b from-[#FFF7EC] to-[#FFFDF8] border-2 border-[#F2DFD5] p-4 space-y-3 text-center">
                <div
                  className={`w-14 h-14 mx-auto rounded-2xl border flex items-center justify-center text-3xl ${activeCfg.accentBg} ${activeCfg.accentBorder}`}
                >
                  <span aria-hidden="true">{activeCfg.emoji}</span>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#4A3531]">
                    {activeCfg.name}（{activeCfg.durationSeconds} 秒）
                  </h3>
                  <p className="text-[11px] font-extrabold text-[#9D5B12] mt-0.5">
                    {difficulty.label} · {difficulty.hint}
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-[#F2E5DF] p-3 text-left space-y-2 text-xs">
                  <p className="font-extrabold text-[#4A3531] flex items-start gap-1.5">
                    <Target className="w-4 h-4 text-[#D64470] shrink-0 mt-0.5" />
                    <span>目標：{activeCfg.goalText}</span>
                  </p>
                  <p className="font-bold text-[#6E544E] flex items-start gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-[#256D57] shrink-0 mt-0.5" />
                    <span>操作：{activeCfg.controlsHint}</span>
                  </p>
                </div>

                <p className="text-[11px] font-bold text-[#826862] tabular-nums">
                  {activeAccess.requiresCoinReplay
                    ? `今日免費次數已用完，本局將花費 ${REPLAY_COST_COINS} 金幣重玩`
                    : `今日剩餘免費次數：${activeAccess.freeRemaining}/${MAX_FREE_PLAYS_PER_DAY} 次`}
                </p>
              </div>

              <button
                type="button"
                onClick={handleBeginPlaying}
                className="w-full min-h-[48px] rounded-2xl bg-[#FF7A9E] text-white font-extrabold text-sm shadow-[0_4px_0_#D9577B] hover:bg-[#F45D86] active:translate-y-0.5 transition inline-flex items-center justify-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {activeAccess.requiresCoinReplay
                    ? `花費 ${REPLAY_COST_COINS} 金幣開始計時`
                    : '開始計時挑戰！'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPhase('HUB')}
                className="w-full min-h-[44px] rounded-2xl bg-[#F7ECE6] text-[#5A3E36] text-xs font-extrabold hover:bg-[#EEDCD3] transition"
              >
                回到小遊戲中心
              </button>
            </div>
          )}

          {phase === 'PLAYING' && (
            <div className="space-y-2.5">
              {(activeGameId === 'apple' || activeGameId === 'fries') && (
                <CatchMinigameView
                  key={`${activeGameId}_${runNonce}`}
                  mode={activeGameId}
                  pet={pet}
                  soundEnabled={soundEnabled}
                  usedPaidReplay={activePaidReplay}
                  difficulty={difficulty}
                  onComplete={handleCompleteRun}
                />
              )}

              {activeGameId === 'mudBath' && (
                <MudBathMinigameView
                  key={`mudBath_${runNonce}`}
                  pet={pet}
                  soundEnabled={soundEnabled}
                  usedPaidReplay={activePaidReplay}
                  difficulty={difficulty}
                  onComplete={handleCompleteRun}
                />
              )}

              {activeGameId === 'foodMemory' && (
                <FoodMemoryMinigameView
                  key={`foodMemory_${runNonce}`}
                  pet={pet}
                  soundEnabled={soundEnabled}
                  usedPaidReplay={activePaidReplay}
                  difficulty={difficulty}
                  onComplete={handleCompleteRun}
                />
              )}

              {activeGameId === 'petRhythm' && (
                <PetRhythmMinigameView
                  key={`petRhythm_${runNonce}`}
                  pet={pet}
                  soundEnabled={soundEnabled}
                  usedPaidReplay={activePaidReplay}
                  difficulty={difficulty}
                  onComplete={handleCompleteRun}
                />
              )}

              {confirmExitMode === 'none' ? (
                <button
                  type="button"
                  onClick={() => setConfirmExitMode('hub')}
                  className="w-full min-h-[44px] rounded-xl bg-[#F7ECE6] text-[#7D635D] text-xs font-extrabold hover:bg-[#EEDCD3] active:scale-98 transition"
                >
                  提前結束返回中心
                </button>
              ) : (
                <div className="rounded-2xl bg-[#FFF0F4] border-2 border-[#F5B4C6] p-2.5 space-y-2">
                  <p className="text-xs font-extrabold text-[#B83B64] text-center">
                    本局還在進行中，提前離開將不會獲得結算獎勵喔！
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmExitMode('none')}
                      className="min-h-[44px] rounded-xl bg-white border border-[#E5D3CC] text-[#5A423C] text-xs font-extrabold"
                    >
                      繼續遊玩
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const target = confirmExitMode;
                        setConfirmExitMode('none');
                        if (target === 'close') {
                          onClose();
                        } else {
                          setPhase('HUB');
                        }
                      }}
                      className="min-h-[44px] rounded-xl bg-[#D64470] text-white text-xs font-extrabold"
                    >
                      確定離開
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'ROUND_SUMMARY' && summary && (
            <div className="space-y-3 text-center animate-summary-pop">
              <div className="rounded-2xl bg-gradient-to-b from-[#FFEAF0] to-[#FFF8E8] border border-[#F3D2DC] p-4 flex flex-col items-center space-y-2">
                <Trophy className="w-9 h-9 text-[#E6A222]" />

                {summary.isNewHighScore && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#FFE17D] border border-[#E6A222] text-xs font-extrabold text-[#7A4400] animate-combo-pop">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>新紀錄！</span>
                  </span>
                )}

                <h3 className="text-lg font-extrabold text-[#4A3531]">
                  {activeCfg.name} 結算完成！
                </h3>

                <p className="text-sm font-extrabold text-[#D64470] tabular-nums">
                  本局分數 {summary.result.score} 分 · 個人最高{' '}
                  {syncedHub.highScores[activeGameId]} 分
                </p>

                {(summary.result.maxCombo !== undefined ||
                  summary.result.perfectCount !== undefined ||
                  summary.result.matchedPairs !== undefined) && (
                  <p className="text-[11px] font-bold text-[#7D635D] tabular-nums">
                    {[
                      summary.result.matchedPairs !== undefined
                        ? `配對 ${summary.result.matchedPairs}/6 對`
                        : null,
                      summary.result.perfectCount !== undefined
                        ? `Perfect ${summary.result.perfectCount} · Good ${summary.result.goodCount ?? 0} · Miss ${summary.result.missCount ?? 0}`
                        : null,
                      summary.result.maxCombo !== undefined && summary.result.maxCombo > 0
                        ? `最高連擊 ${summary.result.maxCombo}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                )}

                <div className="w-full rounded-2xl bg-white/85 border border-[#F4DFD8] p-3 text-xs font-extrabold text-[#5A423C] space-y-1.5 tabular-nums">
                  <div className="flex items-center justify-center gap-1.5 text-sm text-[#7A540E]">
                    <Coins className="w-4 h-4 text-[#E6A222]" />
                    <span>獲得金幣 +{summary.reward.coins}</span>
                  </div>

                  <p className="text-[11px] font-bold text-[#6E544E]">
                    狀態變化：
                    {[
                      summary.reward.mood > 0 ? `心情 +${summary.reward.mood}` : null,
                      summary.reward.growth > 0 ? `成長 +${summary.reward.growth}` : null,
                      summary.reward.cleanliness > 0
                        ? `清潔 +${summary.reward.cleanliness}`
                        : null,
                      summary.reward.intimacy > 0
                        ? `親密度 +${summary.reward.intimacy}`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>

                  <p className="text-xs font-extrabold text-[#256D57] flex items-center justify-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {summary.reward.ingredientReward
                        ? `獲得食材：${INGREDIENTS[summary.reward.ingredientReward.id].emoji} ${INGREDIENTS[summary.reward.ingredientReward.id].name} +${summary.reward.ingredientReward.qty}`
                        : '獲得食材：本關以金幣與狀態獎勵為主'}
                    </span>
                  </p>
                </div>

                {summary.newlyUnlockedBadges.length > 0 && (
                  <div className="w-full rounded-xl bg-[#FFF3D1] border border-[#F2CE6D] px-3 py-2 text-xs font-extrabold text-[#7A540E] flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4 shrink-0" />
                    <span>
                      解鎖徽章：
                      {summary.newlyUnlockedBadges
                        .map((id) => MINIGAME_BADGES.find((b) => b.id === id)?.name ?? id)
                        .join('、')}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!activeAccess.canStart}
                  onClick={() => handleSelectGame(activeGameId)}
                  className={`min-h-[46px] rounded-2xl font-extrabold text-sm inline-flex items-center justify-center gap-1.5 transition ${
                    !activeAccess.canStart
                      ? 'bg-[#EFE6E2] text-[#A89690] cursor-not-allowed'
                      : activeAccess.requiresCoinReplay
                      ? 'bg-[#F8C956] text-[#4A3531] hover:bg-[#F3BE40] active:scale-95'
                      : 'bg-[#FF7A9E] text-white hover:bg-[#F45D86] active:scale-95'
                  }`}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {activeAccess.requiresCoinReplay
                      ? `再玩一次 (${REPLAY_COST_COINS}金幣)`
                      : `再玩一次 (${activeAccess.freeRemaining})`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('HUB')}
                  className="min-h-[46px] rounded-2xl bg-[#E8F8F2] border border-[#AEE4D1] text-[#256D57] font-extrabold text-sm hover:bg-[#D8F3E9] active:scale-95 transition"
                >
                  回到小遊戲中心
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-2xl bg-[#F7ECE6] text-[#5A3E36] text-xs font-extrabold hover:bg-[#EEDCD3] inline-flex items-center justify-center gap-1.5 transition"
              >
                <Home className="w-4 h-4" />
                <span>回到首頁</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
