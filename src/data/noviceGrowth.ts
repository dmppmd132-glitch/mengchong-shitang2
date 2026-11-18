import { NoviceDayNumber, StageBackgroundId } from '../types';

export interface NoviceGoalConfig {
  id: string;
  label: string;
  target: number;
}

export interface NoviceRewardItem {
  kind: 'accessory' | 'ingredient' | 'food' | 'background';
  id: string;
  qty: number;
  label: string;
  emoji: string;
}

export interface NoviceDayConfig {
  day: NoviceDayNumber;
  title: string;
  subtitle: string;
  goals: NoviceGoalConfig[];
  matchAnyGoal?: boolean;
  rewardCoins: number;
  rewardItems: NoviceRewardItem[];
}

export const NOVICE_GROWTH_DAYS: NoviceDayConfig[] = [
  {
    day: 1,
    title: '第 1 天 · 初次見面',
    subtitle: '迎接可愛小夥伴，給牠第一頓點心與暖心摸摸！',
    goals: [
      { id: 'hatch_and_name', label: '孵化寵物並完成取名', target: 1 },
      { id: 'feed_1', label: '餵食 1 次', target: 1 },
      { id: 'pet_3', label: '摸摸 3 次', target: 3 },
    ],
    rewardCoins: 50,
    rewardItems: [
      {
        kind: 'accessory',
        id: 'pink_bow',
        qty: 1,
        label: '粉紅蝴蝶結',
        emoji: '🎀',
      },
    ],
  },
  {
    day: 2,
    title: '第 2 天 · 農園小農夫',
    subtitle: '種出新鮮食材，再去接接樂小遊戲賺第一桶金幣！',
    goals: [
      { id: 'plant_carrot', label: '種植紅蘿蔔 1 次', target: 1 },
      { id: 'minigame_1', label: '完成 1 次小遊戲', target: 1 },
    ],
    rewardCoins: 60,
    rewardItems: [
      {
        kind: 'ingredient',
        id: 'corn',
        qty: 2,
        label: '玉米種子禮包（玉米 ×2）',
        emoji: '🌽',
      },
    ],
  },
  {
    day: 3,
    title: '第 3 天 · 手作小主廚',
    subtitle: '用採收食材做一道美味料理，並記錄寶貝的體重成長！',
    goals: [
      { id: 'cook_1', label: '合成 1 道料理', target: 1 },
      { id: 'weigh_1', label: '記錄 1 次體重', target: 1 },
    ],
    rewardCoins: 70,
    rewardItems: [
      {
        kind: 'food',
        id: 'caramel_pudding',
        qty: 1,
        label: '焦糖布丁 ×1',
        emoji: '🍮',
      },
    ],
  },
  {
    day: 4,
    title: '第 4 天 · 時尚穿搭日',
    subtitle: '到更衣室挑一件喜歡的新配件，讓小夥伴變身最亮眼明星！',
    goals: [
      { id: 'buy_accessory_1', label: '購買 1 件配件', target: 1 },
      { id: 'equip_2', label: '同時穿戴 2 件配件', target: 2 },
    ],
    rewardCoins: 80,
    rewardItems: [
      {
        kind: 'accessory',
        id: 'strawberry_clip',
        qty: 1,
        label: '草莓髮夾',
        emoji: '🍓',
      },
    ],
  },
  {
    day: 5,
    title: '第 5 天 · 散步充充電',
    subtitle: '累積完成日常任務並帶小夥伴散步消化、維持健康！',
    goals: [
      { id: 'daily_tasks_3', label: '累積完成 3 個每日任務', target: 3 },
      { id: 'walk_1', label: '散步 1 次', target: 1 },
    ],
    rewardCoins: 90,
    rewardItems: [
      {
        kind: 'accessory',
        id: 'round_glasses',
        qty: 1,
        label: '圓框眼鏡',
        emoji: '👓',
      },
    ],
  },
  {
    day: 6,
    title: '第 6 天 · 成長大躍進',
    subtitle: '升上成長 Lv.2，並餵牠吃最愛料理見證幸福星星眼！',
    goals: [
      { id: 'reach_lv2', label: '寵物成長達到 Lv.2', target: 1 },
      { id: 'feed_favorite_1', label: '餵食最愛食物 1 次', target: 1 },
    ],
    rewardCoins: 100,
    rewardItems: [
      {
        kind: 'background',
        id: 'starlight_garden',
        qty: 1,
        label: '限定背景「星光野餐花園」',
        emoji: '🌌',
      },
    ],
  },
  {
    day: 7,
    title: '第 7 天 · 一週慶典',
    subtitle: '累積完成 5 個每日任務，或建立兩人共養小屋即可領取大獎！',
    goals: [
      { id: 'daily_tasks_5', label: '累積完成 5 個每日任務', target: 5 },
      { id: 'shared_room_1', label: '或建立共養小屋', target: 1 },
    ],
    matchAnyGoal: true,
    rewardCoins: 150,
    rewardItems: [
      {
        kind: 'accessory',
        id: 'anniversary_bib',
        qty: 1,
        label: '一週紀念圍兜',
        emoji: '🎂',
      },
    ],
  },
];

export interface StageBackgroundConfig {
  id: StageBackgroundId;
  name: string;
  description: string;
  stageClass: string;
  badgeText: string;
}

export const STAGE_BACKGROUNDS: Record<StageBackgroundId, StageBackgroundConfig> = {
  default: {
    id: 'default',
    name: '暖陽食堂背景',
    description: '溫馨粉黃與薄荷漸層的日常食堂舞台。',
    stageClass: 'bg-gradient-to-b from-[#FFEAF0] via-[#FFF9EA] to-[#E6F8F1]',
    badgeText: '預設舞台',
  },
  starlight_garden: {
    id: 'starlight_garden',
    name: '星光野餐花園',
    description: '新手第 6 天限定背景！柔和粉紫夜空點綴金星閃光。',
    stageClass: 'bg-gradient-to-b from-[#EDE6FF] via-[#FFF1F7] to-[#DDF5EE]',
    badgeText: '第 6 天限定',
  },
};
