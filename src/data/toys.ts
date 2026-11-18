import { RoomItem, Toy } from '../types';

export const TOYS: Toy[] = [
  {
    id: 'toy_rainbow_ball',
    name: '彩虹球',
    emoji: '🌈',
    category: 'toy',
    zone: 'play',
    price: 45,
    sellPrice: 22,
    description: '七彩條紋軟彈球，滾動起來超繽紛，小狗看到會興奮撲跳！',
    petReactionText: '追著彩虹球滿場飛奔，尾巴搖得像小風車！',
    petAction: 'walking',
  },
  {
    id: 'toy_mini_tent',
    name: '小帳篷',
    emoji: '⛺',
    category: 'toy',
    zone: 'play',
    price: 75,
    sellPrice: 38,
    description: '溫暖布料搭成的秘密小帳篷，小兔最愛鑽進去探險偷笑！',
    petReactionText: '鑽進秘密小帳篷探頭出來，好像自己的小城堡！',
    petAction: 'petted',
  },
  {
    id: 'toy_throw_pillow',
    name: '抱枕',
    emoji: '🛋️',
    category: 'toy',
    zone: 'play',
    price: 40,
    sellPrice: 20,
    description: '軟乎乎可揉可蹭的圓滾抱枕，小豬最喜歡抱著翻滾打盹！',
    petReactionText: '緊緊抱住軟綿綿抱枕蹭臉臉，心情瞬間治癒～',
    petAction: 'petted',
  },
  {
    id: 'toy_puzzle_cube',
    name: '益智方塊',
    emoji: '🧩',
    category: 'toy',
    zone: 'play',
    price: 60,
    sellPrice: 30,
    description: '藏著小機關與積木圖案的木製益智方塊，滿足萌寵滿滿好奇心！',
    petReactionText: '用小爪子撥弄益智方塊，研究裡面的小機關好專心！',
    petAction: 'opening',
  },
  {
    id: 'toy_mirror',
    name: '小鏡子',
    emoji: '🪞',
    category: 'toy',
    zone: 'play',
    price: 50,
    sellPrice: 25,
    description: '安全防摔的奶油框小立鏡，可以照照自己可愛的模樣。',
    petReactionText: '歪著頭盯著小鏡子裡的自己，好奇地眨眨眼！',
    petAction: 'idle',
  },
  {
    id: 'toy_frisbee',
    name: '小飛盤',
    emoji: '🥏',
    category: 'toy',
    zone: 'play',
    price: 55,
    sellPrice: 28,
    description: '輕巧柔韌的晴空藍小飛盤，丟出去接住超級熱血！',
    petReactionText: '帥氣跳起來咬住小飛盤，活力滿滿滿分！',
    petAction: 'walking',
  },
];

export const TOY_BY_ID: Record<string, Toy> = TOYS.reduce(
  (acc, toy) => {
    acc[toy.id] = toy;
    return acc;
  },
  {} as Record<string, Toy>
);

export function toyToRoomItem(toy: Toy): RoomItem {
  return {
    id: toy.id,
    name: toy.name,
    category: toy.category,
    zone: toy.zone,
    tier: 'normal',
    price: toy.price,
    sellPrice: toy.sellPrice,
    themeId: null,
    emoji: toy.emoji,
    description: toy.description,
    petReactionText: toy.petReactionText,
    petAction: toy.petAction,
  };
}
