import {
  DAILY_CHATTER_LINES,
  HOLIDAY_RULES,
  PERSONALITY_DIALOGUES,
  PERSONALITY_WEATHER_OVERRIDES,
  TIME_GREETINGS,
  URGENT_DIALOGUES,
  WEATHER_DIALOGUES,
  WEATHER_META,
  buildMemoryDialogueText,
  selectResponsesForDialogue,
} from '../data/dialogue';
import {
  DialogueCategory,
  DialogueLine,
  DialogueResponse,
  DialogueSettings,
  DialogueState,
  GameState,
  PersonalityId,
  PetMemoryEvent,
  PetMemoryEventType,
  TimePeriodId,
  WeatherCondition,
  WeatherState,
} from '../types';
import { clampStat } from './storage';

const MIN_PROACTIVE_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes
const MAX_PROACTIVE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const URGENT_STAT_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per urgent stat
const MAX_URGENT_REMINDERS_PER_DAY = 6;
const MEMORY_REPEAT_BLOCK_MS = 24 * 60 * 60 * 1000; // 24 hours
const PERSONALITY_CATEGORY_GAP_MS = 12 * 60 * 1000; // 12 minutes so lower tiers also surface naturally
const WEATHER_CATEGORY_GAP_MS = 20 * 60 * 1000;
const MAX_MEMORY_EVENTS = 20;
const MAX_DIALOGUE_HISTORY = 60;

export function getRandomProactiveCooldownMs(): number {
  return (
    MIN_PROACTIVE_COOLDOWN_MS +
    Math.floor(Math.random() * (MAX_PROACTIVE_COOLDOWN_MS - MIN_PROACTIVE_COOLDOWN_MS + 1))
  );
}

export function getDialogueDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getLocalTimePeriod(date: Date = new Date()): TimePeriodId {
  const hour = date.getHours();
  if (hour >= 5 && hour <= 7) return 'dawn';
  if (hour >= 8 && hour <= 10) return 'morning';
  if (hour >= 11 && hour <= 13) return 'noon';
  if (hour >= 14 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 19) return 'evening';
  if (hour >= 20 && hour <= 23) return 'night';
  return 'late_night';
}

export function isNightTimePeriod(period: TimePeriodId): boolean {
  return period === 'night' || period === 'late_night';
}

export function createInitialWeatherState(
  condition: WeatherCondition = 'clear'
): WeatherState {
  const meta = WEATHER_META[condition] ?? WEATHER_META.clear;
  return {
    condition,
    temperatureC: meta.defaultTempC,
    label: meta.label,
    emoji: meta.emoji,
    source: 'fixed',
    updatedAt: Date.now(),
  };
}

export function createInitialDialogueState(
  todayKey: string = getDialogueDateKey()
): DialogueState {
  return {
    activeBubble: null,
    history: [],
    memoryEvents: [],
    settings: {
      muteWeatherChat: false,
      muteNightNotice: false,
      muteAllProactive: false,
    },
    weather: createInitialWeatherState('clear'),
    lastProactiveAt: 0,
    nextCooldownMs: getRandomProactiveCooldownMs(),
    dailyKey: todayKey,
    urgentRemindersToday: 0,
    lastUrgentAtByStat: {},
    greetedPeriodsToday: [],
    consecutiveCareDays: 1,
    lastCareDate: todayKey,
    announcedWeightMilestones: [],
  };
}

function getDayIndex(dateKey: string): number {
  const parts = dateKey.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return 0;
  return Math.floor(Date.UTC(parts[0], parts[1] - 1, parts[2]) / 86400000);
}

export function syncDialogueDaily(
  dialogue: DialogueState,
  todayKey: string = getDialogueDateKey()
): DialogueState {
  if (dialogue.dailyKey === todayKey) {
    return dialogue;
  }
  return {
    ...dialogue,
    dailyKey: todayKey,
    urgentRemindersToday: 0,
    greetedPeriodsToday: [],
  };
}

export function recordCareDay(
  dialogue: DialogueState,
  todayKey: string = getDialogueDateKey()
): DialogueState {
  const synced = syncDialogueDaily(dialogue, todayKey);
  if (synced.lastCareDate === todayKey) {
    return synced;
  }
  const diff = synced.lastCareDate
    ? getDayIndex(todayKey) - getDayIndex(synced.lastCareDate)
    : 0;
  const nextStreak = diff === 1 ? synced.consecutiveCareDays + 1 : 1;
  return {
    ...synced,
    consecutiveCareDays: nextStreak,
    lastCareDate: todayKey,
  };
}

