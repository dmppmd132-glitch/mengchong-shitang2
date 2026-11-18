import { FoodCategory, FeedingReactionRule } from '../types';

export const FEED_REACTION_BY_FOOD_ID: Record<string, FeedingReactionRule> = {
  cheese_burger: {
    speeches: [
      '大口咬下雙層起司漢堡！好滿足呀～',
      '肉汁加上融化起司，漢堡控瞬間幸福滿點！',
    ],
    feedbackText: '漢堡超滿足！',
    feedbackEmoji: '🍔',
    expression: 'happyTongue',
    particleEmojis: ['🍔', '💛', '🩷'],
  },
  crispy_fries: {
    speeches: [
      '卡滋卡滋！金黃現炸薯條一根接一根停不下來！',
      '熱呼呼又脆脆的薯條太涮嘴啦！',
    ],
    feedbackText: '薯條脆滋滋！',
    feedbackEmoji: '🍟',
    expression: 'wink',
    particleEmojis: ['🍟', '✨', '🩷'],
  },
  pepperoni_pizza: {
    speeches: [
      '起司牽絲拉得好長～披薩派對開動！',
      '熱騰騰窯烤披薩配滿滿起司，太幸福了！',
    ],
    feedbackText: '披薩牽絲啦！',
    feedbackEmoji: '🍕',
    expression: 'sparkle',
    particleEmojis: ['🍕', '🧀', '💖'],
  },
};

export const FEED_REACTION_BY_CATEGORY: Record<FoodCategory, FeedingReactionRule> = {
  meal: {
    speeches: [
      '熱呼呼的正餐吃起來好安心，元氣滿滿！',
      '營養均衡又香噴噴，吃完感覺更有力氣了！',
    ],
    feedbackText: '營養滿分！',
    feedbackEmoji: '🥣',
    expression: 'happyTongue',
    particleEmojis: ['🩷', '✨', '🍽️'],
  },
  snack: {
    speeches: [
      '甜滋滋的小點心時間，心情像灑滿糖霜一樣快樂！',
      '一口接一口，幸福點心把煩惱都融化囉～',
    ],
    feedbackText: '點心好幸福！',
    feedbackEmoji: '🍮',
    expression: 'wink',
    particleEmojis: ['💖', '🍬', '🩷'],
  },
  fastFood: {
    speeches: [
      '香噴噴速食大餐！快樂指數瞬間飙升！',
      '偶爾來份罪惡美食真的太療癒啦～',
    ],
    feedbackText: '快樂大餐！',
    feedbackEmoji: '🎉',
    expression: 'happyTongue',
    particleEmojis: ['💛', '✨', '🩷'],
  },
};

export const FAVORITE_FEED_RULE: Omit<FeedingReactionRule, 'speeches'> = {
  feedbackText: '最愛料理＋親密度！',
  feedbackEmoji: '🌟',
  expression: 'sparkle',
  particleEmojis: ['⭐', '💖', '🩷'],
};

export const STUFFED_FEED_RULE: FeedingReactionRule = {
  speeches: [
    '唔… 有點撐了… 連續吃速食好幾次了，要不要帶我去散步消化一下呢？',
    '肚肚圓滾滾好撐呀… 帶我出去散步吹吹風好不好？',
  ],
  feedbackText: '有點撐了…建議散步',
  feedbackEmoji: '💦',
  expression: 'shy',
  particleEmojis: ['💦', '🌿'],
};
