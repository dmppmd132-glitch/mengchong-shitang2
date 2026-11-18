import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Cloud, Coins, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { AuthSyncModal } from './components/AuthSyncModal';
import { BottomTabBar } from './components/BottomTabBar';
import { CanteenView } from './components/CanteenView';
import { CoopHubModal } from './components/coop/CoopHubModal';
import { DialogueHistoryModal } from './components/dialogue/DialogueHistoryModal';
import { EncyclopediaSection } from './components/EncyclopediaView';
import { HomeView } from './components/HomeView';
import { HouseHubModal, HouseModalTab } from './components/house/HouseHubModal';
import {
  MinigameHubModal,
  MinigameSettlementSummary,
} from './components/minigames/MinigameHubModal';
import { IntroHatching } from './components/IntroHatching';
import { JournalView } from './components/JournalView';
import { LevelUpModal } from './components/LevelUpModal';
import { MessageBoardModal } from './components/MessageBoardModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { PersonalityProfileModal } from './components/PersonalityProfileView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { PWAUpdateBanner } from './components/PWAUpdateBanner';
import { QuestsView } from './components/QuestsView';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { SharedPetModal } from './components/SharedPetModal';
import { WardrobeView } from './components/WardrobeView';
import { FOOD_CATEGORY_LABELS } from './data/foods';
import { getTitleDefinition } from './data/encyclopedia';
import { getGrowthStage } from './data/growth';
import { ROOM_ITEM_BY_ID } from './data/house';
import { INGREDIENTS } from './data/kitchen';
import { MINIGAME_BY_ID, MINIGAME_WEEKLY_CHALLENGES } from './data/minigames';
import { NOVICE_GROWTH_DAYS, STAGE_BACKGROUNDS } from './data/noviceGrowth';
import {
  TOUCH_ZONE_META,
  getPetSpeciesInfo,
  getRandomZoneSpeech,
  pickRandomNonRepeating,
} from './data/species';
import { getStickerById } from './data/stickers';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import {
  fetchCloudSave,
  signOutCloud,
  upsertCloudSave,
} from './services/cloudSync';
import {
  deleteSharedMessage,
  fetchSharedMessages,
  sendSharedMessage,
  subscribeToSharedMessages,
} from './services/messageBoard';
import {
  createSharedPetRoom,
  fetchMySharedPet,
  joinSharedPetByCode,
  leaveSharedPetRoom,
  regenerateSharedInviteCode,
  subscribeToSharedPet,
  updateSharedPetSave,
} from './services/sharedPet';
import {
  Accessory,
  CloudSavePayload,
  CloudSyncStatus,
  CloudUser,
  DialogueSettings,
  FarmDecorationId,
  FarmUpgradeId,
  FeedLog,
  FeedingVisualEffect,
  FloatingFeedback,
  Food,
  GameState,
  GrowthStageInfo,
  IngredientId,
  KitchenRecipe,
  PetExpression,
  PetMessage,
  PetSpecies,
  PetStickerId,
  PetTouchZone,
  PiggyActionState,
  RoomPhotoRecord,
  SharedPetRoom,
  StageBackgroundId,
  TabKey,
  ThemeSetId,
  TitleId,
  WeightLog,
} from './types';
import { MinigameResult, MinigameWeeklyChallengeId } from './types/minigame';
import {
  acknowledgeOfflinePartnerEvents,
  claimCoopReward,
  cookCoopOrderRecipe,
  depositIngredientToCoopWarehouse,
  getOfflinePartnerEvents,
  harvestCoopCropToWarehouse,
  mergeCoopRemoteState,
  placeCoopCandidateInRoom,
  plantCoopCrop,
  selectCoopFurnitureForQueue,
  settleRoomDecorSession,
  startRoomDecorSession,
  syncCoopHubState,
} from './utils/coop';
import {
  appendMemoryEvent,
  dismissActiveDialogue,
  evaluateAndSelectDialogue,
  respondToActiveDialogue,
  updateDialogueSettings,
} from './utils/dialogue';
import { syncEncyclopediaRewards } from './utils/encyclopedia';
import { resolveFeedingOutcome } from './utils/feeding';
import {
  PaymentSource,
  buyOrToggleFarmDecoration,
  expandNextFarmPlot,
  getEffectiveGrowDurationMs,
  getEffectiveHarvestYield,
  getIngredientStorageCap,
  updateHouseName,
  upgradeFarmFacility,
} from './utils/house';
import {
  claimWeeklyMinigameChallenge,
  settleMinigameOutcome,
} from './utils/minigame';
import { evaluateAllNoviceDays, getLocalDateString } from './utils/noviceGrowth';
import { applyPersonalityDevelopment } from './utils/personality';
import { usePWAUpdate } from './hooks/usePWAUpdate';
import { soundFX } from './utils/sound';
import {
  applyTimeDecay,
  clampStat,
  clampWeight,
  formatLocalDate,
  formatLocalTime,
  incrementTaskProgress,
  loadGameState,
  resetGameState,
  roundWeight,
  saveGameState,
  syncDailyTasks,
} from './utils/storage';

