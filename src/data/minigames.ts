import { PetSpecies } from '../types';
import {
  MinigameBadge,
  MinigameConfig,
  MinigameDifficultyProfile,
  MinigameDifficultyTier,
  MinigameId,
  MinigameTutorialStep,
  MinigameWeeklyChallenge,
} from '../types/minigame';

export const MAX_FREE_PLAYS_PER_DAY = 3;
export const REPLAY_COST_COINS = 30;
export const DAILY_ROTATION_COUNT = 3;

export const MINIGAME_IDS: MinigameId[] = [
  'apple',
  'fries',
  'mudBath',
  'foodMemory',
  'petRhythm',
];

export const MINIGAMES: MinigameConfig[] = [
  {
    id: 'apple',
    name: '蘋果接接樂',
    emoji: '🍎',
    category: 'catch',
    description: '蘋果會隨果園微風左右飄移！觀察上方風向提示，預判落點接住蘋果並避開蟲蟲。',
    goalText: '25 秒內接住紅/青蘋果累積連擊，避開蟲蟲蘋果！',
    controlsHint: '單指左右拖曳畫面或按左右鍵預判走位',
    durationSeconds: 25,
    rewardRuleSummary: '金幣 8～60 · 心情 +5 · 成長 +4',
    unlockCondition: 'Lv.1 起開放 · 納入每日輪替池',
    minLevel: 1,
    maxFreePlaysPerDay: MAX_FREE_PLAYS_PER_DAY,
    replayCostCoins: REPLAY_COST_COINS,
    accentBg: 'bg-[#FFF0F4]',
    accentBorder: 'border-[#F4C4D3]',
    accentText: 'text-[#C83B67]',
  },
  {
    id: 'fries',
    name: '薯條接接樂',
    emoji: '🍟',
    category: 'catch',
    description: '黃金薯條會成串高速掉落！善用「短暫加速」搶接整串薯條並閃避紅辣椒。',
    goalText: '25 秒內搶接成串薯條與漢堡累積連擊，閃開紅辣椒！',
    controlsHint: '單指拖曳或方向鍵移動 ＋ 按「⚡ 短暫加速」衝刺',
    durationSeconds: 25,
    rewardRuleSummary: '金幣 8～60 · 心情 +5 · 成長 +4',
    unlockCondition: 'Lv.1 起開放 · 納入每日輪替池',
    minLevel: 1,
    maxFreePlaysPerDay: MAX_FREE_PLAYS_PER_DAY,
    replayCostCoins: REPLAY_COST_COINS,
    accentBg: 'bg-[#FFF5DD]',
    accentBorder: 'border-[#F2D392]',
    accentText: 'text-[#9D5B12]',
  },
  {
    id: 'mudBath',
    name: '泥巴澡大作戰',
    emoji: '🫧',
    category: 'care',
    description: '依序滑動擦掉泥巴與落葉、按住水龍頭沖掉泡泡，最後拖曳毛巾擦乾！小心辣椒與肥皂泡泡。',
    goalText: '30 秒內完成擦泥、沖水、擦乾 3 步驟，越乾淨得分越高！',
    controlsHint: '1.滑動擦泥 → 2.按住沖水 → 3.拖曳毛巾擦乾',
    durationSeconds: 30,
    rewardRuleSummary: '清潔 +20～35 · 心情 +5～10 · 金幣 10～65',
    unlockCondition: 'Lv.1 起開放 · 納入每日輪替池',
    minLevel: 1,
    maxFreePlaysPerDay: MAX_FREE_PLAYS_PER_DAY,
    replayCostCoins: REPLAY_COST_COINS,
    accentBg: 'bg-[#E9F9F3]',
    accentBorder: 'border-[#AEE3D0]',
    accentText: 'text-[#1F6B54]',
  },
  {
    id: 'foodMemory',
    name: '藏食大偵探',
    emoji: '🔍',
    category: 'puzzle',
    description: '翻開記憶卡牌配對 6 種點心！連對有 Combo，翻到寵物最愛食物雙倍加分，翻到辣椒會辣到吐舌扣分！',
    goalText: '50 秒內配對全部 6 組食物，善用連擊與最愛雙倍得分！',
    controlsHint: '單手點選卡牌翻面，連續配對拿雙倍加成',
    durationSeconds: 50,
    rewardRuleSummary: '金幣 12～75 + 稀有食材 · 心情 +6～12 · 成長 +5～10',
    unlockCondition: 'Lv.1 起開放 · 納入每日輪替池',
    minLevel: 1,
    maxFreePlaysPerDay: MAX_FREE_PLAYS_PER_DAY,
    replayCostCoins: REPLAY_COST_COINS,
    accentBg: 'bg-[#FFF2E6]',
    accentBorder: 'border-[#F3C8A4]',
    accentText: 'text-[#A24B18]',
  },
  {
    id: 'petRhythm',
    name: '豬豬節奏跳跳',
    emoji: '🎵',
    category: 'rhythm',
    description: '跟著輕快節拍在音符與愛心進入判定圈時點擊螢幕，累積 Perfect 連擊一起熱舞！',
    goalText: '40 秒內抓準圖示進入圓圈時點擊，累積 Perfect 高連擊！',
    controlsHint: '單手點擊下方紫色節拍區或軌道圖示',
    durationSeconds: 40,
    rewardRuleSummary: '心情 +10～20 · 親密度 +2～5 · 金幣 12～70',
    unlockCondition: 'Lv.1 起開放 · 納入每日輪替池',
    minLevel: 1,
    maxFreePlaysPerDay: MAX_FREE_PLAYS_PER_DAY,
    replayCostCoins: REPLAY_COST_COINS,
    accentBg: 'bg-[#F3EFFF]',
    accentBorder: 'border-[#D2C6F5]',
    accentText: 'text-[#5A3EA6]',
  },
];