export interface AppendMemoryEventInput {
  type: PetMemoryEventType;
  detail: string;
  actorId?: string;
  actorName?: string;
  foodId?: string;
  itemId?: string;
  isCoopHighlight?: boolean;
  createdAt?: number;
}

export function appendMemoryEvent(
  dialogue: DialogueState,
  input: AppendMemoryEventInput
): DialogueState {
  const now = input.createdAt ?? Date.now();
  const dateKey = getDialogueDateKey(new Date(now));
  const withStreak = recordCareDay(dialogue, dateKey);

  const event: PetMemoryEvent = {
    id: `mem_${now}_${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    detail: input.detail,
    createdAt: now,
    dateKey,
    actorId: input.actorId,
    actorName: input.actorName,
    foodId: input.foodId,
    itemId: input.itemId,
    mentionedAt: null,
    isCoopHighlight: input.isCoopHighlight,
  };

  return {
    ...withStreak,
    memoryEvents: [event, ...withStreak.memoryEvents].slice(0, MAX_MEMORY_EVENTS),
  };
}

function pickFreshLine(
  candidates: string[],
  history: DialogueLine[],
  limit = 12
): string {
  const recentTexts = new Set(history.slice(0, limit).map((h) => h.text));
  const unseen = candidates.filter((c) => !recentTexts.has(c));
  const pool = unseen.length > 0 ? unseen : candidates;
  return pool[Math.floor(Math.random() * pool.length)] ?? candidates[0] ?? '';
}

function wasCategoryShownWithin(
  history: DialogueLine[],
  category: DialogueCategory,
  withinMs: number,
  now: number
): boolean {
  return history.some(
    (h) => h.category === category && now - h.createdAt < withinMs
  );
}

function wasMemoryTypeShownWithin24h(
  history: DialogueLine[],
  type: PetMemoryEventType,
  now: number
): boolean {
  return history.some(
    (h) =>
      (h.category === 'memory' || h.category === 'coop') &&
      h.memoryEventType === type &&
      now - h.createdAt < MEMORY_REPEAT_BLOCK_MS
  );
}

function makeDialogueLine(params: {
  category: DialogueCategory;
  text: string;
  priority: number;
  personality: PersonalityId;
  now: number;
  urgentStat?: 'hunger' | 'mood' | 'cleanliness' | 'energy';
  weatherCondition?: WeatherCondition;
  timePeriod?: TimePeriodId;
  memoryEventId?: string;
  memoryEventType?: PetMemoryEventType;
  isCoopHighlight?: boolean;
  actorId?: string;
}): DialogueLine {
  return {
    id: `dlg_${params.now}_${Math.random().toString(36).slice(2, 7)}`,
    category: params.category,
    text: params.text,
    priority: params.priority,
    createdAt: params.now,
    memoryEventId: params.memoryEventId,
    memoryEventType: params.memoryEventType,
    timePeriod: params.timePeriod,
    weatherCondition: params.weatherCondition,
    responses: selectResponsesForDialogue(
      params.category,
      params.personality,
      params.urgentStat,
      params.weatherCondition
    ),
    respondedId: null,
    isCoopHighlight: params.isCoopHighlight,
    actorId: params.actorId,
  };
}

function pushBubbleToDialogue(
  dialogue: DialogueState,
  line: DialogueLine,
  isNonUrgentProactive: boolean,
  now: number
): DialogueState {
  const nextMemoryEvents = line.memoryEventId
    ? dialogue.memoryEvents.map((ev) =>
        ev.id === line.memoryEventId ? { ...ev, mentionedAt: now } : ev
      )
    : dialogue.memoryEvents;

  return {
    ...dialogue,
    activeBubble: line,
    history: [line, ...dialogue.history].slice(0, MAX_DIALOGUE_HISTORY),
    memoryEvents: nextMemoryEvents,
    lastProactiveAt: isNonUrgentProactive ? now : dialogue.lastProactiveAt,
    nextCooldownMs: isNonUrgentProactive
      ? getRandomProactiveCooldownMs()
      : dialogue.nextCooldownMs,
  };
}

export function evaluateAndSelectDialogue(
  state: GameState,
  currentUserId: string,
  now: number = Date.now()
): DialogueState {
  if (!state.pet.hatched) return state.dialogue;

  const nowDate = new Date(now);
  const todayKey = getDialogueDateKey(nowDate);
  const period = getLocalTimePeriod(nowDate);
  const primaryPersonality = state.personality.primary;
  let dialogue = syncDialogueDaily(state.dialogue, todayKey);
  const settings = dialogue.settings;

  // Respect "mute all proactive dialogues"
  if (settings.muteAllProactive) {
    return dialogue;
  }

  // Co-op priority protection: never let weather/daily/lower events overwrite an active co-op bubble
  if (dialogue.activeBubble?.isCoopHighlight) {
    return dialogue;
  }

  // 0. Co-op partner immediate highlights (留言 / 餵食 / 新家具) — never wait 3-5 min
  const pendingCoopEvent = dialogue.memoryEvents.find(
    (ev) =>
      ev.isCoopHighlight &&
      !ev.mentionedAt &&
      Boolean(ev.actorId) &&
      ev.actorId !== currentUserId &&
      now - ev.createdAt <= MEMORY_REPEAT_BLOCK_MS
  );
  if (pendingCoopEvent) {
    const line = makeDialogueLine({
      category: 'coop',
      text: buildMemoryDialogueText(
        pendingCoopEvent,
        state.pet.species,
        primaryPersonality,
        todayKey
      ),
      priority: 1,
      personality: primaryPersonality,
      now,
      memoryEventId: pendingCoopEvent.id,
      memoryEventType: pendingCoopEvent.type,
      isCoopHighlight: true,
      actorId: pendingCoopEvent.actorId,
    });
    return pushBubbleToDialogue(dialogue, line, false, now);
  }

  // 1. Urgent needs (Priority 1): bypass 3-5 min cooldown, capped daily
  const statCandidates: {
    stat: 'hunger' | 'mood' | 'cleanliness' | 'energy';
    value: number;
  }[] = [
    { stat: 'hunger', value: state.pet.hunger },
    { stat: 'mood', value: state.pet.mood },
    { stat: 'cleanliness', value: state.pet.cleanliness },
    { stat: 'energy', value: state.pet.energy },
  ];
  const lowStats = statCandidates
    .filter((s) => s.value < 30)
    .sort((a, b) => a.value - b.value);

  if (
    lowStats.length > 0 &&
    !dialogue.activeBubble &&
    dialogue.urgentRemindersToday < MAX_URGENT_REMINDERS_PER_DAY
  ) {
    const target = lowStats.find((s) => {
      const lastAt = dialogue.lastUrgentAtByStat[s.stat] ?? 0;
      return now - lastAt >= URGENT_STAT_COOLDOWN_MS;
    });

    if (target) {
      const text = URGENT_DIALOGUES[target.stat][primaryPersonality];
      const line = makeDialogueLine({
        category: 'urgent',
        text,
        priority: 1,
        personality: primaryPersonality,
        now,
        urgentStat: target.stat,
      });
      const updated = pushBubbleToDialogue(dialogue, line, false, now);
      return {
        ...updated,
        urgentRemindersToday: updated.urgentRemindersToday + 1,
        lastUrgentAtByStat: {
          ...updated.lastUrgentAtByStat,
          [target.stat]: now,
        },
      };
    }
  }

  // Only 1 bubble may show on Home at once
  if (dialogue.activeBubble) {
    return dialogue;
  }

  // Night mute skips non-urgent proactive dialogues at night/late night
  if (settings.muteNightNotice && isNightTimePeriod(period)) {
    return dialogue;
  }

  // Non-urgent proactive dialogues appear at most once every 3 to 5 minutes
  const elapsedSinceProactive = now - dialogue.lastProactiveAt;
  if (dialogue.lastProactiveAt > 0 && elapsedSinceProactive < dialogue.nextCooldownMs) {
    return dialogue;
  }

  // 2. Mood & Memory Events (Priority 2): yesterday's favorite food recall or today's recent memory (no same-type repeat within 24h)
  const yesterdayFavorite = dialogue.memoryEvents.find(
    (ev) =>
      ev.type === 'fedFavoriteFood' &&
      ev.dateKey !== todayKey &&
      !ev.mentionedAt &&
      now - ev.createdAt <= 48 * 60 * 60 * 1000 &&
      !wasMemoryTypeShownWithin24h(dialogue.history, 'fedFavoriteFood', now)
  );
  const recentMemory =
    yesterdayFavorite ??
    dialogue.memoryEvents.find(
      (ev) =>
        !ev.isCoopHighlight &&
        !ev.mentionedAt &&
        now - ev.createdAt <= 36 * 60 * 60 * 1000 &&
        !wasMemoryTypeShownWithin24h(dialogue.history, ev.type, now)
    );

  if (recentMemory) {
    const line = makeDialogueLine({
      category: 'memory',
      text: buildMemoryDialogueText(
        recentMemory,
        state.pet.species,
        primaryPersonality,
        todayKey
      ),
      priority: 2,
      personality: primaryPersonality,
      now,
      memoryEventId: recentMemory.id,
      memoryEventType: recentMemory.type,
    });
    return pushBubbleToDialogue(dialogue, line, true, now);
  }

  // 3. Special Events (Priority 3): Holiday, consecutive care, weight/coop milestones
  if (!wasCategoryShownWithin(dialogue.history, 'special', 12 * 60 * 60 * 1000, now)) {
    const mmdd = todayKey.slice(5);
    const holiday = HOLIDAY_RULES.find((h) => h.mmdd === mmdd);
    if (holiday) {
      const line = makeDialogueLine({
        category: 'special',
        text: holiday.line,
        priority: 3,
        personality: primaryPersonality,
        now,
      });
      return pushBubbleToDialogue(dialogue, line, true, now);
    }

    const weightMilestones = [20, 15, 12, 10];
    const nextWeightMilestone = weightMilestones.find(
      (w) =>
        state.pet.weight >= w && !dialogue.announcedWeightMilestones.includes(w)
    );
    if (nextWeightMilestone) {
      const line = makeDialogueLine({
        category: 'special',
        text: `體重突破 ${nextWeightMilestone} kg 里程碑了！每一克都是你用心陪伴的幸福紀錄喔！`,
        priority: 3,
        personality: primaryPersonality,
        now,
      });
      const updated = pushBubbleToDialogue(dialogue, line, true, now);
      return {
        ...updated,
        announcedWeightMilestones: [
          ...updated.announcedWeightMilestones,
          nextWeightMilestone,
        ],
      };
    }

    if (state.coop.streakDays >= 3) {
      const line = makeDialogueLine({
        category: 'special',
        text: `你們已經連續 ${state.coop.streakDays} 天一起完成合作任務了！默契越來越好囉～`,
        priority: 3,
        personality: primaryPersonality,
        now,
      });
      return pushBubbleToDialogue(dialogue, line, true, now);
    }

    if (dialogue.consecutiveCareDays >= 3) {
      const line = makeDialogueLine({
        category: 'special',
        text: `已經連續 ${dialogue.consecutiveCareDays} 天每天來看我了呢！有你真幸福～`,
        priority: 3,
        personality: primaryPersonality,
        now,
      });
      return pushBubbleToDialogue(dialogue, line, true, now);
    }
  }

  // 4. Personality-Specific Dialogue (Priority 4)
  if (
    !wasCategoryShownWithin(
      dialogue.history,
      'personality',
      PERSONALITY_CATEGORY_GAP_MS,
      now
    )
  ) {
    const text = pickFreshLine(
      PERSONALITY_DIALOGUES[primaryPersonality],
      dialogue.history
    );
    const line = makeDialogueLine({
      category: 'personality',
      text,
      priority: 4,
      personality: primaryPersonality,
      now,
    });
    return pushBubbleToDialogue(dialogue, line, true, now);
  }

  // 5. Time-of-Day Greeting (Priority 5): max 1 per period per day
  if (!dialogue.greetedPeriodsToday.includes(period)) {
    const text = TIME_GREETINGS[period][primaryPersonality];
    const line = makeDialogueLine({
      category: 'time',
      text,
      priority: 5,
      personality: primaryPersonality,
      now,
      timePeriod: period,
    });
    const updated = pushBubbleToDialogue(dialogue, line, true, now);
    return {
      ...updated,
      greetedPeriodsToday: [...updated.greetedPeriodsToday, period],
    };
  }

  // 6. Weather Dialogue (Priority 6): respects muteWeatherChat
  if (
    !settings.muteWeatherChat &&
    !wasCategoryShownWithin(dialogue.history, 'weather', WEATHER_CATEGORY_GAP_MS, now)
  ) {
    const cond = dialogue.weather.condition;
    const override = PERSONALITY_WEATHER_OVERRIDES[cond]?.[primaryPersonality];
    const pool = override
      ? [override, ...WEATHER_DIALOGUES[cond]]
      : WEATHER_DIALOGUES[cond];
    const text = pickFreshLine(pool, dialogue.history);
    const line = makeDialogueLine({
      category: 'weather',
      text,
      priority: 6,
      personality: primaryPersonality,
      now,
      weatherCondition: cond,
    });
    return pushBubbleToDialogue(dialogue, line, true, now);
  }

  // 7. Daily Chatter (Priority 7)
  const dailyText = pickFreshLine(DAILY_CHATTER_LINES, dialogue.history);
  const dailyLine = makeDialogueLine({
    category: 'daily',
    text: dailyText,
    priority: 7,
    personality: primaryPersonality,
    now,
  });
  return pushBubbleToDialogue(dialogue, dailyLine, true, now);
}

export function dismissActiveDialogue(dialogue: DialogueState): DialogueState {
  if (!dialogue.activeBubble) return dialogue;
  return {
    ...dialogue,
    activeBubble: null,
  };
}

export function respondToActiveDialogue(
  state: GameState,
  responseId: string
): {
  nextState: GameState;
  response: DialogueResponse | null;
} {
  const bubble = state.dialogue.activeBubble;
  if (!bubble) return { nextState: state, response: null };

  const response = bubble.responses.find((r) => r.id === responseId) ?? null;
  if (!response) return { nextState: state, response: null };

  const isSunnyWalk =
    response.actionType === 'walk' && state.dialogue.weather.condition === 'clear';
  const extraMood = isSunnyWalk ? 3 : 0;
  const extraEnergy = response.actionType === 'sleep' ? 12 : 0;
  const extraClean = response.actionType === 'bath' ? 14 : 0;
  const extraHunger =
    response.actionType === 'feed_pudding' || response.actionType === 'feed_meal'
      ? 8
      : 0;

  const updatedHistory = state.dialogue.history.map((item) =>
    item.id === bubble.id
      ? {
          ...item,
          respondedId: response.id,
          respondedLabel: response.label,
        }
      : item
  );

  const nextState: GameState = {
    ...state,
    pet: {
      ...state.pet,
      intimacy: state.pet.intimacy + response.intimacyGain,
      mood: clampStat(state.pet.mood + response.moodGain + extraMood, 0, 100),
      hunger: clampStat(state.pet.hunger + extraHunger, 0, 100),
      energy: clampStat(state.pet.energy + extraEnergy, 0, 100),
      cleanliness: clampStat(state.pet.cleanliness + extraClean, 0, 100),
    },
    dialogue: {
      ...state.dialogue,
      activeBubble: null,
      history: updatedHistory,
    },
  };

  return { nextState, response };
}

export function updateDialogueSettings(
  dialogue: DialogueState,
  patch: Partial<DialogueSettings>
): DialogueState {
  const nextSettings: DialogueSettings = {
    ...dialogue.settings,
    ...patch,
  };
  let nextActive = dialogue.activeBubble;
  if (nextSettings.muteAllProactive) {
    nextActive = null;
  } else if (
    nextSettings.muteWeatherChat &&
    nextActive?.category === 'weather'
  ) {
    nextActive = null;
  }
  return {
    ...dialogue,
    settings: nextSettings,
    activeBubble: nextActive,
  };
}

export function mergeDialogueRemoteState(
  localDialogue: DialogueState,
  remoteDialogue: DialogueState
): DialogueState {
  const eventMap = new Map<string, PetMemoryEvent>();
  for (const ev of remoteDialogue.memoryEvents) {
    eventMap.set(ev.id, ev);
  }
  for (const ev of localDialogue.memoryEvents) {
    const existing = eventMap.get(ev.id);
    if (!existing) {
      eventMap.set(ev.id, ev);
    } else if (ev.mentionedAt && !existing.mentionedAt) {
      eventMap.set(ev.id, { ...existing, mentionedAt: ev.mentionedAt });
    }
  }
  const mergedEvents = Array.from(eventMap.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_MEMORY_EVENTS);

  const historyMap = new Map<string, DialogueLine>();
  for (const line of remoteDialogue.history) {
    historyMap.set(line.id, line);
  }
  for (const line of localDialogue.history) {
    if (!historyMap.has(line.id)) {
      historyMap.set(line.id, line);
    }
  }
  const mergedHistory = Array.from(historyMap.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_DIALOGUE_HISTORY);

  // Co-op protection: keep co-op bubble if present on either side
  const nextBubble = localDialogue.activeBubble?.isCoopHighlight
    ? localDialogue.activeBubble
    : remoteDialogue.activeBubble ?? localDialogue.activeBubble;

  return {
    ...remoteDialogue,
    // Keep each player's personal notification preferences intact
    settings: localDialogue.settings,
    activeBubble: localDialogue.settings.muteAllProactive ? null : nextBubble,
    memoryEvents: mergedEvents,
    history: mergedHistory,
  };
}
