import { CropPlot, IngredientId, IngredientInfo, KitchenRecipe } from '../types';

export const INGREDIENT_IDS: IngredientId[] = [
  'carrot',
  'corn',
  'strawberry',
  'pumpkin',
  'blueberry',
  'mint',
  'sunflower',
];

export const INGREDIENTS: Record<IngredientId, IngredientInfo> = {
  carrot: {
    id: 'carrot',
    name: '紅蘿蔔',
    emoji: '🥕',
    growSeconds: 15,
    seedCost: 4,
    harvestYield: 2,
    description: '清脆多汁的有機紅蘿蔔，小兔最愛的健康食材。',
  },
  corn: {
    id: 'corn',
    name: '玉米',
    emoji: '🌽',
    growSeconds: 20,
    seedCost: 5,
    harvestYield: 2,
    description: '金黃香甜的玉米粒，適合做成綿密布丁與濃湯。',
  },
  strawberry: {
    id: 'strawberry',
    name: '草莓',
    emoji: '🍓',
    growSeconds: 25,
    seedCost: 6,
    harvestYield: 2,
    description: '酸甜多汁的鮮採草莓，做水果盒與甜心料理必備！',
  },
  pumpkin: {
    id: 'pumpkin',
    name: '南瓜',
    emoji: '🎃',
    growSeconds: 30,
    seedCost: 8,
    harvestYield: 2,
    description: '飽滿金黃的小南瓜，可煮南瓜濃湯或手作南瓜抱枕！',
  },
  blueberry: {
    id: 'blueberry',
    name: '藍莓',
    emoji: '🫐',
    growSeconds: 28,
    seedCost: 8,
    harvestYield: 2,
    description: '富含花青素的甜美藍莓，適合烘焙甜點與製作香氛盆栽。',
  },
  mint: {
    id: 'mint',
    name: '薄荷',
    emoji: '🌿',
    growSeconds: 22,
    seedCost: 7,
    harvestYield: 2,
    description: '清新提神的香草薄荷葉，做聖代與清香坐墊都超棒。',
  },
  sunflower: {
    id: 'sunflower',
    name: '向日葵',
    emoji: '🌻',
    growSeconds: 35,
    seedCost: 10,
    harvestYield: 2,
    description: '充滿朝氣的陽光花朵，可作元氣便當與陽光花盆佈置！',
  },
};

export const KITCHEN_RECIPES: KitchenRecipe[] = [
  {
    id: 'recipe_pudding',
    outputFoodId: 'caramel_pudding',
    name: '手作焦糖布丁',
    emoji: '🍮',
    description: '用香甜玉米與紅蘿蔔慢火熬出天然甜香布丁！',
    ingredients: {
      corn: 2,
      carrot: 1,
    },
    bonusGrowth: 6,
  },
  {
    id: 'recipe_fruit_box',
    outputFoodId: 'fruit_box',
    name: '鮮果水果盒',
    emoji: '🍓',
    description: '現採草莓搭配脆甜紅蘿蔔丁，清爽又繽紛！',
    ingredients: {
      strawberry: 2,
      carrot: 1,
    },
    bonusGrowth: 8,
  },
  {
    id: 'recipe_carrot_salad',
    outputFoodId: 'carrot_salad',
    name: '鮮採紅蘿蔔沙拉',
    emoji: '🥗',
    description: '現摘紅蘿蔔加上甜玉米粒，脆口滿分。',
    ingredients: {
      carrot: 2,
      corn: 1,
    },
    bonusGrowth: 6,
  },
  {
    id: 'recipe_cookie',
    outputFoodId: 'butter_cookie',
    name: '草莓玉米脆餅',
    emoji: '🍪',
    description: '烤得金黃酥脆的草莓風味手工小餅乾。',
    ingredients: {
      corn: 2,
      strawberry: 1,
    },
    bonusGrowth: 5,
  },
  {
    id: 'recipe_pumpkin_soup',
    outputFoodId: 'pumpkin_soup',
    name: '金黃南瓜濃湯',
    emoji: '🎃',
    description: '現採南瓜與甜玉米細火慢熬，溫暖又飽足。',
    ingredients: {
      pumpkin: 2,
      corn: 1,
    },
    bonusGrowth: 9,
  },
  {
    id: 'recipe_blueberry_tart',
    outputFoodId: 'blueberry_tart',
    name: '藍莓卡士達塔',
    emoji: '🫐',
    description: '爆汁藍莓加上草莓點綴，浪漫下午茶首選。',
    ingredients: {
      blueberry: 2,
      strawberry: 1,
    },
    bonusGrowth: 10,
  },
  {
    id: 'recipe_mint_parfait',
    outputFoodId: 'mint_parfait',
    name: '薄荷鮮果聖代',
    emoji: '🍨',
    description: '沁涼薄荷搭配鮮甜藍莓，一口就微笑！',
    ingredients: {
      mint: 2,
      blueberry: 1,
    },
    bonusGrowth: 10,
  },
  {
    id: 'recipe_sunflower_bento',
    outputFoodId: 'sunflower_bento',
    name: '向日葵元氣餐盒',
    emoji: '🌻',
    description: '酥脆葵花籽與南瓜紅蘿蔔雙拼，滿滿陽光活力！',
    ingredients: {
      sunflower: 1,
      pumpkin: 1,
      carrot: 1,
    },
    bonusGrowth: 12,
  },
];

export function createInitialIngredients(): Record<IngredientId, number> {
  return {
    carrot: 2,
    corn: 2,
    strawberry: 2,
    pumpkin: 1,
    blueberry: 1,
    mint: 1,
    sunflower: 1,
  };
}

export function createInitialFarmPlots(plotCount = 4): CropPlot[] {
  const safeCount = Math.min(8, Math.max(4, plotCount));
  return Array.from({ length: safeCount }, (_, id) => ({
    id,
    cropId: null,
    plantedAt: null,
    durationMs: 0,
  }));
}

export function getIngredientInfo(id: IngredientId): IngredientInfo {
  return INGREDIENTS[id];
}