export const MINIGAME_BY_ID: Record<MinigameId, MinigameConfig> = {
  apple: MINIGAMES[0],
  fries: MINIGAMES[1],
  mudBath: MINIGAMES[2],
  foodMemory: MINIGAMES[3],
  petRhythm: MINIGAMES[4],
};

export interface MemoryFoodItem {
  pairId: string;
  foodId: string;
  name: string;
  emoji: string;
  basePoints: number;
}

export const MEMORY_FOOD_POOL: MemoryFoodItem[] = [
  { pairId: 'burger', foodId: 'cheese_burger', name: '漢堡', emoji: '🍔', basePoints: 6 },
  { pairId: 'fries', foodId: 'crispy_fries', name: '薯條', emoji: '🍟', basePoints: 6 },
  { pairId: 'pudding', foodId: 'caramel_pudding', name: '布丁', emoji: '🍮', basePoints: 6 },
  { pairId: 'carrot', foodId: 'carrot_salad', name: '紅蘿蔔', emoji: '🥕', basePoints: 6 },
  { pairId: 'apple', foodId: 'dried_fruit', name: '蘋果', emoji: '🍎', basePoints: 6 },
  { pairId: 'cookie', foodId: 'butter_cookie', name: '餅乾', emoji: '🍪', basePoints: 6 },
];

export const SPECIES_BATH_REACTIONS: Record<
  PetSpecies,
  { actionLabel: string; speech: string; animClass: string }
> = {
  pig: {
    actionLabel: '小豬開心打滾中',
    speech: '呼嚕呼嚕～邊洗泥巴邊打滾超舒爽！',
    animClass: 'animate-pet-roll',
  },
  rabbit: {
    actionLabel: '小兔抖抖長耳朵',
    speech: '啾啾～把耳朵上的泡泡都抖乾淨囉！',
    animClass: 'animate-pet-earshake',
  },
  dog: {
    actionLabel: '小狗呼嚕呼嚕甩水',
    speech: '汪汪！水珠全甩飛，毛毛澎鬆好舒服！',
    animClass: 'animate-pet-watershake',
  },
};

export const SPECIES_RHYTHM_REACTIONS: Record<
  PetSpecies,
  { danceLabel: string; speech: string; animClass: string }
> = {
  pig: {
    danceLabel: '小豬扭扭搖屁股',
    speech: '呼嚕呼嚕～跟著節拍搖屁股超開心！',
    animClass: 'animate-pet-wiggle',
  },
  rabbit: {
    danceLabel: '小兔節奏彈跳中',
    speech: '啾啾跳！踏到拍子上就飛得更高囉！',
    animClass: 'animate-pet-hop',
  },
  dog: {
    danceLabel: '小狗全力搖尾巴',
    speech: '汪汪！尾巴跟音樂一樣完美對拍！',
    animClass: 'animate-pet-tailwag',
  },
};

export const MINIGAME_WEEKLY_CHALLENGES: MinigameWeeklyChallenge[] = [
  {
    id: 'play_three_games',
    title: '全能小玩家',
    description: '本週遊玩 3 種不同的小遊戲',
    target: 3,
    rewardCoins: 60,
    rewardGrowth: 10,
  },
  {
    id: 'total_score_150',
    title: '積分破百大師',
    description: '本週小遊戲累積總分達 150 分',
    target: 150,
    rewardCoins: 80,
    rewardGrowth: 15,
  },
  {
    id: 'earn_three_rewards',
    title: '天天愛玩賞',
    description: '本週獲得 3 次小遊戲結算獎勵',
    target: 3,
    rewardCoins: 70,
    rewardGrowth: 12,
  },
];

export const MINIGAME_BADGES: MinigameBadge[] = [
  {
    id: 'first_play',
    name: '初試身手',
    emoji: '🎮',
    description: '完成任意 1 場小遊戲結算',
  },
  {
    id: 'catch_master',
    name: '接接樂神手',
    emoji: '🧺',
    description: '蘋果或薯條接接樂單局達 22 分以上',
  },
  {
    id: 'mud_cleaner',
    name: '泡泡清潔王',
    emoji: '🫧',
    description: '泥巴澡大作戰單局達 16 分以上並成功擦乾',
  },
  {
    id: 'memory_detective',
    name: '藏食大偵探',
    emoji: '🔍',
    description: '藏食大偵探單局達 36 分以上或完成全部 6 對配對',
  },
  {
    id: 'rhythm_star',
    name: '節奏大明星',
    emoji: '🌟',
    description: '豬豬節奏跳跳達成 8 連擊或單局 140 分以上',
  },
  {
    id: 'weekly_champion',
    name: '每週全破王',
    emoji: '🏆',
    description: '完成並領取全部 3 項每週挑戰獎勵',
  },
];

