import { GrowthStageInfo } from '../types';

export const GROWTH_STAGES: GrowthStageInfo[] = [
  {
    level: 1,
    name: '粉嫩小豬',
    minGrowth: 0,
    nextGrowth: 100,
    tagline: '剛破殼的軟萌寶寶，最喜歡吃熱呼呼的點心。',
    unlockFeature: '可使用頭部、臉部、脖子配件',
    bodyScaleX: 0.94,
    bodyScaleY: 0.94,
    unlockedSlots: ['head', 'face', 'neck'],
  },
  {
    level: 2,
    name: '圓滾小豬',
    minGrowth: 100,
    nextGrowth: 250,
    tagline: '臉頰鼓鼓、肚肚軟綿綿，解鎖「身體」穿搭欄位！',
    unlockFeature: '解鎖「身體」配件欄位 + 圓潤體型',
    bodyScaleX: 1.03,
    bodyScaleY: 1.0,
    unlockedSlots: ['head', 'face', 'neck', 'body'],
  },
  {
    level: 3,
    name: '元氣小豬',
    minGrowth: 250,
    nextGrowth: 500,
    tagline: '眼神閃閃發光，每天充滿活力在食堂跑跳！',
    unlockFeature: '解鎖閃亮元氣表情與粉紅雙頰光暈',
    bodyScaleX: 1.06,
    bodyScaleY: 1.05,
    unlockedSlots: ['head', 'face', 'neck', 'body'],
  },
  {
    level: 4,
    name: '時尚大豬',
    minGrowth: 500,
    nextGrowth: null,
    tagline: '萌寵食堂的超級明星，全身穿搭氣場滿分！',
    unlockFeature: '解鎖專屬金星光環與大豬華麗體態',
    bodyScaleX: 1.12,
    bodyScaleY: 1.09,
    unlockedSlots: ['head', 'face', 'neck', 'body'],
  },
];

export function getGrowthStage(growth: number): GrowthStageInfo {
  let current = GROWTH_STAGES[0];
  for (const stage of GROWTH_STAGES) {
    if (growth >= stage.minGrowth) {
      current = stage;
    }
  }
  return current;
}

export function getGrowthRemaining(growth: number): {
  currentStage: GrowthStageInfo;
  nextStage: GrowthStageInfo | null;
  remaining: number;
  progressPercent: number;
} {
  const currentStage = getGrowthStage(growth);
  const nextStage = GROWTH_STAGES.find((s) => s.level === currentStage.level + 1) ?? null;

  if (!nextStage || currentStage.nextGrowth === null) {
    return {
      currentStage,
      nextStage: null,
      remaining: 0,
      progressPercent: 100,
    };
  }

  const span = currentStage.nextGrowth - currentStage.minGrowth;
  const gained = growth - currentStage.minGrowth;
  const remaining = Math.max(0, currentStage.nextGrowth - growth);
  const progressPercent = Math.min(100, Math.max(0, Math.round((gained / span) * 100)));

  return {
    currentStage,
    nextStage,
    remaining,
    progressPercent,
  };
}

export interface RoundnessTier {
  label: string;
  description: string;
  badgeTone: 'mint' | 'cream' | 'pink' | 'berry';
}

export function getRoundnessTier(roundness: number): RoundnessTier {
  if (roundness < 25) {
    return {
      label: '小巧輕盈',
      description: '身手矯健，適合再多吃點美味點心！',
      badgeTone: 'mint',
    };
  }
  if (roundness < 50) {
    return {
      label: '小圓',
      description: '微微圓潤的線條，抱起來剛剛好舒服。',
      badgeTone: 'cream',
    };
  }
  if (roundness < 80) {
    return {
      label: '圓滾滾',
      description: '軟綿綿的幸福肉肉感，可愛度爆表！',
      badgeTone: 'pink',
    };
  }
  return {
    label: '超級圓',
    description: '圓嘟嘟像顆小麻糬，偶爾散步也很舒壓喔！',
    badgeTone: 'berry',
  };
}
