import { Accessory, AccessorySlot } from '../types';

export const ACCESSORY_SLOTS: AccessorySlot[] = ['head', 'face', 'neck', 'body'];

export const ACCESSORY_SLOT_LABELS: Record<AccessorySlot, string> = {
  head: '頭部',
  face: '臉部',
  neck: '脖子',
  body: '身體',
};

export const ACCESSORIES: Accessory[] = [
  // head
  {
    id: 'pink_bow',
    name: '粉紅蝴蝶結',
    slot: 'head',
    emoji: '🎀',
    description: '甜美粉嫩的緞帶蝴蝶結，戴上瞬間可愛度加倍。',
    price: 0,
    initialUnlocked: true,
  },
  {
    id: 'strawberry_clip',
    name: '草莓髮夾',
    slot: 'head',
    emoji: '🍓',
    description: '酸甜俏皮的小草莓造型髮夾。',
    price: 0,
    initialUnlocked: true,
  },
  {
    id: 'mini_crown',
    name: '奶油小皇冠',
    slot: 'head',
    emoji: '👑',
    description: '金黃閃亮的小皇冠，食堂小壽星專屬。',
    price: 80,
    initialUnlocked: false,
  },
  {
    id: 'chef_hat',
    name: '主廚高帽',
    slot: 'head',
    emoji: '👩‍🍳',
    description: '澎澎的白色小廚師帽，立志當萌寵大廚！',
    price: 65,
    initialUnlocked: false,
  },
  {
    id: 'beret_hat',
    name: '焦糖貝雷帽',
    slot: 'head',
    emoji: '🥐',
    description: '暖焦糖色畫家貝雷帽，戴上去瞬間變氣質小網紅。',
    price: 60,
    initialUnlocked: false,
  },
  {
    id: 'sprout_clip',
    name: '幸運嫩芽夾',
    slot: 'head',
    emoji: '🌱',
    description: '頭頂長出一株青翠小嫩芽，元氣與好運一起發芽。',
    price: 40,
    initialUnlocked: false,
  },
  {
    id: 'crystal_crown',
    name: '晶鑽小皇冠',
    slot: 'head',
    emoji: '👑',
    description: '鑲嵌粉藍寶石與珍珠尖飾的閃亮小皇冠，戴上去氣場滿分。',
    price: 95,
    initialUnlocked: false,
  },
  {
    id: 'bunny_flower_crown',
    name: '森系小花冠',
    slot: 'head',
    emoji: '🌸',
    description: '粉嫩花朵與青翠小葉編織的花冠，春日野餐散步最百搭。',
    price: 55,
    initialUnlocked: false,
  },

  // face
  {
    id: 'round_glasses',
    name: '圓框眼鏡',
    slot: 'face',
    emoji: '👓',
    description: '文青感滿分的焦糖色圓框眼鏡。',
    price: 0,
    initialUnlocked: true,
  },
  {
    id: 'star_blush',
    name: '星星腮紅貼',
    slot: 'face',
    emoji: '⭐',
    description: '臉頰貼上奶油黃小星星，元氣滿滿。',
    price: 45,
    initialUnlocked: false,
  },
  {
    id: 'heart_shades',
    name: '愛心墨鏡',
    slot: 'face',
    emoji: '🕶️',
    description: '粉紅愛心造型太陽眼鏡，走在路上最吸睛。',
    price: 75,
    initialUnlocked: false,
  },
  {
    id: 'bandaid_cute',
    name: '彩虹OK繃',
    slot: 'face',
    emoji: '🩹',
    description: '貼在臉頰上的粉彩條紋 OK 繃，調皮可愛感滿分。',
    price: 35,
    initialUnlocked: false,
  },
  {
    id: 'monocle_gold',
    name: '紳士單片鏡',
    slot: 'face',
    emoji: '🧐',
    description: '復古金框單片眼鏡，食堂裡最有品味的小美食家。',
    price: 85,
    initialUnlocked: false,
  },
  {
    id: 'pilot_goggles',
    name: '冒險家護目鏡',
    slot: 'face',
    emoji: '🥽',
    description: '焦糖皮帶配湖水藍反光鏡片，準備好出發展開大冒險！',
    price: 70,
    initialUnlocked: false,
  },

  // neck
  {
    id: 'baby_bib',
    name: '圍兜',
    slot: 'neck',
    emoji: '🍼',
    description: '奶油黃波浪花邊小圍兜，吃飯不怕弄髒！',
    price: 0,
    initialUnlocked: true,
  },
  {
    id: 'mint_bell_tie',
    name: '薄荷鈴鐺領結',
    slot: 'neck',
    emoji: '🔔',
    description: '走動時會發出清脆鈴聲的薄荷綠領結。',
    price: 55,
    initialUnlocked: false,
  },
  {
    id: 'pearl_necklace',
    name: '奶油珍珠項鍊',
    slot: 'neck',
    emoji: '📿',
    description: '圓潤溫柔的小珍珠項鍊，搭配任何造型都優雅。',
    price: 75,
    initialUnlocked: false,
  },
  {
    id: 'carrot_scarf',
    name: '紅蘿蔔小領巾',
    slot: 'neck',
    emoji: '🧣',
    description: '活力滿滿的橘紅小領巾，逛農場或散步都亮眼。',
    price: 50,
    initialUnlocked: false,
  },
  {
    id: 'lucky_clover_tie',
    name: '幸運草小領結',
    slot: 'neck',
    emoji: '🍀',
    description: '四葉幸運草造型小領結，戴上後好運與金幣通通跟著來！',
    price: 60,
    initialUnlocked: false,
  },
  {
    id: 'anniversary_bib',
    name: '一週紀念圍兜',
    slot: 'neck',
    emoji: '🎂',
    description: '新手 7 天成長之路第 7 天專屬紀念圍兜，繡著金色小星章！',
    price: 0,
    initialUnlocked: false,
  },

  // body
  {
    id: 'mint_apron',
    name: '薄荷小圍裙',
    slot: 'body',
    emoji: '👕',
    description: '食堂專用薄荷綠口袋圍裙，超有職人感。',
    price: 70,
    initialUnlocked: false,
  },
  {
    id: 'strawberry_cape',
    name: '草莓點點披風',
    slot: 'body',
    emoji: '🧥',
    description: '軟綿綿的粉紅草莓小披風，保暖又時尚。',
    price: 95,
    initialUnlocked: false,
  },
  {
    id: 'sailor_collar',
    name: '水手海軍服',
    slot: 'body',
    emoji: '⚓',
    description: '清爽藍白水手領配上紅領結，散步回頭率百分百！',
    price: 90,
    initialUnlocked: false,
  },
  {
    id: 'star_pajama',
    name: '星空睡衣披肩',
    slot: 'body',
    emoji: '🌙',
    description: '薰衣草紫星空小披肩點綴金色星星，居家最療癒。',
    price: 85,
    initialUnlocked: false,
  },
  {
    id: 'hero_cape',
    name: '勇者小披風',
    slot: 'body',
    emoji: '🦸',
    description: '珊瑚紅飄逸披風搭配金色星章扣飾，守護整間萌寵食堂！',
    price: 100,
    initialUnlocked: false,
  },
];

export const INITIAL_UNLOCKED_ACCESSORIES: string[] = ACCESSORIES.filter(
  (a) => a.initialUnlocked
).map((a) => a.id);

export function getAccessoryById(id: string | null): Accessory | undefined {
  if (!id) return undefined;
  return ACCESSORIES.find((a) => a.id === id);
}