export const MINIGAME_DIFFICULTY_PROFILES: Record<
  MinigameDifficultyTier,
  MinigameDifficultyProfile
> = {
  relaxed: {
    tier: 'relaxed',
    label: 'Lv.1～2 輕鬆體驗',
    hint: '速度較柔和、判定更寬鬆，輕鬆熟悉玩法！',
    speedMultiplier: 0.85,
    spawnMultiplier: 1.15,
    hazardMultiplier: 0.7,
    windowMultiplier: 1.16,
    memoryPeekMs: 1400,
  },
  standard: {
    tier: 'standard',
    label: 'Lv.3 進階節奏',
    hint: '物件速度與節奏提升，挑戰更高的連續 Combo！',
    speedMultiplier: 1.0,
    spawnMultiplier: 1.0,
    hazardMultiplier: 1.0,
    windowMultiplier: 1.0,
    memoryPeekMs: 700,
  },
  pro: {
    tier: 'pro',
    label: 'Lv.4+ 達人挑戰',
    hint: '高速節奏與密集物件登場，全力衝刺最高分紀錄！',
    speedMultiplier: 1.12,
    spawnMultiplier: 0.9,
    hazardMultiplier: 1.12,
    windowMultiplier: 0.94,
    memoryPeekMs: 0,
  },
};

export const MINIGAME_TUTORIALS: Record<MinigameId, MinigameTutorialStep[]> = {
  apple: [
    {
      emoji: '🌬️',
      title: '1. 注意上方風向',
      instruction: '果園微風會把蘋果吹偏，先看上方箭頭預判落點喔！',
    },
    {
      emoji: '🍏',
      title: '2. 接蘋果賺連擊',
      instruction: '紅蘋果 +2 分、青蘋果 +5 分，連續接住還會累積 Combo！',
    },
    {
      emoji: '🪱',
      title: '3. 閃避蟲蟲蘋果',
      instruction: '左右滑動畫面或按方向鍵移動籃子，避開蟲蟲蘋果就過關！',
    },
  ],
  fries: [
    {
      emoji: '🍟',
      title: '1. 接住成串薯條',
      instruction: '熱騰騰的薯條會一次掉一整串，接住大漢堡還能拿 +5 分！',
    },
    {
      emoji: '⚡',
      title: '2. 按「短暫加速」衝刺',
      instruction: '來不及趕過去嗎？點擊中間「短暫加速」即可瞬間高速衝刺！',
    },
    {
      emoji: '🌶️',
      title: '3. 小心紅辣椒混入',
      instruction: '辣椒會跟在薯條旁邊落下，閃開辣椒才能守住連擊喔！',
    },
  ],
  mudBath: [
    {
      emoji: '🟫',
      title: '1. 滑動擦掉泥巴與落葉',
      instruction: '先用手指在寵物身上來回滑動，避開紅圈內的🌶️與🧼。',
    },
    {
      emoji: '🚿',
      title: '2. 按住水龍頭沖泡泡',
      instruction: '擦完泥巴後，長按藍色水龍頭按鈕把泡泡全部沖乾淨！',
    },
    {
      emoji: '🧻',
      title: '3. 拖曳毛巾擦乾得高分',
      instruction: '最後左右拖曳下方毛巾擦乾毛毛，即可完成一輪並獲得 +5 分！',
    },
  ],
  foodMemory: [
    {
      emoji: '🃏',
      title: '1. 記住翻出的食物',
      instruction: '在 4×4 卡盤中找出 6 對點心，連對會累積 Combo 加分！',
    },
    {
      emoji: '💖',
      title: '2. 最愛食物拿雙倍分',
      instruction: '標記「♥ 2x」的是寵物最愛點心，配對成功分數直接翻倍！',
    },
    {
      emoji: '🌶️',
      title: '3. 避開超辣紅辣椒',
      instruction: '翻到辣椒會讓寵物辣到吐舌頭並扣分，記得記住辣椒位置！',
    },
  ],
  petRhythm: [
    {
      emoji: '🎯',
      title: '1. 看準左側圓圈',
      instruction: '音符、愛心與點心會從右向左飄來，進入左側圓圈就是最佳時機。',
    },
    {
      emoji: '🎵',
      title: '2. 單手點擊下方節拍區',
      instruction: '點擊紫色節拍按鈕抓出 Perfect，連續 Perfect 會累積高分 Combo！',
    },
    {
      emoji: '💃',
      title: '3. 陪萌寵一起熱舞',
      instruction: '小豬搖屁股、小兔跳躍、小狗搖尾巴，越高分心情與親密度加越多！',
    },
  ],
};