export default function App() {
  const [game, setGame] = useState<GameState>(() => loadGameState());
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [questsInitialSection, setQuestsInitialSection] = useState<'daily' | 'growth'>('daily');
  const [journalInitialSection, setJournalInitialSection] = useState<
    'journal' | 'personality' | 'encyclopedia'
  >('journal');
  const [journalEncyclopediaSection, setJournalEncyclopediaSection] =
    useState<EncyclopediaSection>('foods');
  const [houseModalOpen, setHouseModalOpen] = useState<boolean>(false);
  const [houseModalTab, setHouseModalTab] = useState<HouseModalTab>('room');
  const [actionState, setActionState] = useState<PiggyActionState>('idle');
  const [expressionState, setExpressionState] = useState<PetExpression>('normal');
  const [flyingFoodEmoji, setFlyingFoodEmoji] = useState<string | null>(null);
  const [feedEffect, setFeedEffect] = useState<FeedingVisualEffect>('none');
  const [feedParticles, setFeedParticles] = useState<string[]>([]);
  const [speech, setSpeech] = useState<string>('今天也想吃好吃的！');
  const [feedbacks, setFeedbacks] = useState<FloatingFeedback[]>([]);
  const [levelUpStage, setLevelUpStage] = useState<GrowthStageInfo | null>(null);
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(null);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [sharedModalOpen, setSharedModalOpen] = useState<boolean>(false);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [minigameOpen, setMinigameOpen] = useState<boolean>(false);
  const [coopModalOpen, setCoopModalOpen] = useState<boolean>(false);
  const [personalityModalOpen, setPersonalityModalOpen] = useState<boolean>(false);
  const [dialogueHistoryOpen, setDialogueHistoryOpen] = useState<boolean>(false);
  const [pendingCloudSave, setPendingCloudSave] = useState<CloudSavePayload | null>(null);
  const [sharedRoom, setSharedRoom] = useState<SharedPetRoom | null>(null);
  const [sharedMessages, setSharedMessages] = useState<PetMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  const currentUserId = cloudUser?.id ?? 'local';
  const actorName = cloudUser?.email ? cloudUser.email.split('@')[0] || '飼主' : '飼主';
  const {
    showUpdateBanner,
    updating: updatingApp,
    applyUpdate: handleApplyAppUpdate,
    dismissUpdate: handleDismissAppUpdate,
  } = usePWAUpdate();

  const actionTimerRef = useRef<number | null>(null);
  const feedPhaseTimerRef = useRef<number | null>(null);
  const prevStageLevelRef = useRef<number>(getGrowthStage(game.pet.growth).level);
  const gameRef = useRef<GameState>(game);
  const skipNextCloudUploadRef = useRef<boolean>(false);
  const lastHandledUserIdRef = useRef<string | null>(null);
  const lastSharedUpdatedAtRef = useRef<string | null>(null);
  const messageModalOpenRef = useRef<boolean>(messageModalOpen);
  const lastSpeechRef = useRef<string>('');
  const lastExpressionRef = useRef<PetExpression>('normal');
  const prevMilestonesCountRef = useRef<number>(
    game.encyclopedia.claimedAccessoryMilestones.length
  );
  const prevTitlesCountRef = useRef<number>(
    game.encyclopedia.unlockedTitles.length
  );

  gameRef.current = game;
  messageModalOpenRef.current = messageModalOpen;

  useEffect(() => {
    saveGameState(game);
  }, [game]);

  useEffect(() => {
    const milestoneLen = game.encyclopedia.claimedAccessoryMilestones.length;
    if (milestoneLen > prevMilestonesCountRef.current) {
      const latest = game.encyclopedia.claimedAccessoryMilestones[milestoneLen - 1];
      pushFeedback(`收集 ${latest} 款配件里程碑 +50 金幣！`, '🎉');
    }
    prevMilestonesCountRef.current = milestoneLen;

    const titlesLen = game.encyclopedia.unlockedTitles.length;
    if (titlesLen > prevTitlesCountRef.current) {
      const latestTitleId = game.encyclopedia.unlockedTitles[titlesLen - 1];
      const def = getTitleDefinition(latestTitleId);
      soundFX.levelUp(game.soundEnabled);
      pushFeedback(`獲得稱號「${def.name}」！`, def.emoji);
      setSpeech(`太厲害了！我們獲得專屬稱號「${def.name}」囉！`);
    }
    prevTitlesCountRef.current = titlesLen;
  }, [
    game.encyclopedia.claimedAccessoryMilestones,
    game.encyclopedia.unlockedTitles,
    game.soundEnabled,
  ]);

  const applyCloudStateLocally = useCallback((cloudState: GameState, customSpeech?: string) => {
    skipNextCloudUploadRef.current = true;
    prevStageLevelRef.current = getGrowthStage(cloudState.pet.growth).level;
    setGame(cloudState);
    setSpeech(customSpeech ?? `歡迎回來，${cloudState.pet.name}！`);
  }, []);

  const syncAfterSignIn = useCallback(
    async (user: CloudUser, openModalOnConflict: boolean) => {
      setSyncStatus('syncing');
      setSyncError(null);

      // 1. 優先檢查是否已加入兩人共養小屋
      const sharedRes = await fetchMySharedPet(user.id);
      if (sharedRes.room) {
        setSharedRoom(sharedRes.room);
        lastSharedUpdatedAtRef.current = sharedRes.room.updatedAt;
        if (sharedRes.state) {
          applyCloudStateLocally(
            sharedRes.state,
            `回到與夥伴共養的「${sharedRes.state.pet.name}」身邊囉！`
          );
        }
        setPendingCloudSave(null);
        setSyncStatus('synced');
        setLastSyncedAt(sharedRes.room.updatedAt);
        return;
      }

      setSharedRoom(null);

      // 2. 若未加入共養，改同步個人雲端存檔
      const { state: cloudState, updatedAt, error } = await fetchCloudSave(user.id);

      if (error) {
        setSyncStatus('error');
        setSyncError(error);
        return;
      }

      const currentLocal = gameRef.current;

      if (cloudState) {
        if (!currentLocal.pet.hatched) {
          applyCloudStateLocally(cloudState);
          setSyncStatus('synced');
          setLastSyncedAt(updatedAt);
          setPendingCloudSave(null);
          return;
        }

        if (cloudState.lastSavedAt === currentLocal.lastSavedAt) {
          setSyncStatus('synced');
          setLastSyncedAt(updatedAt);
          setPendingCloudSave(null);
          return;
        }

        setPendingCloudSave({
          state: cloudState,
          updatedAt: updatedAt ?? new Date().toISOString(),
        });
        setSyncStatus('local');
        if (openModalOnConflict) {
          setAuthModalOpen(true);
        }
        return;
      }

      if (currentLocal.pet.hatched) {
        const uploaded = await upsertCloudSave(user.id, currentLocal);
        if (uploaded.error) {
          setSyncStatus('error');
          setSyncError(uploaded.error);
        } else {
          setSyncStatus('synced');
          setLastSyncedAt(uploaded.updatedAt);
        }
      } else {
        setSyncStatus('synced');
      }
    },
    [applyCloudStateLocally]
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const sessionUser = data.session?.user;
      if (sessionUser) {
        const nextUser: CloudUser = {
          id: sessionUser.id,
          email: sessionUser.email ?? '',
        };
        setCloudUser(nextUser);
        if (lastHandledUserIdRef.current !== nextUser.id) {
          lastHandledUserIdRef.current = nextUser.id;
          void syncAfterSignIn(nextUser, false);
        }
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const sessionUser = session?.user;
      if (sessionUser) {
        const nextUser: CloudUser = {
          id: sessionUser.id,
          email: sessionUser.email ?? '',
        };
        setCloudUser(nextUser);
        if (lastHandledUserIdRef.current !== nextUser.id) {
          lastHandledUserIdRef.current = nextUser.id;
          void syncAfterSignIn(nextUser, true);
        }
      } else {
        lastHandledUserIdRef.current = null;
        lastSharedUpdatedAtRef.current = null;
        setCloudUser(null);
        setSharedRoom(null);
        setPendingCloudSave(null);
        setSyncStatus('local');
        setSyncError(null);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [syncAfterSignIn]);

  // 兩人共養即時訂閱（Supabase Realtime）＋回到頁面自動刷新
  useEffect(() => {
    if (!isSupabaseConfigured || !cloudUser || !sharedRoom) return;

    const roomId = sharedRoom.id;
    const unsubscribe = subscribeToSharedPet(roomId, (remoteRoom, remoteState, deleted) => {
      if (deleted) {
        lastSharedUpdatedAtRef.current = null;
        setSharedRoom(null);
        setSpeech('共養小屋已解散，已切回單人照護模式。');
        return;
      }

      if (!remoteRoom) return;

      setSharedRoom(remoteRoom);

      const isFromPartner =
        remoteRoom.lastActorId !== null && remoteRoom.lastActorId !== cloudUser.id;
      const isNewerTimestamp = remoteRoom.updatedAt !== lastSharedUpdatedAtRef.current;

      if (isFromPartner && remoteState && isNewerTimestamp) {
        lastSharedUpdatedAtRef.current = remoteRoom.updatedAt;
        setLastSyncedAt(remoteRoom.updatedAt);
        setSyncStatus('synced');
        const mergedState = mergeCoopRemoteState(gameRef.current, remoteState);
        const evaluatedDialogue = evaluateAndSelectDialogue(mergedState, cloudUser.id);
        const nextMerged: GameState = { ...mergedState, dialogue: evaluatedDialogue };
        applyCloudStateLocally(nextMerged, `夥伴剛剛照顧了${nextMerged.pet.name}與小屋！`);
        const fbId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        setFeedbacks((prev) => [...prev.slice(-4), { id: fbId, text: '夥伴剛更新了共養空間！', emoji: '💞' }]);
        window.setTimeout(() => {
          setFeedbacks((prev) => prev.filter((item) => item.id !== fbId));
        }, 1500);
      }
    });

    const handleResumeSync = () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      void fetchMySharedPet(cloudUser.id).then((res) => {
        if (res.error) return;
        if (!res.room) {
          setSharedRoom(null);
          return;
        }
        setSharedRoom(res.room);
        if (
          res.room.lastActorId !== cloudUser.id &&
          res.state &&
          res.room.updatedAt !== lastSharedUpdatedAtRef.current
        ) {
          lastSharedUpdatedAtRef.current = res.room.updatedAt;
          setLastSyncedAt(res.room.updatedAt);
          const mergedState = mergeCoopRemoteState(gameRef.current, res.state);
          const evaluatedDialogue = evaluateAndSelectDialogue(mergedState, cloudUser.id);
          applyCloudStateLocally({ ...mergedState, dialogue: evaluatedDialogue });
        }
      });
    };

    const periodicTimer = window.setInterval(handleResumeSync, 15000);
    window.addEventListener('focus', handleResumeSync);
    window.addEventListener('online', handleResumeSync);

    return () => {
      unsubscribe();
      window.clearInterval(periodicTimer);
      window.removeEventListener('focus', handleResumeSync);
      window.removeEventListener('online', handleResumeSync);
    };
  }, [cloudUser, sharedRoom?.id, applyCloudStateLocally]);

  // 共養留言板與貼圖載入＋Realtime 訂閱
  useEffect(() => {
    if (!isSupabaseConfigured || !cloudUser || !sharedRoom) {
      setSharedMessages([]);
      setMessagesError(null);
      setMessagesLoading(false);
      return;
    }

    let mounted = true;
    const roomId = sharedRoom.id;
    setMessagesLoading(true);
    setMessagesError(null);

    void fetchSharedMessages(roomId).then((res) => {
      if (!mounted) return;
      setMessagesLoading(false);
      if (res.error) {
        setMessagesError(res.error);
      } else {
        setSharedMessages(res.messages);
      }
    });

    const unsubscribeMessages = subscribeToSharedMessages(roomId, {
      onInsert: (incoming) => {
        if (!mounted) return;
        setSharedMessages((prev) => {
          if (prev.some((m) => m.id === incoming.id)) return prev;
          return [...prev, incoming].slice(-80);
        });

        if (incoming.authorId !== cloudUser.id) {
          soundFX.heart(gameRef.current.soundEnabled);
          if (!messageModalOpenRef.current) {
            setUnreadMessagesCount((c) => c + 1);
          }
          const stickerInfo = getStickerById(incoming.stickerId);
          const toastText = stickerInfo
            ? `夥伴傳來「${stickerInfo.label}」貼圖！`
            : '夥伴傳來新留言！';
          const fbId = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          setFeedbacks((prev) => [...prev.slice(-4), { id: fbId, text: toastText, emoji: '💌' }]);
          window.setTimeout(() => {
            setFeedbacks((prev) => prev.filter((item) => item.id !== fbId));
          }, 1600);

          setGame((prev) => {
            const nextDialogue = appendMemoryEvent(prev.dialogue, {
              type: 'partnerMessage',
              detail: incoming.content || stickerInfo?.label || '貼圖留言',
              actorId: incoming.authorId,
              actorName: incoming.authorName,
              isCoopHighlight: true,
              createdAt: incoming.createdAt,
            });
            const evaluated = evaluateAndSelectDialogue(
              { ...prev, dialogue: nextDialogue },
              cloudUser.id
            );
            return {
              ...prev,
              dialogue: evaluated,
            };
          });
        }
      },
      onDelete: (deletedId) => {
        if (!mounted) return;
        setSharedMessages((prev) => prev.filter((m) => m.id !== deletedId));
      },
    });

    return () => {
      mounted = false;
      unsubscribeMessages();
    };
  }, [cloudUser, sharedRoom?.id]);

  useEffect(() => {
    if (!isSupabaseConfigured || !cloudUser || pendingCloudSave || !game.pet.hatched) {
      return;
    }

    if (skipNextCloudUploadRef.current) {
      skipNextCloudUploadRef.current = false;
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return;
    }

    const delayMs = sharedRoom
      ? game.coop.activeRoomSession?.status === 'active'
        ? 250
        : 800
      : 1500;
    const timer = window.setTimeout(() => {
      setSyncStatus('syncing');
      setSyncError(null);

      if (sharedRoom) {
        void updateSharedPetSave(
          sharedRoom.id,
          game,
          cloudUser.id,
          cloudUser.email
        ).then((res) => {
          if (res.error) {
            setSyncStatus('error');
            setSyncError(res.error);
          } else {
            lastSharedUpdatedAtRef.current = res.updatedAt;
            setSyncStatus('synced');
            setLastSyncedAt(res.updatedAt);
          }
        });
      } else {
        void upsertCloudSave(cloudUser.id, game).then((res) => {
          if (res.error) {
            setSyncStatus('error');
            setSyncError(res.error);
          } else {
            setSyncStatus('synced');
            setLastSyncedAt(res.updatedAt);
          }
        });
      }
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [game, cloudUser, pendingCloudSave, sharedRoom]);

  useEffect(() => {
    const currentStage = getGrowthStage(game.pet.growth);
    if (currentStage.level > prevStageLevelRef.current) {
      soundFX.levelUp(game.soundEnabled);
      setLevelUpStage(currentStage);
      setGame((prev) => ({
        ...prev,
        dialogue: appendMemoryEvent(prev.dialogue, {
          type: 'milestone',
          detail: `升上 Lv.${currentStage.level} ${currentStage.name}`,
        }),
      }));
    }
    prevStageLevelRef.current = currentStage.level;
  }, [game.pet.growth, game.soundEnabled]);

  // 啟動與回到頁面時評估一次對話氣泡（含昨日最愛食物回顧 / 急迫需求 / 時間問候）
  useEffect(() => {
    if (!game.pet.hatched) return;
    const evaluateNow = () => {
      setGame((prev) => {
        if (!prev.pet.hatched) return prev;
        const nextDialogue = evaluateAndSelectDialogue(prev, currentUserId);
        return nextDialogue === prev.dialogue
          ? prev
          : { ...prev, dialogue: nextDialogue };
      });
    };
    const initTimer = window.setTimeout(evaluateNow, 900);
    window.addEventListener('focus', evaluateNow);
    return () => {
      window.clearTimeout(initTimer);
      window.removeEventListener('focus', evaluateNow);
    };
  }, [game.pet.hatched, currentUserId]);

  useEffect(() => {
    if (!game.pet.hatched) return;
    const timer = window.setInterval(() => {
      setGame((prev) => {
        const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
        const decayedPet = applyTimeDecay(prev.pet, 20000);
        const syncedCoop = syncCoopHubState(prev.coop);
        const draft: GameState = {
          ...prev,
          dailyTasks: synced.dailyTasks,
          dailyTasksDate: synced.dailyTasksDate,
          pet: decayedPet,
          coop: syncedCoop,
        };
        const nextDialogue = evaluateAndSelectDialogue(draft, currentUserId);
        return {
          ...draft,
          dialogue: nextDialogue,
        };
      });
    }, 20000);
    return () => window.clearInterval(timer);
  }, [game.pet.hatched, currentUserId]);

  const clearAnimationTimers = () => {
    if (actionTimerRef.current) {
      window.clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
    if (feedPhaseTimerRef.current) {
      window.clearTimeout(feedPhaseTimerRef.current);
      feedPhaseTimerRef.current = null;
    }
  };

  const setTemporaryAction = (
    nextAction: PiggyActionState,
    durationMs = 1500,
    nextExpression: PetExpression = 'normal'
  ) => {
    clearAnimationTimers();
    setFlyingFoodEmoji(null);
    setFeedEffect('none');
    setFeedParticles([]);
    setActionState(nextAction);
    setExpressionState(nextExpression);
    actionTimerRef.current = window.setTimeout(() => {
      setActionState('idle');
      setExpressionState('normal');
    }, durationMs);
  };

  const pushFeedback = (text: string, emoji?: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setFeedbacks((prev) => [...prev.slice(-4), { id, text, emoji }]);
    window.setTimeout(() => {
      setFeedbacks((prev) => prev.filter((item) => item.id !== id));
    }, 1250);
  };

  const handleHatchComplete = (petName: string, species: PetSpecies) => {
    const now = new Date();
    const todayStr = formatLocalDate(now);
    const speciesInfo = getPetSpeciesInfo(species);
    const initialWeightLog: WeightLog = {
      id: `wlog_${Date.now()}`,
      date: todayStr,
      weight: game.pet.weight,
      foodName: '破殼報到',
      note: `${petName}（${speciesInfo.label}）來到萌寵食堂的第一天！`,
      weightDelta: 0,
      timeStr: formatLocalTime(now),
      timestamp: now.getTime(),
    };
    soundFX.petVoice(game.soundEnabled, species);
    setGame((prev) => ({
      ...prev,
      pet: {
        ...prev.pet,
        name: petName,
        species,
        hatched: true,
      },
      weightLogs: [initialWeightLog, ...prev.weightLogs],
      noviceGrowth: {
        ...prev.noviceGrowth,
        startedDate: prev.noviceGrowth.startedDate || todayStr,
      },
    }));
    setSpeech(`嗨～我是${petName}，${speciesInfo.greeting}`);
  };

  const handleChangeSpecies = (species: PetSpecies) => {
    if (game.pet.species === species) return;
    const speciesInfo = getPetSpeciesInfo(species);
    soundFX.petVoice(game.soundEnabled, species);
    setGame((prev) => ({
      ...prev,
      pet: {
        ...prev.pet,
        species,
      },
    }));
    setSpeech(`變身成「${speciesInfo.label}」囉！${speciesInfo.greeting}`);
    pushFeedback(`切換為${speciesInfo.shortName}`, '✨');
  };

  const handlePet = (zone: PetTouchZone = 'head') => {
    const zoneMeta = TOUCH_ZONE_META[zone];
    const nextSpeech = getRandomZoneSpeech(
      game.pet.species,
      zone,
      game.pet.mood,
      lastSpeechRef.current
    );
    const nextFeedback = pickRandomNonRepeating(zoneMeta.feedbacks);
    const nextExpression = pickRandomNonRepeating(
      zoneMeta.expressions,
      lastExpressionRef.current
    );

    lastSpeechRef.current = nextSpeech;
    lastExpressionRef.current = nextExpression;

    const isStormWeather = game.dialogue.weather.condition === 'storm';
    soundFX.petVoice(game.soundEnabled, game.pet.species);
    setTemporaryAction('petted', 1100, nextExpression);
    pushFeedback(
      isStormWeather ? `${nextFeedback.text} (雷雨安慰加成)` : nextFeedback.text,
      nextFeedback.emoji
    );
    setSpeech(nextSpeech);

    setGame((prev) => {
      const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
      const stormMoodBonus = prev.dialogue.weather.condition === 'storm' ? 2 : 0;
      const stormIntimacyBonus = prev.dialogue.weather.condition === 'storm' ? 1 : 0;
      const nextGrowth = prev.pet.growth + 5;
      const dev = applyPersonalityDevelopment(prev.personality, 'pet_or_message');
      const zoneLabels: Record<PetTouchZone, string> = {
        head: '摸摸頭',
        cheek: '捏捏臉頰',
        belly: '揉揉肚肚',
        paw: '牽牽小手',
      };
      const nextDialogue = appendMemoryEvent(prev.dialogue, {
        type: 'petted',
        detail: zoneLabels[zone],
      });
      return {
        ...prev,
        pet: {
          ...prev.pet,
          mood: clampStat(prev.pet.mood + 6 + stormMoodBonus, 0, 100),
          intimacy: prev.pet.intimacy + 2 + stormIntimacyBonus,
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        personality: dev.nextPersonality,
        dialogue: nextDialogue,
        dailyTasks: incrementTaskProgress(synced.dailyTasks, 'pet_3', 1),
        dailyTasksDate: synced.dailyTasksDate,
        noviceGrowth: {
          ...prev.noviceGrowth,
          petCount: prev.noviceGrowth.petCount + 1,
        },
      };
    });
  };

  const handleFeed = (food: Food) => {
    if ((game.foods[food.id] ?? 0) <= 0) {
      setSpeech(`哎呀，${food.name}吃光了，去食堂買一些吧！`);
      return;
    }

    if (game.pet.hunger >= 100) {
      soundFX.pop(game.soundEnabled);
      const fullMessage = `${game.pet.name}已經吃飽了！`;
      setSpeech(fullMessage);
      pushFeedback(fullMessage, '🍽️');
      return;
    }

    const speciesInfo = getPetSpeciesInfo(game.pet.species);
    const isFavorite = speciesInfo.favoriteFoodIds.includes(food.id);
    const nextFastFoodStreak =
      food.category === 'fastFood' ? game.pet.consecutiveFastFood + 1 : 0;
    const outcome = resolveFeedingOutcome(
      food,
      game.pet.species,
      nextFastFoodStreak,
      lastSpeechRef.current
    );
    lastSpeechRef.current = outcome.speech;

    // Phase 1: Food flies toward pet + pet opens mouth
    clearAnimationTimers();
    setFlyingFoodEmoji(food.emoji);
    setFeedEffect('none');
    setFeedParticles([]);
    setActionState('opening');
    setExpressionState('sparkle');
    soundFX.pop(game.soundEnabled);

    // Phase 2: Pet chews + hearts/particles + data-driven reaction
    feedPhaseTimerRef.current = window.setTimeout(() => {
      setFlyingFoodEmoji(null);
      soundFX.chew(game.soundEnabled);
      if (outcome.isFavorite && !outcome.isStuffed) {
        soundFX.petVoice(game.soundEnabled, game.pet.species);
      }

      setActionState(outcome.action);
      setFeedEffect(outcome.visualEffect);
      setFeedParticles(outcome.particleEmojis);
      setExpressionState(outcome.expression);
      setSpeech(outcome.speech);
      pushFeedback(outcome.feedbackText, outcome.feedbackEmoji);

      actionTimerRef.current = window.setTimeout(() => {
        setActionState('idle');
        setFeedEffect('none');
        setFeedParticles([]);
        setExpressionState('normal');
      }, 1450);
    }, 480);

    const now = new Date();
    const dateStr = formatLocalDate(now);
    const timeStr = formatLocalTime(now);
    const effectiveFavorite = outcome.isFavorite;
    const bonusMood = effectiveFavorite ? 6 : 0;
    const bonusGrowth = effectiveFavorite ? 4 : 0;
    const bonusIntimacy = effectiveFavorite ? 1 : 0;
    const isDessertOrFastFood =
      food.category === 'snack' || food.category === 'fastFood';

    setGame((prev) => {
      const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
      const newWeight = clampWeight(prev.pet.weight + food.weightGain);
      const actualDelta = roundWeight(newWeight - prev.pet.weight);
      const nextGrowth = prev.pet.growth + food.growthGain + bonusGrowth;
      const nextPersonality = isDessertOrFastFood
        ? applyPersonalityDevelopment(prev.personality, 'feed_dessert_fastfood')
            .nextPersonality
        : prev.personality;

      const newWeightLog: WeightLog = {
        id: `wlog_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        date: dateStr,
        weight: newWeight,
        foodName: food.name,
        note:
          nextFastFoodStreak >= 3
            ? '連吃三次速食，肚子圓鼓鼓建議散步'
            : effectiveFavorite
            ? `吃到${speciesInfo.shortName}最愛料理！心情與成長額外加成`
            : outcome.isDisliked
            ? `雖然不太合胃口，還是乖乖吃完了（零懲罰）`
            : `享用美味${FOOD_CATEGORY_LABELS[food.category]}，心情超好！`,
        weightDelta: actualDelta,
        timeStr,
        timestamp: now.getTime(),
      };

      const newFeedLog: FeedLog = {
        id: `flog_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        date: dateStr,
        foodId: food.id,
        weightChange: actualDelta,
      };

      const nextCollectedFoods = prev.encyclopedia.collectedFoodIds.includes(food.id)
        ? prev.encyclopedia.collectedFoodIds
        : [...prev.encyclopedia.collectedFoodIds, food.id];

      let nextDialogue = prev.dialogue;
      if (outcome.isStuffed) {
        nextDialogue = appendMemoryEvent(nextDialogue, {
          type: 'stuffed',
          detail: food.name,
          foodId: food.id,
        });
      } else if (effectiveFavorite) {
        nextDialogue = appendMemoryEvent(nextDialogue, {
          type: 'fedFavoriteFood',
          detail: food.name,
          foodId: food.id,
        });
      } else if (outcome.isDisliked) {
        nextDialogue = appendMemoryEvent(nextDialogue, {
          type: 'fedDislikedFood',
          detail: food.name,
          foodId: food.id,
        });
      }
      if (sharedRoom) {
        nextDialogue = appendMemoryEvent(nextDialogue, {
          type: 'partnerFed',
          detail: food.name,
          foodId: food.id,
          actorId: currentUserId,
          actorName,
          isCoopHighlight: true,
        });
      }

      const draftState: GameState = {
        ...prev,
        foods: {
          ...prev.foods,
          [food.id]: Math.max(0, (prev.foods[food.id] ?? 1) - 1),
        },
        pet: {
          ...prev.pet,
          hunger: clampStat(prev.pet.hunger + food.hunger, 0, 100),
          mood: clampStat(prev.pet.mood + food.mood + bonusMood, 0, 100),
          weight: newWeight,
          roundness: clampStat(prev.pet.roundness + food.roundness, 0, 100),
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
          intimacy: prev.pet.intimacy + 2 + bonusIntimacy,
          consecutiveFastFood: nextFastFoodStreak,
        },
        personality: nextPersonality,
        dialogue: nextDialogue,
        weightLogs: [newWeightLog, ...prev.weightLogs],
        feedLogs: [newFeedLog, ...prev.feedLogs],
        dailyTasks: incrementTaskProgress(synced.dailyTasks, 'feed_1', 1),
        dailyTasksDate: synced.dailyTasksDate,
        noviceGrowth: {
          ...prev.noviceGrowth,
          feedCount: prev.noviceGrowth.feedCount + 1,
          fedFavoriteCount: prev.noviceGrowth.fedFavoriteCount + (effectiveFavorite ? 1 : 0),
        },
        encyclopedia: {
          ...prev.encyclopedia,
          collectedFoodIds: nextCollectedFoods,
        },
      };

      return syncEncyclopediaRewards(draftState).nextState;
    });
  };

  const handleSleep = () => {
    soundFX.pop(game.soundEnabled);
    setTemporaryAction('sleeping', 2400);
    setSpeech('晚安… 睡飽飽更有精神！');
    pushFeedback('精力恢復中', '💤');

    setGame((prev) => {
      const nextGrowth = prev.pet.growth + 4;
      const dev = applyPersonalityDevelopment(prev.personality, 'sleep');
      const nextDialogue = appendMemoryEvent(prev.dialogue, {
        type: 'slept',
        detail: '安心午睡',
      });
      return {
        ...prev,
        pet: {
          ...prev.pet,
          energy: clampStat(prev.pet.energy + 28, 0, 100),
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        personality: dev.nextPersonality,
        dialogue: nextDialogue,
      };
    });
  };

  const handleBath = () => {
    soundFX.bubble(game.soundEnabled);
    setTemporaryAction('bathing', 2200, 'shy');
    setSpeech('洗澎澎囉～全身香噴噴！');
    pushFeedback('香噴噴！', '🫧');

    setGame((prev) => {
      const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
      const nextGrowth = prev.pet.growth + 6;
      const dev = applyPersonalityDevelopment(prev.personality, 'clean_or_bath');
      const nextDialogue = appendMemoryEvent(prev.dialogue, {
        type: 'bathed',
        detail: '香噴噴泡泡浴',
      });
      return {
        ...prev,
        pet: {
          ...prev.pet,
          cleanliness: clampStat(prev.pet.cleanliness + 35, 0, 100),
          mood: clampStat(prev.pet.mood + 6, 0, 100),
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        personality: dev.nextPersonality,
        dialogue: nextDialogue,
        dailyTasks: incrementTaskProgress(synced.dailyTasks, 'clean_1', 1),
        dailyTasksDate: synced.dailyTasksDate,
      };
    });
  };

  const handleWalk = () => {
    const isSunny = game.dialogue.weather.condition === 'clear';
    soundFX.heart(game.soundEnabled);
    setTemporaryAction('walking', 1800, 'wink');
    setSpeech(
      isSunny
        ? '大晴天出來散步曬太陽，心情好到飛起來！'
        : '出來散步吹吹風，身體好輕鬆！'
    );
    pushFeedback(isSunny ? '晴天散步加成 +3 心情！' : '活力滿滿！', isSunny ? '☀️' : '🌿');

    setGame((prev) => {
      const nextGrowth = prev.pet.growth + 8;
      const newWeight = clampWeight(prev.pet.weight - 0.1);
      const sunnyMoodBonus = prev.dialogue.weather.condition === 'clear' ? 3 : 0;
      const sunnyIntimacyBonus = prev.dialogue.weather.condition === 'clear' ? 1 : 0;
      const nextDialogue = appendMemoryEvent(prev.dialogue, {
        type: 'walked',
        detail: prev.dialogue.weather.condition === 'clear' ? '晴天外出散步' : '外出散步',
      });
      return {
        ...prev,
        pet: {
          ...prev.pet,
          mood: clampStat(prev.pet.mood + 12 + sunnyMoodBonus, 0, 100),
          energy: clampStat(prev.pet.energy + 10, 0, 100),
          hunger: clampStat(prev.pet.hunger - 6, 0, 100),
          weight: newWeight,
          roundness: clampStat(prev.pet.roundness - 8, 0, 100),
          consecutiveFastFood: 0,
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
          intimacy: prev.pet.intimacy + 1 + sunnyIntimacyBonus,
        },
        dialogue: nextDialogue,
        noviceGrowth: {
          ...prev.noviceGrowth,
          walkCount: prev.noviceGrowth.walkCount + 1,
        },
      };
    });
  };

  const handleBuyFood = (food: Food) => {
    if (game.coins < food.price) return;
    soundFX.pop(game.soundEnabled);
    setGame((prev) => ({
      ...prev,
      coins: prev.coins - food.price,
      foods: {
        ...prev.foods,
        [food.id]: (prev.foods[food.id] ?? 0) + 1,
      },
    }));
    setSpeech(`買到「${food.name}」了，好期待開飯！`);
  };

  const handlePlantCrop = (plotId: number, ingredientId: IngredientId) => {
    const info = INGREDIENTS[ingredientId];
    if (game.coins < info.seedCost) return;
    const targetPlot = game.farmPlots.find((p) => p.id === plotId);
    if (!targetPlot || targetPlot.cropId !== null) return;

    soundFX.pop(game.soundEnabled);
    const plantedAt = Date.now();
    const durationMs = getEffectiveGrowDurationMs(info.growSeconds, game.house);
    const effectiveSec = Math.max(1, Math.round(durationMs / 1000));

    setGame((prev) => ({
      ...prev,
      coins: prev.coins - info.seedCost,
      farmPlots: prev.farmPlots.map((p) =>
        p.id === plotId ? { ...p, cropId: ingredientId, plantedAt, durationMs } : p
      ),
      noviceGrowth: {
        ...prev.noviceGrowth,
        plantedCarrotCount:
          prev.noviceGrowth.plantedCarrotCount + (ingredientId === 'carrot' ? 1 : 0),
      },
    }));
    setSpeech(`種下${info.name}種子囉，再等 ${effectiveSec} 秒就可以收成了！`);
  };

  const handleHarvestCrop = (plotId: number) => {
    const targetPlot = game.farmPlots.find((p) => p.id === plotId);
    if (!targetPlot || !targetPlot.cropId || targetPlot.plantedAt === null) return;
    if (Date.now() < targetPlot.plantedAt + targetPlot.durationMs) return;

    const cropInfo = INGREDIENTS[targetPlot.cropId];
    const harvestedId = targetPlot.cropId;
    const storageCap = getIngredientStorageCap(game.house);
    const curQty = game.ingredients[harvestedId] ?? 0;

    if (curQty >= storageCap) {
      soundFX.miss(game.soundEnabled);
      pushFeedback(`倉庫上限已滿 (${storageCap})`, '🏚️');
      setSpeech(`${cropInfo.name}已達小倉庫上限 ${storageCap} 個！快去升級小倉庫或先到廚房做料理吧！`);
      return;
    }

    const totalYield = getEffectiveHarvestYield(cropInfo.harvestYield, game.house);
    const nextQty = Math.min(storageCap, curQty + totalYield);
    const actualGain = Math.max(1, nextQty - curQty);
    soundFX.heart(game.soundEnabled);

    setGame((prev) => ({
      ...prev,
      ingredients: {
        ...prev.ingredients,
        [harvestedId]: Math.min(storageCap, (prev.ingredients[harvestedId] ?? 0) + totalYield),
      },
      farmPlots: prev.farmPlots.map((p) =>
        p.id === plotId ? { ...p, cropId: null, plantedAt: null, durationMs: 0 } : p
      ),
    }));
    pushFeedback(`${cropInfo.name} +${actualGain}`, cropInfo.emoji);
    setSpeech(`採收了新鮮${cropInfo.name}！快去廚房做料理或手作家具吧～`);
  };

  const handleExpandFarmPlot = (paySource: PaymentSource) => {
    const res = expandNextFarmPlot(game, paySource);
    if (!res.ok) {
      soundFX.miss(game.soundEnabled);
      pushFeedback(res.error ?? '無法擴建農地', '⚠️');
      if (res.error) setSpeech(res.error);
      return;
    }
    soundFX.levelUp(game.soundEnabled);
    setGame(() => res.nextState);
    if (res.notice) {
      pushFeedback(res.notice, '🌱');
      setSpeech(res.notice);
    }
  };

  const handleUpgradeFarmFacility = (upgradeId: FarmUpgradeId, paySource: PaymentSource) => {
    const res = upgradeFarmFacility(game, upgradeId, paySource);
    if (!res.ok) {
      soundFX.miss(game.soundEnabled);
      pushFeedback(res.error ?? '無法升級設施', '⚠️');
      if (res.error) setSpeech(res.error);
      return;
    }
    soundFX.levelUp(game.soundEnabled);
    setGame(() => res.nextState);
    if (res.notice) {
      pushFeedback(res.notice, '🏡');
      setSpeech(res.notice);
    }
  };

  const handleToggleFarmDecoration = (decorId: FarmDecorationId, paySource: PaymentSource) => {
    const res = buyOrToggleFarmDecoration(game, decorId, paySource);
    if (!res.ok) {
      soundFX.miss(game.soundEnabled);
      pushFeedback(res.error ?? '無法佈置裝飾', '⚠️');
      if (res.error) setSpeech(res.error);
      return;
    }
    soundFX.pop(game.soundEnabled);
    setGame(() => res.nextState);
    if (res.notice) {
      pushFeedback(res.notice, '🌸');
      setSpeech(res.notice);
    }
  };

  const handleUpdateHouseName = (newName: string) => {
    const res = updateHouseName(game, newName);
    if (!res.ok) {
      soundFX.miss(game.soundEnabled);
      if (res.error) pushFeedback(res.error, '⚠️');
      return;
    }
    soundFX.pop(game.soundEnabled);
    setGame(() => res.nextState);
    if (res.notice) {
      pushFeedback(res.notice, '🪧');
      setSpeech(res.notice);
    }
  };

  const handleCookRecipe = (recipe: KitchenRecipe) => {
    const reqEntries = Object.entries(recipe.ingredients) as [IngredientId, number][];
    const canCook = reqEntries.every(([id, need]) => (game.ingredients[id] ?? 0) >= need);
    if (!canCook) return;

    soundFX.levelUp(game.soundEnabled);
    setGame((prev) => {
      const nextIngredients = { ...prev.ingredients };
      for (const [id, need] of reqEntries) {
        nextIngredients[id] = Math.max(0, (nextIngredients[id] ?? 0) - need);
      }
      const nextGrowth = prev.pet.growth + recipe.bonusGrowth;
      const nextCollectedFoods = prev.encyclopedia.collectedFoodIds.includes(recipe.outputFoodId)
        ? prev.encyclopedia.collectedFoodIds
        : [...prev.encyclopedia.collectedFoodIds, recipe.outputFoodId];

      const draftState: GameState = {
        ...prev,
        ingredients: nextIngredients,
        foods: {
          ...prev.foods,
          [recipe.outputFoodId]: (prev.foods[recipe.outputFoodId] ?? 0) + 1,
        },
        pet: {
          ...prev.pet,
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        noviceGrowth: {
          ...prev.noviceGrowth,
          cookedCount: prev.noviceGrowth.cookedCount + 1,
        },
        encyclopedia: {
          ...prev.encyclopedia,
          collectedFoodIds: nextCollectedFoods,
        },
      };
      return syncEncyclopediaRewards(draftState).nextState;
    });
    pushFeedback(`做出 ${recipe.name}！`, recipe.emoji);
    setSpeech(`香噴噴的「${recipe.name}」出爐囉～好想馬上吃一口！`);
  };

  const handleSpendReplayCoins = (cost: number): boolean => {
    if (game.coins < cost) return false;
    setGame((prev) => {
      if (prev.coins < cost) return prev;
      return {
        ...prev,
        coins: prev.coins - cost,
      };
    });
    return true;
  };

  const handleFinishMinigame = (result: MinigameResult): MinigameSettlementSummary => {
    const preview = settleMinigameOutcome(game, result);
    const cfg = MINIGAME_BY_ID[result.gameId];

    setGame((prev) => {
      const settled = settleMinigameOutcome(prev, result).nextState;
      let nextPersonality = applyPersonalityDevelopment(
        settled.personality,
        'minigame'
      ).nextPersonality;
      let nextDialogue = settled.dialogue;
      if (result.gameId === 'mudBath') {
        nextPersonality = applyPersonalityDevelopment(
          nextPersonality,
          'clean_or_bath'
        ).nextPersonality;
        nextDialogue = appendMemoryEvent(nextDialogue, {
          type: 'bathed',
          detail: '泥巴澡小遊戲',
        });
      }
      return {
        ...settled,
        personality: nextPersonality,
        dialogue: nextDialogue,
      };
    });

    pushFeedback(`獲得 +${preview.reward.coins} 金幣`, '🪙');
    if (preview.reward.ingredientReward) {
      const ingInfo = INGREDIENTS[preview.reward.ingredientReward.id];
      pushFeedback(
        `${ingInfo.name} +${preview.reward.ingredientReward.qty}`,
        ingInfo.emoji
      );
    }
    setSpeech(
      `玩「${cfg.name}」拿了 ${result.score} 分，賺到 ${preview.reward.coins} 金幣好開心！`
    );

    return {
      result,
      reward: preview.reward,
      isNewHighScore: preview.isNewHighScore,
      newlyUnlockedBadges: preview.newlyUnlockedBadges,
    };
  };

  const handleClaimWeeklyChallenge = (challengeId: MinigameWeeklyChallengeId) => {
    const challenge = MINIGAME_WEEKLY_CHALLENGES.find((c) => c.id === challengeId);
    if (!challenge) return;
    soundFX.levelUp(game.soundEnabled);
    setGame((prev) => claimWeeklyMinigameChallenge(prev, challengeId).nextState);
    pushFeedback(`週挑戰 +${challenge.rewardCoins} 金幣`, '🏆');
    setSpeech(`完成每週挑戰「${challenge.title}」，領到 ${challenge.rewardCoins} 金幣！`);
  };

  const handleToggleEquip = (item: Accessory) => {
    soundFX.pop(game.soundEnabled);
    setGame((prev) => {
      const current = prev.pet.accessories[item.slot];
      const next = current === item.id ? null : item.id;
      return {
        ...prev,
        pet: {
          ...prev.pet,
          accessories: {
            ...prev.pet.accessories,
            [item.slot]: next,
          },
        },
      };
    });
  };

  const handleBuyAccessory = (item: Accessory) => {
    if (game.coins < item.price || game.accessories.includes(item.id)) return;
    soundFX.levelUp(game.soundEnabled);
    setGame((prev) => {
      const stage = getGrowthStage(prev.pet.growth);
      const canAutoEquip = stage.unlockedSlots.includes(item.slot);
      const draftState: GameState = {
        ...prev,
        coins: prev.coins - item.price,
        accessories: [...prev.accessories, item.id],
        pet: {
          ...prev.pet,
          accessories: canAutoEquip
            ? { ...prev.pet.accessories, [item.slot]: item.id }
            : prev.pet.accessories,
        },
        dialogue: appendMemoryEvent(prev.dialogue, {
          type: 'newAccessory',
          detail: item.name,
          itemId: item.id,
        }),
        noviceGrowth: {
          ...prev.noviceGrowth,
          boughtAccessoryCount: prev.noviceGrowth.boughtAccessoryCount + 1,
        },
      };
      return syncEncyclopediaRewards(draftState).nextState;
    });
  };

  const handleRecordWeight = (newWeight: number, note?: string) => {
    soundFX.pop(game.soundEnabled);
    const boundedWeight = clampWeight(newWeight);
    const now = new Date();
    setGame((prev) => {
      const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
      const delta = roundWeight(boundedWeight - prev.pet.weight);
      const nextGrowth = prev.pet.growth + 6;

      const newWeightLog: WeightLog = {
        id: `wlog_${Date.now()}`,
        date: formatLocalDate(now),
        weight: boundedWeight,
        foodName: '手動紀錄',
        note: note || '在成長手帳更新體重紀錄',
        weightDelta: delta,
        timeStr: formatLocalTime(now),
        timestamp: now.getTime(),
      };

      return {
        ...prev,
        pet: {
          ...prev.pet,
          weight: boundedWeight,
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        dialogue: appendMemoryEvent(prev.dialogue, {
          type: 'weightLogged',
          detail: `${boundedWeight.toFixed(1)} kg`,
        }),
        weightLogs: [newWeightLog, ...prev.weightLogs],
        dailyTasks: incrementTaskProgress(synced.dailyTasks, 'weigh_1', 1),
        dailyTasksDate: synced.dailyTasksDate,
        noviceGrowth: {
          ...prev.noviceGrowth,
          weightRecordCount: prev.noviceGrowth.weightRecordCount + 1,
        },
      };
    });
  };

  const handleClaimTask = (taskId: string) => {
    soundFX.levelUp(game.soundEnabled);

    setGame((prev) => {
      const synced = syncDailyTasks(prev.dailyTasks, prev.dailyTasksDate);
      const targetTask = synced.dailyTasks.find((t) => t.id === taskId);
      if (!targetTask || targetTask.claimed || !targetTask.completed) {
        return prev;
      }

      const nextGrowth = prev.pet.growth + 15;
      const updatedTasks = synced.dailyTasks.map((t) =>
        t.id === taskId ? { ...t, claimed: true } : t
      );

      return {
        ...prev,
        coins: prev.coins + targetTask.reward.coins,
        foods: {
          ...prev.foods,
          [targetTask.reward.foodId]:
            (prev.foods[targetTask.reward.foodId] ?? 0) + targetTask.reward.foodQty,
        },
        pet: {
          ...prev.pet,
          growth: nextGrowth,
          level: getGrowthStage(nextGrowth).level,
        },
        dailyTasks: updatedTasks,
        dailyTasksDate: synced.dailyTasksDate,
        noviceGrowth: {
          ...prev.noviceGrowth,
          completedDailyTasksCount: prev.noviceGrowth.completedDailyTasksCount + 1,
        },
      };
    });
  };

  const handleClaimNoviceDay = (day: number) => {
    const todayStr = getLocalDateString();
    const evaluation = evaluateAllNoviceDays(game, Boolean(sharedRoom), todayStr);
    const targetDay = evaluation.days.find((d) => d.config.day === day);
    if (!targetDay || !targetDay.canClaim) return;

    const dayConfig = NOVICE_GROWTH_DAYS.find((d) => d.day === day);
    if (!dayConfig) return;

    soundFX.levelUp(game.soundEnabled);
    pushFeedback(`領取第 ${day} 天獎勵 +${dayConfig.rewardCoins} 金幣！`, '🎁');
    setSpeech(`完成新手第 ${day} 天目標！獲得滿滿獎勵好開心～`);

    setGame((prev) => {
      let nextCoins = prev.coins + dayConfig.rewardCoins;
      const nextFoods = { ...prev.foods };
      const nextIngredients = { ...prev.ingredients };
      const nextAccessories = [...prev.accessories];
      const nextBackgrounds = [...prev.unlockedBackgrounds];
      let nextActiveBackground = prev.activeBackground;

      for (const rw of dayConfig.rewardItems) {
        if (rw.kind === 'accessory') {
          if (!nextAccessories.includes(rw.id)) {
            nextAccessories.push(rw.id);
          } else {
            nextCoins += 15;
          }
        } else if (rw.kind === 'food') {
          nextFoods[rw.id] = (nextFoods[rw.id] ?? 0) + rw.qty;
        } else if (rw.kind === 'ingredient') {
          const ingKey = rw.id as IngredientId;
          nextIngredients[ingKey] = (nextIngredients[ingKey] ?? 0) + rw.qty;
        } else if (rw.kind === 'background') {
          const bgKey = rw.id as StageBackgroundId;
          if (!nextBackgrounds.includes(bgKey)) {
            nextBackgrounds.push(bgKey);
          }
          nextActiveBackground = bgKey;
        }
      }

      const draftState: GameState = {
        ...prev,
        coins: nextCoins,
        foods: nextFoods,
        ingredients: nextIngredients,
        accessories: nextAccessories,
        unlockedBackgrounds: nextBackgrounds,
        activeBackground: nextActiveBackground,
        noviceGrowth: {
          ...prev.noviceGrowth,
          claimedDays: Array.from(new Set([...prev.noviceGrowth.claimedDays, day])).sort(
            (a, b) => a - b
          ),
          lastClaimDate: todayStr,
        },
      };

      return syncEncyclopediaRewards(draftState).nextState;
    });
  };

  const handleSelectBackground = (bg: StageBackgroundId) => {
    if (!game.unlockedBackgrounds.includes(bg)) return;
    soundFX.pop(game.soundEnabled);
    setGame((prev) => ({
      ...prev,
      activeBackground: bg,
    }));
    const cfg = STAGE_BACKGROUNDS[bg];
    pushFeedback(`切換為${cfg.name}`, '✨');
  };

  const handleSelectTitle = (titleId: TitleId | null) => {
    if (titleId !== null && !game.encyclopedia.unlockedTitles.includes(titleId)) return;
    soundFX.pop(game.soundEnabled);
    setGame((prev) => ({
      ...prev,
      encyclopedia: {
        ...prev.encyclopedia,
        activeTitle: titleId,
      },
    }));
    if (titleId) {
      const def = getTitleDefinition(titleId);
      pushFeedback(`佩戴「${def.name}」`, def.emoji);
    } else {
      pushFeedback('已取消佩戴稱號', '✨');
    }
  };

  const handleForceUpload = async () => {
    if (!cloudUser) return;
    setSyncStatus('syncing');
    setSyncError(null);

    if (sharedRoom) {
      const res = await updateSharedPetSave(
        sharedRoom.id,
        gameRef.current,
        cloudUser.id,
        cloudUser.email
      );
      if (res.error) {
        setSyncStatus('error');
        setSyncError(res.error);
      } else {
        lastSharedUpdatedAtRef.current = res.updatedAt;
        setSyncStatus('synced');
        setLastSyncedAt(res.updatedAt);
        pushFeedback('已同步至共養小屋！', '💞');
      }
      return;
    }

    const res = await upsertCloudSave(cloudUser.id, gameRef.current);
    if (res.error) {
      setSyncStatus('error');
      setSyncError(res.error);
    } else {
      setSyncStatus('synced');
      setLastSyncedAt(res.updatedAt);
      pushFeedback('已上傳至雲端！', '☁️');
    }
  };

  const handleForceDownload = async () => {
    if (!cloudUser) return;
    setSyncStatus('syncing');
    setSyncError(null);

    if (sharedRoom) {
      const res = await fetchMySharedPet(cloudUser.id);
      if (res.error) {
        setSyncStatus('error');
        setSyncError(res.error);
        return;
      }
      if (!res.room || !res.state) {
        setSharedRoom(null);
        setSyncStatus('local');
        setSyncError('共養小屋目前無法讀取，已切回單人模式。');
        return;
      }
      setSharedRoom(res.room);
      lastSharedUpdatedAtRef.current = res.room.updatedAt;
      applyCloudStateLocally(res.state);
      setSyncStatus('synced');
      setLastSyncedAt(res.room.updatedAt);
      pushFeedback('已重新載入共養小豬！', '💞');
      return;
    }

    const res = await fetchCloudSave(cloudUser.id);
    if (res.error) {
      setSyncStatus('error');
      setSyncError(res.error);
      return;
    }
    if (!res.state) {
      setSyncStatus('synced');
      setSyncError('雲端目前還沒有任何存檔喔！');
      return;
    }
    applyCloudStateLocally(res.state);
    setSyncStatus('synced');
    setLastSyncedAt(res.updatedAt);
    pushFeedback('已載入雲端存檔！', '☁️');
  };

  const handleResolveConflictUseCloud = () => {
    if (!pendingCloudSave) return;
    applyCloudStateLocally(pendingCloudSave.state);
    setLastSyncedAt(pendingCloudSave.updatedAt);
    setPendingCloudSave(null);
    setSyncStatus('synced');
    setAuthModalOpen(false);
    pushFeedback('已載入雲端小豬！', '☁️');
  };

  const handleResolveConflictUseLocal = async () => {
    if (!cloudUser) return;
    setSyncStatus('syncing');
    setSyncError(null);
    const res = await upsertCloudSave(cloudUser.id, gameRef.current);
    if (res.error) {
      setSyncStatus('error');
      setSyncError(res.error);
      return;
    }
    setPendingCloudSave(null);
    setSyncStatus('synced');
    setLastSyncedAt(res.updatedAt);
    setAuthModalOpen(false);
    pushFeedback('已將本機進度同步至雲端！', '☁️');
  };

  const handleCloudSignOut = async () => {
    await signOutCloud();
    lastHandledUserIdRef.current = null;
    lastSharedUpdatedAtRef.current = null;
    setCloudUser(null);
    setSharedRoom(null);
    setPendingCloudSave(null);
    setSyncStatus('local');
    setSyncError(null);
    setAuthModalOpen(false);
  };

  const handleCreateSharedRoom = async (): Promise<string | null> => {
    if (!cloudUser) return '請先登入雲端帳號。';
    setSyncStatus('syncing');
    const res = await createSharedPetRoom(gameRef.current, cloudUser.email);
    if (res.error || !res.room) {
      setSyncStatus('error');
      return res.error ?? '建立共養小屋失敗。';
    }
    setSharedRoom(res.room);
    lastSharedUpdatedAtRef.current = res.room.updatedAt;
    if (res.state) {
      applyCloudStateLocally(res.state);
    }
    setGame((prev) => ({
      ...prev,
      noviceGrowth: { ...prev.noviceGrowth, createdSharedRoom: true },
    }));
    setSyncStatus('synced');
    setLastSyncedAt(res.room.updatedAt);
    pushFeedback(`共養邀請碼：${res.room.inviteCode}`, '💞');
    return null;
  };

  const handleJoinSharedRoom = async (inviteCode: string): Promise<string | null> => {
    if (!cloudUser) return '請先登入雲端帳號。';
    setSyncStatus('syncing');
    const res = await joinSharedPetByCode(inviteCode, cloudUser.email);
    if (res.error || !res.room) {
      setSyncStatus('local');
      return res.error ?? '加入共養小屋失敗。';
    }
    setSharedRoom(res.room);
    lastSharedUpdatedAtRef.current = res.room.updatedAt;
    setPendingCloudSave(null);
    if (res.state) {
      applyCloudStateLocally(
        res.state,
        `成功加入！一起來照顧${res.state.pet.name}吧！`
      );
    }
    setGame((prev) => ({
      ...prev,
      noviceGrowth: { ...prev.noviceGrowth, createdSharedRoom: true },
    }));
    setSyncStatus('synced');
    setLastSyncedAt(res.room.updatedAt);
    pushFeedback('成功加入兩人共養！', '💞');
    return null;
  };

  const handleRegenerateInviteCode = async (): Promise<string | null> => {
    if (!sharedRoom) return '目前尚未建立共養小屋。';
    const res = await regenerateSharedInviteCode(sharedRoom.id);
    if (res.error || !res.room) {
      return res.error ?? '更新邀請碼失敗。';
    }
    setSharedRoom(res.room);
    lastSharedUpdatedAtRef.current = res.room.updatedAt;
    pushFeedback(`新邀請碼：${res.room.inviteCode}`, '✨');
    return null;
  };

  const handleRefreshSharedRoom = async (): Promise<string | null> => {
    if (!cloudUser) return '請先登入雲端帳號。';
    const res = await fetchMySharedPet(cloudUser.id);
    if (res.error) return res.error;
    if (!res.room) {
      setSharedRoom(null);
      return '找不到共養小屋，可能已被退出或解散。';
    }
    setSharedRoom(res.room);
    lastSharedUpdatedAtRef.current = res.room.updatedAt;
    if (res.state) {
      applyCloudStateLocally(res.state);
    }
    setSyncStatus('synced');
    setLastSyncedAt(res.room.updatedAt);
    return null;
  };

  const handleLeaveSharedRoom = async (): Promise<string | null> => {
    if (!sharedRoom) return null;
    const res = await leaveSharedPetRoom(sharedRoom.id);
    if (res.error) {
      return res.error;
    }
    lastSharedUpdatedAtRef.current = null;
    setSharedRoom(null);
    setSpeech('已退出共養小屋，切回個人照顧模式。');
    pushFeedback('已退出兩人共養', '☁️');
    return null;
  };

  const handleOpenMessageBoard = () => {
    setUnreadMessagesCount(0);
    setMessageModalOpen(true);
  };

  const handleSendMessage = async (
    content: string,
    stickerId: PetStickerId | null
  ): Promise<string | null> => {
    const cleanText = content.trim();
    if (!cleanText && !stickerId) {
      return '請輸入留言或選擇一張貼圖！';
    }

    const stickerInfo = getStickerById(stickerId);

    if (sharedRoom && cloudUser) {
      const res = await sendSharedMessage({
        sharedPetId: sharedRoom.id,
        authorId: cloudUser.id,
        authorEmail: cloudUser.email,
        content: cleanText,
        stickerId,
      });
      if (res.error || !res.message) {
        return res.error ?? '傳送失敗，請稍後再試。';
      }
      const created = res.message;
      setSharedMessages((prev) => {
        if (prev.some((m) => m.id === created.id)) return prev;
        return [...prev, created].slice(-80);
      });
      setGame((prev) => ({
        ...prev,
        personality: applyPersonalityDevelopment(prev.personality, 'pet_or_message')
          .nextPersonality,
        dialogue: appendMemoryEvent(prev.dialogue, {
          type: 'partnerMessage',
          detail: cleanText || stickerInfo?.label || '貼圖留言',
          actorId: cloudUser.id,
          actorName,
          isCoopHighlight: true,
        }),
      }));
      soundFX.heart(game.soundEnabled);
      if (stickerInfo) {
        setSpeech(stickerInfo.caption);
      } else {
        setSpeech('收到你的悄悄話囉～🩷');
      }
      return null;
    }

    const authorLabel = cloudUser?.email
      ? cloudUser.email.split('@')[0] || '飼主'
      : '飼主';
    const localMsg: PetMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      authorId: cloudUser?.id ?? 'local',
      authorName: authorLabel,
      content: cleanText,
      stickerId,
      createdAt: Date.now(),
    };

    setGame((prev) => ({
      ...prev,
      messages: [...prev.messages, localMsg].slice(-80),
      personality: applyPersonalityDevelopment(prev.personality, 'pet_or_message')
        .nextPersonality,
    }));
    soundFX.heart(game.soundEnabled);
    if (stickerInfo) {
      setSpeech(stickerInfo.caption);
    } else {
      setSpeech('悄悄話已記在留言板裡囉！');
    }
    return null;
  };

  const handleDeleteMessage = async (messageId: string): Promise<void> => {
    if (sharedRoom && cloudUser) {
      const res = await deleteSharedMessage(messageId);
      if (res.error) {
        setMessagesError(res.error);
        return;
      }
      setSharedMessages((prev) => prev.filter((m) => m.id !== messageId));
      return;
    }

    setGame((prev) => ({
      ...prev,
      messages: prev.messages.filter((m) => m.id !== messageId),
    }));
  };

  const handleUpdateHouseGame = (updater: (prev: GameState) => GameState) => {
    setGame((prev) => {
      const next = updater(prev);
      const prevPlacedIds = new Set(prev.house.roomLayout.placedItems.map((p) => p.instanceId));
      const newPlaced = next.house.roomLayout.placedItems.find((p) => !prevPlacedIds.has(p.instanceId));
      const newCollectedId = next.house.collectedFurnitureIds.find(
        (id) => !prev.house.collectedFurnitureIds.includes(id)
      );
      const changedItemId = newPlaced?.itemId ?? newCollectedId ?? null;
      if (!changedItemId) {
        return next;
      }
      const itemName = ROOM_ITEM_BY_ID[changedItemId]?.name ?? '新家具';
      return {
        ...next,
        dialogue: appendMemoryEvent(next.dialogue, {
          type: 'newRoomItem',
          detail: itemName,
          itemId: changedItemId,
          actorId: currentUserId,
          actorName,
          isCoopHighlight: Boolean(sharedRoom),
        }),
      };
    });
  };

  const handleRespondDialogue = (responseId: string) => {
    const res = respondToActiveDialogue(gameRef.current, responseId);
    if (!res.response) return;
    soundFX.heart(game.soundEnabled);
    setTemporaryAction(res.response.petAction, 1500, res.response.expression);
    setSpeech(res.response.replyText);
    pushFeedback(
      `心情 +${res.response.moodGain} · 親密 +${res.response.intimacyGain}`,
      '💬'
    );
    setGame(res.nextState);
  };

  const handleDismissDialogue = () => {
    setGame((prev) => ({
      ...prev,
      dialogue: dismissActiveDialogue(prev.dialogue),
    }));
  };

  const handleUpdateDialogueSettings = (patch: Partial<DialogueSettings>) => {
    soundFX.pop(game.soundEnabled);
    setGame((prev) => ({
      ...prev,
      dialogue: updateDialogueSettings(prev.dialogue, patch),
    }));
  };

  const handleStartCoopRoomSession = (themeId?: ThemeSetId) => {
    const res = startRoomDecorSession(gameRef.current, themeId);
    if (res.ok) {
      soundFX.levelUp(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) {
        pushFeedback(res.notice, '🏡');
        setSpeech(res.notice);
      }
    }
  };

  const handleSelectCoopFurniture = (itemId: string) => {
    const res = selectCoopFurnitureForQueue(
      gameRef.current,
      itemId,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.pop(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) pushFeedback(res.notice, '🪑');
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handlePlaceCoopCandidate = (queueId: string, x: number, y: number) => {
    const prevCount = gameRef.current.house.roomLayout.placedItems.length;
    const res = placeCoopCandidateInRoom(
      gameRef.current,
      queueId,
      x,
      y,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.heart(game.soundEnabled);
      let nextState = res.nextState;
      if (nextState.house.roomLayout.placedItems.length > prevCount) {
        const added =
          nextState.house.roomLayout.placedItems[
            nextState.house.roomLayout.placedItems.length - 1
          ];
        const itemName = added
          ? ROOM_ITEM_BY_ID[added.itemId]?.name ?? '新家具'
          : '新家具';
        nextState = {
          ...nextState,
          dialogue: appendMemoryEvent(nextState.dialogue, {
            type: 'newRoomItem',
            detail: itemName,
            itemId: added?.itemId,
            actorId: currentUserId,
            actorName,
            isCoopHighlight: Boolean(sharedRoom),
          }),
        };
      }
      setGame(nextState);
      if (res.notice) pushFeedback(res.notice, '✨');
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleSettleCoopRoomSession = () => {
    const res = settleRoomDecorSession(gameRef.current);
    if (res.ok) {
      soundFX.levelUp(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) {
        pushFeedback('佈置挑戰結算！', '🎁');
        setSpeech(res.notice);
      }
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handlePlantCoopCrop = (plotId: number, ingredientId: IngredientId) => {
    const res = plantCoopCrop(
      gameRef.current,
      plotId,
      ingredientId,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.pop(game.soundEnabled);
      setGame(res.nextState);
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleHarvestCoopCrop = (plotId: number) => {
    const res = harvestCoopCropToWarehouse(
      gameRef.current,
      plotId,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.heart(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) pushFeedback(res.notice, '🧺');
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleDepositCoopIngredient = (ingredientId: IngredientId) => {
    const res = depositIngredientToCoopWarehouse(
      gameRef.current,
      ingredientId,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.pop(game.soundEnabled);
      setGame(res.nextState);
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleCookCoopRecipe = (recipe: KitchenRecipe) => {
    const res = cookCoopOrderRecipe(
      gameRef.current,
      recipe,
      currentUserId,
      actorName
    );
    if (res.ok) {
      soundFX.levelUp(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) {
        pushFeedback(`完成「${recipe.name}」`, recipe.emoji);
        setSpeech(res.notice);
      }
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleClaimCoopReward = (rewardId: string) => {
    const res = claimCoopReward(gameRef.current, rewardId, currentUserId);
    if (res.ok) {
      soundFX.levelUp(game.soundEnabled);
      setGame(res.nextState);
      if (res.notice) {
        pushFeedback('領取合作獎勵！', '🎁');
        setSpeech(res.notice);
      }
    } else {
      soundFX.miss(game.soundEnabled);
    }
    return { ok: res.ok, error: res.error, notice: res.notice };
  };

  const handleAcknowledgeOfflineEvents = () => {
    setGame((prev) => acknowledgeOfflinePartnerEvents(prev, currentUserId));
  };

  const handleShareCoopCardToBoard = async (
    title: string,
    body: string
  ): Promise<string | null> => {
    return handleSendMessage(`💌 ${title}：${body}`, 'heart');
  };

  const handleConfirmReset = () => {
    clearAnimationTimers();
    if (sharedRoom) {
      const leavingRoomId = sharedRoom.id;
      lastSharedUpdatedAtRef.current = null;
      setSharedRoom(null);
      setSharedMessages([]);
      void leaveSharedPetRoom(leavingRoomId);
    }
    const fresh = resetGameState();
    prevStageLevelRef.current = getGrowthStage(fresh.pet.growth).level;
    prevMilestonesCountRef.current = fresh.encyclopedia.claimedAccessoryMilestones.length;
    prevTitlesCountRef.current = fresh.encyclopedia.unlockedTitles.length;
    setGame(fresh);
    setActiveTab('home');
    setQuestsInitialSection('daily');
    setActionState('idle');
    setFlyingFoodEmoji(null);
    setFeedEffect('none');
    setFeedParticles([]);
    setSpeech('今天也想吃好吃的！');
    setFeedbacks([]);
    setUnreadMessagesCount(0);
    setLevelUpStage(null);
    setResetModalOpen(false);
  };

  const handleSharePhotoToBoard = async (
    photo: RoomPhotoRecord,
    caption: string
  ): Promise<string | null> => {
    const cleanCaption = caption.trim() || photo.title;
    return handleSendMessage(`${cleanCaption} [photo:${photo.id}]`, null);
  };

  const activeMessages = sharedRoom ? sharedMessages : game.messages;
  const latestMessage =
    activeMessages.length > 0 ? activeMessages[activeMessages.length - 1] : null;

  const noviceEval = evaluateAllNoviceDays(game, Boolean(sharedRoom));
  const claimableQuestsCount =
    game.dailyTasks.filter((t) => t.completed && !t.claimed).length +
    noviceEval.claimableCount;

  const unclaimedCoopRewardsCount = game.coop.pendingRewards.filter(
    (r) => !r.claimedByUserIds.includes(currentUserId)
  ).length;
  const offlinePartnerEventsCount = getOfflinePartnerEvents(
    game.coop,
    currentUserId
  ).length;
  const coopBadgeCount = unclaimedCoopRewardsCount + offlinePartnerEventsCount;

  const cloudDotColor =
    syncStatus === 'synced'
      ? 'bg-[#3BA886]'
      : syncStatus === 'syncing'
      ? 'bg-[#E6A222]'
      : syncStatus === 'error'
      ? 'bg-[#D64470]'
      : 'bg-[#BBA7A2]';

  return (
    <div className="min-h-dvh w-full bg-[#FBECE3] flex justify-center overflow-x-hidden">
      <div className="w-full max-w-[430px] min-h-dvh bg-[#FFF8ED] shadow-2xl relative flex flex-col overflow-x-hidden">
        {!game.pet.hatched ? (
          <>
            <PWAUpdateBanner
              show={showUpdateBanner}
              updating={updatingApp}
              onUpdate={() => void handleApplyAppUpdate()}
              onDismiss={handleDismissAppUpdate}
              stickyClassName="sticky top-2 z-40"
            />
            <IntroHatching
              defaultName={game.pet.name}
              defaultSpecies={game.pet.species}
              onComplete={handleHatchComplete}
              onEggTapSound={() => soundFX.pop(game.soundEnabled)}
              onHatchSound={() => soundFX.hatch(game.soundEnabled)}
              onOpenCloudAuth={() => setAuthModalOpen(true)}
              onOpenSharedPet={() => setSharedModalOpen(true)}
            />
          </>
        ) : (
          <>
            <header className="sticky top-0 z-30 h-14 px-3.5 bg-[#FFFDF8]/92 backdrop-blur-md border-b-2 border-[#F4DFD8] flex items-center justify-between gap-2">
              <h1 className="text-lg font-extrabold text-[#4A3531] tracking-tight whitespace-nowrap shrink-0">
                萌寵食堂
              </h1>

              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  className="inline-flex items-center gap-1 text-sm font-extrabold text-[#A46D0F] tabular-nums mr-0.5"
                  aria-label={`目前擁有 ${game.coins} 金幣`}
                >
                  <Coins className="w-4 h-4 text-[#E6A222]" />
                  <span>{game.coins}</span>
                </div>

                <PWAInstallButton />

                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  aria-label="雲端存檔與帳號"
                  title="雲端存檔與帳號"
                  className="relative min-h-[38px] min-w-[38px] rounded-xl bg-[#E9F7F2] text-[#256D57] flex items-center justify-center hover:bg-[#D7F0E7] transition"
                >
                  <Cloud className="w-4 h-4" />
                  <span
                    className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${cloudDotColor}`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setGame((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))
                  }
                  aria-label={game.soundEnabled ? '關閉音效' : '開啟音效'}
                  className="min-h-[38px] min-w-[38px] rounded-xl bg-[#F7ECE6] text-[#5A3E36] flex items-center justify-center hover:bg-[#EEDCD3] transition"
                >
                  {game.soundEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setResetModalOpen(true)}
                  aria-label="重置遊戲"
                  title="重置遊戲"
                  className="min-h-[38px] min-w-[38px] rounded-xl bg-[#FFE9EF] text-[#C4315B] flex items-center justify-center hover:bg-[#FFD9E3] transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </header>

            <OfflineIndicator />

            <PWAUpdateBanner
              show={showUpdateBanner}
              updating={updatingApp}
              onUpdate={() => void handleApplyAppUpdate()}
              onDismiss={handleDismissAppUpdate}
            />

            <main className="flex-1 overflow-y-auto overflow-x-hidden">
              {activeTab === 'home' && (
                <HomeView
                  pet={game.pet}
                  action={actionState}
                  expression={expressionState}
                  flyingFoodEmoji={flyingFoodEmoji}
                  feedEffect={feedEffect}
                  feedParticles={feedParticles}
                  speech={speech}
                  feedbacks={feedbacks}
                  inventory={game.foods}
                  onPet={handlePet}
                  onFeed={handleFeed}
                  onSleep={handleSleep}
                  onBath={handleBath}
                  onWalk={handleWalk}
                  onGoToCanteen={() => setActiveTab('canteen')}
                  onOpenMinigame={() => setMinigameOpen(true)}
                  onOpenHouse={(tab = 'room') => {
                    setHouseModalTab(tab);
                    setHouseModalOpen(true);
                  }}
                  house={game.house}
                  onOpenNoviceGrowth={() => {
                    setQuestsInitialSection('growth');
                    setActiveTab('quests');
                  }}
                  noviceClaimableCount={noviceEval.claimableCount}
                  activeTitle={game.encyclopedia.activeTitle}
                  activeBackground={game.activeBackground}
                  unlockedBackgrounds={game.unlockedBackgrounds}
                  onSelectBackground={handleSelectBackground}
                  sharedRoom={sharedRoom}
                  currentUserId={cloudUser?.id ?? null}
                  onOpenSharedPet={() => setSharedModalOpen(true)}
                  latestMessage={latestMessage}
                  unreadMessagesCount={unreadMessagesCount}
                  onOpenMessageBoard={handleOpenMessageBoard}
                  personality={game.personality}
                  onOpenPersonality={() => setPersonalityModalOpen(true)}
                  onOpenCoopGames={() => setCoopModalOpen(true)}
                  coopBadgeCount={coopBadgeCount}
                  activeDialogue={game.dialogue.activeBubble}
                  weather={game.dialogue.weather}
                  dialogueHistoryCount={game.dialogue.history.length}
                  onRespondDialogue={handleRespondDialogue}
                  onDismissDialogue={handleDismissDialogue}
                  onOpenDialogueHistory={() => setDialogueHistoryOpen(true)}
                />
              )}

              {activeTab === 'canteen' && (
                <CanteenView
                  pet={game.pet}
                  action={actionState}
                  flyingFoodEmoji={flyingFoodEmoji}
                  speech={speech}
                  coins={game.coins}
                  inventory={game.foods}
                  ingredients={game.ingredients}
                  farmPlots={game.farmPlots}
                  house={game.house}
                  onFeed={handleFeed}
                  onBuyFood={handleBuyFood}
                  onPlantCrop={handlePlantCrop}
                  onHarvestCrop={handleHarvestCrop}
                  onCookRecipe={handleCookRecipe}
                  onOpenMinigame={() => setMinigameOpen(true)}
                  onExpandFarmPlot={handleExpandFarmPlot}
                  onUpgradeFarmFacility={handleUpgradeFarmFacility}
                  onToggleFarmDecoration={handleToggleFarmDecoration}
                  onUpdateHouseName={handleUpdateHouseName}
                />
              )}

              {activeTab === 'wardrobe' && (
                <WardrobeView
                  pet={game.pet}
                  coins={game.coins}
                  unlockedAccessories={game.accessories}
                  encyclopedia={game.encyclopedia}
                  house={game.house}
                  onToggleEquip={handleToggleEquip}
                  onBuyAccessory={handleBuyAccessory}
                  onChangeSpecies={handleChangeSpecies}
                  onSelectTitle={handleSelectTitle}
                />
              )}

              {activeTab === 'journal' && (
                <JournalView
                  pet={game.pet}
                  personality={game.personality}
                  weightLogs={game.weightLogs}
                  onRecordWeight={handleRecordWeight}
                  onRequestReset={() => setResetModalOpen(true)}
                  cloudUser={cloudUser}
                  syncStatus={syncStatus}
                  onOpenCloudAuth={() => setAuthModalOpen(true)}
                  sharedRoom={sharedRoom}
                  onOpenSharedPet={() => setSharedModalOpen(true)}
                  messageCount={activeMessages.length}
                  onOpenMessageBoard={handleOpenMessageBoard}
                  encyclopedia={game.encyclopedia}
                  unlockedAccessories={game.accessories}
                  house={game.house}
                  initialSection={journalInitialSection}
                  initialEncyclopediaSection={journalEncyclopediaSection}
                  onOpenHousePhotoMode={() => {
                    setHouseModalTab('photo');
                    setHouseModalOpen(true);
                  }}
                  onSharePhotoToBoard={handleSharePhotoToBoard}
                  onSelectTitle={handleSelectTitle}
                  dialogueCount={game.dialogue.history.length}
                  onOpenDialogueHistory={() => setDialogueHistoryOpen(true)}
                />
              )}

              {activeTab === 'quests' && (
                <QuestsView
                  dailyTasks={game.dailyTasks}
                  dateStr={game.dailyTasksDate}
                  onClaimTask={handleClaimTask}
                  game={game}
                  hasSharedRoom={Boolean(sharedRoom)}
                  onClaimNoviceDay={handleClaimNoviceDay}
                  onSelectBackground={handleSelectBackground}
                  initialSection={questsInitialSection}
                />
              )}
            </main>

            <BottomTabBar
              activeTab={activeTab}
              onChange={(tab) => {
                if (tab === 'quests') {
                  setQuestsInitialSection('daily');
                }
                if (tab === 'journal') {
                  setJournalInitialSection('journal');
                  setJournalEncyclopediaSection('foods');
                }
                setActiveTab(tab);
              }}
              claimableQuestsCount={claimableQuestsCount}
            />

            <LevelUpModal
              stage={levelUpStage}
              petName={game.pet.name}
              onClose={() => setLevelUpStage(null)}
            />

            <ResetConfirmModal
              open={resetModalOpen}
              petName={game.pet.name}
              onClose={() => setResetModalOpen(false)}
              onConfirmReset={handleConfirmReset}
            />
          </>
        )}

        <AuthSyncModal
          open={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          isConfigured={isSupabaseConfigured}
          user={cloudUser}
          syncStatus={syncStatus}
          lastSyncedAt={lastSyncedAt}
          syncError={syncError}
          pendingCloudSave={pendingCloudSave}
          localPetName={game.pet.name}
          localPetLevel={game.pet.level}
          localPetWeight={game.pet.weight}
          localHatched={game.pet.hatched}
          sharedRoom={sharedRoom}
          onOpenSharedPet={() => setSharedModalOpen(true)}
          onAuthSuccess={(loggedInUser) => {
            setCloudUser(loggedInUser);
            if (lastHandledUserIdRef.current !== loggedInUser.id) {
              lastHandledUserIdRef.current = loggedInUser.id;
              void syncAfterSignIn(loggedInUser, true);
            }
          }}
          onSignOut={handleCloudSignOut}
          onForceUpload={handleForceUpload}
          onForceDownload={handleForceDownload}
          onResolveConflictUseCloud={handleResolveConflictUseCloud}
          onResolveConflictUseLocal={handleResolveConflictUseLocal}
        />

        <SharedPetModal
          open={sharedModalOpen}
          onClose={() => setSharedModalOpen(false)}
          isConfigured={isSupabaseConfigured}
          cloudUser={cloudUser}
          sharedRoom={sharedRoom}
          syncStatus={syncStatus}
          localPetName={game.pet.name}
          localHatched={game.pet.hatched}
          onOpenCloudAuth={() => setAuthModalOpen(true)}
          onCreateSharedRoom={handleCreateSharedRoom}
          onJoinSharedRoom={handleJoinSharedRoom}
          onRegenerateInviteCode={handleRegenerateInviteCode}
          onLeaveSharedRoom={handleLeaveSharedRoom}
          onRefreshSharedRoom={handleRefreshSharedRoom}
          onOpenCoopGames={() => setCoopModalOpen(true)}
        />

        <MessageBoardModal
          open={messageModalOpen}
          onClose={() => setMessageModalOpen(false)}
          petName={game.pet.name}
          messages={activeMessages}
          roomPhotos={game.house.photos}
          loading={messagesLoading}
          error={messagesError}
          currentUserId={cloudUser?.id ?? null}
          sharedRoom={sharedRoom}
          onSendMessage={handleSendMessage}
          onDeleteMessage={handleDeleteMessage}
        />

        <MinigameHubModal
          open={minigameOpen}
          onClose={() => setMinigameOpen(false)}
          pet={game.pet}
          coins={game.coins}
          soundEnabled={game.soundEnabled}
          hubState={game.minigameHub}
          onSpendReplayCoins={handleSpendReplayCoins}
          onFinishMinigame={handleFinishMinigame}
          onClaimWeeklyChallenge={handleClaimWeeklyChallenge}
        />

        <HouseHubModal
          open={houseModalOpen}
          initialTab={houseModalTab}
          onClose={() => setHouseModalOpen(false)}
          game={game}
          sharedRoom={sharedRoom}
          actorName={actorName}
          onUpdateGame={handleUpdateHouseGame}
          onOpenSharedPet={() => setSharedModalOpen(true)}
          onOpenCoopGames={() => setCoopModalOpen(true)}
          onOpenHouseEncyclopedia={() => {
            setJournalInitialSection('encyclopedia');
            setJournalEncyclopediaSection('house');
            setActiveTab('journal');
          }}
          onSharePhotoToBoard={handleSharePhotoToBoard}
        />

        <PersonalityProfileModal
          open={personalityModalOpen}
          onClose={() => setPersonalityModalOpen(false)}
          pet={game.pet}
          personality={game.personality}
        />

        <DialogueHistoryModal
          open={dialogueHistoryOpen}
          onClose={() => setDialogueHistoryOpen(false)}
          pet={game.pet}
          dialogue={game.dialogue}
          onUpdateSettings={handleUpdateDialogueSettings}
        />

        <CoopHubModal
          open={coopModalOpen}
          onClose={() => setCoopModalOpen(false)}
          game={game}
          sharedRoom={sharedRoom}
          currentUserId={currentUserId}
          actorName={actorName}
          onStartRoomSession={handleStartCoopRoomSession}
          onSelectFurniture={handleSelectCoopFurniture}
          onPlaceCandidate={handlePlaceCoopCandidate}
          onSettleRoomSession={handleSettleCoopRoomSession}
          onPlantCoopCrop={handlePlantCoopCrop}
          onHarvestCoopCrop={handleHarvestCoopCrop}
          onDepositIngredient={handleDepositCoopIngredient}
          onCookCoopRecipe={handleCookCoopRecipe}
          onClaimReward={handleClaimCoopReward}
          onAcknowledgeOfflineEvents={handleAcknowledgeOfflineEvents}
          onShareCardToBoard={handleShareCoopCardToBoard}
        />
      </div>
    </div>
  );
}
