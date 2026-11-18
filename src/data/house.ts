import {
  FarmDecoration,
  FarmDecorationId,
  FarmUpgrade,
  FlooringId,
  FurnitureCategory,
  RoomItem,
  RoomPhotoPoseId,
  RoomZone,
  SharedGoal,
  SharedGoalId,
  SharedMilestoneId,
  ThemeSetId,
  TitleId,
  WallpaperId,
} from '../types';
import { TOYS, toyToRoomItem } from './toys';

export const ROOM_GRID_COLS = 6;
export const ROOM_GRID_ROWS = 4;

export interface RoomZoneDefinition {
  id: RoomZone;
  name: string;
  emoji: string;
  badgeClass: string;
  cellTintClass: string;
  description: string;
}

export const ROOM_ZONES: Record<RoomZone, RoomZoneDefinition> = {
  sleep: {
    id: 'sleep',
    name: '睡眠區',
    emoji: '🌙',
    badgeClass: 'bg-[#EDE7FA] text-[#5C459E] border-[#CFC3F2]',
    cellTintClass: 'bg-[#F5F1FC]/65',
    description: '放置睡床、枕頭與毯子，讓寶貝安心午睡。',
  },
  decor: {
    id: 'decor',
    name: '裝飾區',
    emoji: '🎀',
    badgeClass: 'bg-[#FFEAF2] text-[#B83B64] border-[#F6C4D5]',
    cellTintClass: 'bg-[#FFF3F7]/65',
    description: '擺放盆栽、窗簾、掛畫、燈串與可愛小招牌。',
  },
  play: {
    id: 'play',
    name: '遊玩區',
    emoji: '⚽',
    badgeClass: 'bg-[#E6F8F0] text-[#1F6B54] border-[#B2E3CF]',
    cellTintClass: 'bg-[#EFFBF6]/65',
    description: '鋪上軟地毯、放玩具球，讓萌寵盡情翻滾玩耍。',
  },
  dining: {
    id: 'dining',
    name: '用餐區',
    emoji: '🍽️',
    badgeClass: 'bg-[#FFF3DA] text-[#9D5B12] border-[#F2D59B]',
    cellTintClass: 'bg-[#FFF9EB]/65',
    description: '佈置餐桌、餐墊與點心架，打造專屬美食小角落。',
  },
};

export function getZoneForCell(x: number, y: number): RoomZone {
  const isRight = x >= 3;
  const isBottom = y >= 2;
  if (!isBottom && !isRight) return 'sleep';
  if (!isBottom && isRight) return 'decor';
  if (isBottom && !isRight) return 'play';
  return 'dining';
}

export const FURNITURE_CATEGORY_LABELS: Record<FurnitureCategory, string> = {
  bed: '床',
  pillow: '枕頭',
  blanket: '毯子',
  rug: '地毯',
  toyBall: '玩具球',
  toy: '玩具',
  diningTable: '餐桌',
  placemat: '餐墊',
  snackRack: '點心架',
  plant: '盆栽',
  curtain: '窗簾',
  painting: '掛畫',
  stringLights: '燈串',
  sign: '小招牌',
};

export const ROOM_ITEMS: RoomItem[] = [
  // 床 (bed)
  {
    id: 'wood_cozy_bed',
    name: '原木小睡床',
    category: 'bed',
    zone: 'sleep',
    tier: 'normal',
    price: 75,
    sellPrice: 38,
    themeId: null,
    emoji: '🛏️',
    description: '溫潤橡木框搭配鬆軟棉墊，百搭好睡的經典小床。',
    petReactionText: '鑽進原木小睡床翻了個身，軟綿綿的好好睡～',
    petAction: 'sleeping',
  },
  {
    id: 'strawberry_lace_bed',
    name: '草莓蕾絲床',
    category: 'bed',
    zone: 'sleep',
    tier: 'advanced',
    price: 165,
    sellPrice: 82,
    themeId: 'strawberry_sweet',
    emoji: '🍓',
    description: '草莓粉滾邊搭荷葉裙擺，甜蜜夢鄉必備！',
    petReactionText: '在草莓蕾絲床上呼呼大睡，夢裡全都是草莓果醬！',
    petAction: 'sleeping',
  },
  {
    id: 'cloud_big_bed',
    name: '雲朵大床',
    category: 'bed',
    zone: 'sleep',
    tier: 'advanced',
    price: 180,
    sellPrice: 90,
    themeId: 'cloud_nap',
    emoji: '☁️',
    description: '蓬鬆雲朵造型豪華大床，睡上去彷彿飄在半空中。',
    petReactionText: '噗通跳進雲朵大床裡！軟到像被棉花糖包圍～',
    petAction: 'sleeping',
  },
  // 枕頭 (pillow)
  {
    id: 'fluffy_cotton_pillow',
    name: '澎澎棉枕頭',
    category: 'pillow',
    zone: 'sleep',
    tier: 'normal',
    price: 45,
    sellPrice: 22,
    themeId: null,
    emoji: '🛋️',
    description: '飽滿回彈的小抱枕，午休靠著剛剛好。',
    petReactionText: '把臉埋進澎澎棉枕頭裡蹭了又蹭，超療癒！',
    petAction: 'petted',
  },
  {
    id: 'pumpkin_plush_pillow',
    name: '南瓜澎澎枕',
    category: 'pillow',
    zone: 'sleep',
    tier: 'normal',
    price: 65,
    sellPrice: 32,
    themeId: null,
    emoji: '🎃',
    description: '用收成小南瓜染製的圓滾滾絨毛抱枕。',
    petReactionText: '抱著南瓜澎澎枕打盹，暖呼呼的真舒服！',
    petAction: 'sleeping',
    craftIngredients: { pumpkin: 2, corn: 1 },
  },
  {
    id: 'cloud_puff_pillow',
    name: '雲朵舒眠枕',
    category: 'pillow',
    zone: 'sleep',
    tier: 'advanced',
    price: 110,
    sellPrice: 55,
    themeId: 'cloud_nap',
    emoji: '💭',
    description: '天絲觸感雲朵造型枕頭，帶點淡淡奶香。',
    petReactionText: '枕著雲朵舒眠枕閉上眼睛，呼吸都變輕柔了～',
    petAction: 'sleeping',
  },
  // 毯子 (blanket)
  {
    id: 'mint_breeze_blanket',
    name: '薄荷清香毯',
    category: 'blanket',
    zone: 'sleep',
    tier: 'normal',
    price: 55,
    sellPrice: 28,
    themeId: null,
    emoji: '🧶',
    description: '淡雅薄荷綠編織毛毯，透氣又柔暖。',
    petReactionText: '蓋上薄荷清香毯，身上都是清新的草原香味！',
    petAction: 'sleeping',
    craftIngredients: { mint: 2 },
  },
  {
    id: 'forest_plaid_blanket',
    name: '露營格紋毯',
    category: 'blanket',
    zone: 'sleep',
    tier: 'advanced',
    price: 120,
    sellPrice: 60,
    themeId: 'forest_camp',
    emoji: '⛺',
    description: '溫暖厚實的森林系大地色毛毯，露營過夜最安心。',
    petReactionText: '裹著露營格紋毯像一顆可愛小春捲～',
    petAction: 'sleeping',
  },
  // 地毯 (rug)
  {
    id: 'cream_round_rug',
    name: '奶油圓地毯',
    category: 'rug',
    zone: 'play',
    tier: 'normal',
    price: 60,
    sellPrice: 30,
    themeId: null,
    emoji: '⭕',
    description: '毛茸茸奶油米色圓地毯，踩上去暖呼呼。',
    petReactionText: '在奶油圓地毯上開心打滾翻肚肚！',
    petAction: 'petted',
  },
  {
    id: 'strawberry_bow_rug',
    name: '草莓蝴蝶結地毯',
    category: 'rug',
    zone: 'play',
    tier: 'advanced',
    price: 135,
    sellPrice: 68,
    themeId: 'strawberry_sweet',
    emoji: '🎀',
    description: '粉嫩莓果色造型地毯，角落還繡了立體小蝴蝶結。',
    petReactionText: '踩在草莓蝴蝶結地毯上轉圈圈跳舞～',
    petAction: 'walking',
  },
  {
    id: 'forest_woven_rug',
    name: '森林編織草墊',
    category: 'rug',
    zone: 'play',
    tier: 'advanced',
    price: 125,
    sellPrice: 62,
    themeId: 'forest_camp',
    emoji: '🌿',
    description: '天然藤草手工編織圓墊，帶出濃濃森系野餐風。',
    petReactionText: '聞著草編地墊的青草香，開心地搖起尾巴！',
    petAction: 'walking',
  },
  // 玩具球 (toyBall)
  {
    id: 'rainbow_bounce_ball',
    name: '彩虹彈力球',
    category: 'toyBall',
    zone: 'play',
    tier: 'normal',
    price: 45,
    sellPrice: 22,
    themeId: null,
    emoji: '⚽',
    description: '輕輕一碰就會彈來彈去的彩色軟膠球，安全又耐玩！',
    petReactionText: '用鼻子頂著彩虹彈力球跑來跑去，精力充沛！',
    petAction: 'walking',
  },
  {
    id: 'cloud_star_ball',
    name: '星雲鈴鐺球',
    category: 'toyBall',
    zone: 'play',
    tier: 'advanced',
    price: 105,
    sellPrice: 52,
    themeId: 'cloud_nap',
    emoji: '🔮',
    description: '滾動時會發出清脆叮噹聲的夢幻星星絨球。',
    petReactionText: '追著會響的星雲鈴鐺球撲跳，眼睛閃閃發亮！',
    petAction: 'petted',
  },
  // 餐桌 (diningTable)
  {
    id: 'oak_snack_table',
    name: '原木點心桌',
    category: 'diningTable',
    zone: 'dining',
    tier: 'normal',
    price: 80,
    sellPrice: 40,
    themeId: null,
    emoji: '🪑',
    description: '小巧圓潤的原木矮桌，最適合擺上熱騰騰食堂料理。',
    petReactionText: '乖乖坐在原木點心桌前搖尾巴等開飯！',
    petAction: 'opening',
  },
  {
    id: 'camp_picnic_table',
    name: '營火野餐桌',
    category: 'diningTable',
    zone: 'dining',
    tier: 'advanced',
    price: 145,
    sellPrice: 72,
    themeId: 'forest_camp',
    emoji: '🪵',
    description: '松木折疊野餐桌，戶外與室內都能享受野炊氛圍。',
    petReactionText: '在營火野餐桌旁嗅嗅香味，口水都要流下來了！',
    petAction: 'opening',
  },
  // 餐墊 (placemat)
  {
    id: 'gingham_placemat',
    name: '格子小餐墊',
    category: 'placemat',
    zone: 'dining',
    tier: 'normal',
    price: 40,
    sellPrice: 20,
    themeId: null,
    emoji: '🧺',
    description: '暖橘格紋棉麻餐墊，讓每頓飯都充滿儀式感。',
    petReactionText: '把小碗推到格子餐墊正中央，準備大快朵頤！',
    petAction: 'eating',
  },
  {
    id: 'strawberry_heart_mat',
    name: '草莓愛心餐墊',
    category: 'placemat',
    zone: 'dining',
    tier: 'advanced',
    price: 95,
    sellPrice: 48,
    themeId: 'strawberry_sweet',
    emoji: '🍰',
    description: '草莓奶油造型矽膠餐墊，耐髒好洗又甜美！',
    petReactionText: '看到草莓愛心餐墊就胃口大開，感覺飯變更好吃了！',
    petAction: 'eating',
  },
  // 點心架 (snackRack)
  {
    id: 'bakery_snack_rack',
    name: '雙層點心架',
    category: 'snackRack',
    zone: 'dining',
    tier: 'advanced',
    price: 150,
    sellPrice: 75,
    themeId: 'strawberry_sweet',
    emoji: '🧁',
    description: '下午茶專用雙層點心架，隨時擺滿布丁、餅乾與水果！',
    petReactionText: '盯著雙層點心架上的小蛋糕猛吞口水，超幸福！',
    petAction: 'opening',
  },
  {
    id: 'cloud_dessert_tower',
    name: '雲朵甜點塔',
    category: 'snackRack',
    zone: 'dining',
    tier: 'advanced',
    price: 160,
    sellPrice: 80,
    themeId: 'cloud_nap',
    emoji: '🍮',
    description: '月牙底座與棉雲托盤組成的夢幻點心陳列架。',
    petReactionText: '圍著雲朵甜點塔轉圈圈，想先吃最上面那顆布丁！',
    petAction: 'eating',
  },
  // 盆栽 (plant)
  {
    id: 'monstera_pot',
    name: '龜背芋小盆栽',
    category: 'plant',
    zone: 'decor',
    tier: 'normal',
    price: 50,
    sellPrice: 25,
    themeId: null,
    emoji: '🪴',
    description: '綠意盎然的陶瓷盆栽，為房間帶來滿滿清新氧氣。',
    petReactionText: '好奇地聞了聞綠葉，覺得空氣好清新！',
    petAction: 'idle',
  },
  {
    id: 'sunflower_vase',
    name: '向日葵陽光盆栽',
    category: 'plant',
    zone: 'decor',
    tier: 'normal',
    price: 70,
    sellPrice: 35,
    themeId: null,
    emoji: '🌻',
    description: '農場現摘向日葵插成的明亮花盆，心情瞬間晴朗！',
    petReactionText: '對著燦爛的向日葵笑了起來，整間房都亮了！',
    petAction: 'petted',
    craftIngredients: { sunflower: 2 },
  },
  {
    id: 'blueberry_scent_pot',
    name: '藍莓香氛盆栽',
    category: 'plant',
    zone: 'decor',
    tier: 'advanced',
    price: 105,
    sellPrice: 52,
    themeId: null,
    emoji: '🫐',
    description: '結滿可愛小藍莓的療癒香氛植栽，微甜果香撲鼻。',
    petReactionText: '湊近聞藍莓盆栽，還以為是可以吃的藍莓呢～',
    petAction: 'opening',
    craftIngredients: { blueberry: 2, mint: 1 },
  },
  // 窗簾 (curtain)
  {
    id: 'linen_flower_curtain',
    name: '亞麻碎花窗簾',
    category: 'curtain',
    zone: 'decor',
    tier: 'normal',
    price: 68,
    sellPrice: 34,
    themeId: null,
    emoji: '🪟',
    description: '透進柔和暖陽的米白小碎花窗簾，微風吹過輕輕飄動。',
    petReactionText: '看著窗簾被微風吹得飄飄然，跟著晃了晃頭～',
    petAction: 'idle',
  },
  {
    id: 'cloud_gauze_curtain',
    name: '雲紗星月窗簾',
    category: 'curtain',
    zone: 'decor',
    tier: 'advanced',
    price: 130,
    sellPrice: 65,
    themeId: 'cloud_nap',
    emoji: '🌙',
    description: '半透明夢幻紗簾搭配小月牙綁帶，夕陽灑進來美極了！',
    petReactionText: '躲在軟軟紗簾後面玩捉迷藏，探出頭偷笑！',
    petAction: 'petted',
  },
  // 掛畫 (painting)
  {
    id: 'pet_sketch_painting',
    name: '萌寵素描掛畫',
    category: 'painting',
    zone: 'decor',
    tier: 'normal',
    price: 62,
    sellPrice: 31,
    themeId: null,
    emoji: '🖼️',
    description: '手繪水彩風格萌寵肖像畫，框起最可愛的紀念時刻。',
    petReactionText: '歪著頭看畫框裡的可愛小夥伴，認出這就是自己嗎？',
    petAction: 'idle',
  },
  {
    id: 'strawberry_cafe_art',
    name: '草莓午茶掛畫',
    category: 'painting',
    zone: 'decor',
    tier: 'advanced',
    price: 115,
    sellPrice: 58,
    themeId: 'strawberry_sweet',
    emoji: '🎨',
    description: '復古粉金畫框裱裝的草莓舒芙蕾插畫，甜而不膩。',
    petReactionText: '盯著畫裡的草莓蛋糕，看起來超級滿意！',
    petAction: 'petted',
  },
  // 燈串 (stringLights)
  {
    id: 'warm_star_lights',
    name: '暖黃星星燈串',
    category: 'stringLights',
    zone: 'decor',
    tier: 'advanced',
    price: 120,
    sellPrice: 60,
    themeId: 'cloud_nap',
    emoji: '✨',
    description: '夜晚會亮起溫暖微光的星星燈串，把房間點亮成童話小窩。',
    petReactionText: '眼睛映著點點星光，整顆心都變得暖洋洋！',
    petAction: 'idle',
  },
  {
    id: 'camp_lantern_lights',
    name: '森林露營燈串',
    category: 'stringLights',
    zone: 'decor',
    tier: 'advanced',
    price: 130,
    sellPrice: 65,
    themeId: 'forest_camp',
    emoji: '🏮',
    description: '復古小營燈串成的露營氛圍燈，滿滿探險與秘密基地感！',
    petReactionText: '在露營燈下哼起小調，今天也要開心冒險！',
    petAction: 'walking',
  },
  // 小招牌 (sign)
  {
    id: 'wooden_welcome_sign',
    name: '木頭歡迎牌',
    category: 'sign',
    zone: 'decor',
    tier: 'normal',
    price: 48,
    sellPrice: 24,
    themeId: null,
    emoji: '🪧',
    description: '寫著「Welcome Home」的小木牌，迎接兩位飼主回家。',
    petReactionText: '每天都在歡迎牌前面等你回來抱抱！',
    petAction: 'petted',
  },
  {
    id: 'camp_trail_sign',
    name: '森林路標牌',
    category: 'sign',
    zone: 'decor',
    tier: 'advanced',
    price: 92,
    sellPrice: 46,
    themeId: 'forest_camp',
    emoji: '🧭',
    description: '指向秘密露營基地的木刻小路標，裝飾滿分。',
    petReactionText: '沿著森林路標牌探險，發現好多好吃的！',
    petAction: 'walking',
  },
  ...TOYS.map(toyToRoomItem),
];

export const ROOM_ITEM_BY_ID: Record<string, RoomItem> = ROOM_ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<string, RoomItem>
);

export interface WallpaperDefinition {
  id: WallpaperId;
  name: string;
  price: number;
  themeId: ThemeSetId | null;
  emoji: string;
  description: string;
  wallBgStyle: string;
  accentDotColor: string;
}

export const WALLPAPERS: WallpaperDefinition[] = [
  {
    id: 'cream_warm',
    name: '奶油暖牆',
    price: 0,
    themeId: null,
    emoji: '🧈',
    description: '柔和温暖的奶油色粉刷牆面，百搭又耐看。',
    wallBgStyle: 'linear-gradient(180deg, #FFF7E8 0%, #FFEEDB 100%)',
    accentDotColor: '#F2C9A0',
  },
  {
    id: 'strawberry_pink',
    name: '草莓糖霜壁紙',
    price: 120,
    themeId: 'strawberry_sweet',
    emoji: '🍓',
    description: '粉嫩糖霜直條紋搭小草莓點綴，甜蜜滿分！',
    wallBgStyle:
      'repeating-linear-gradient(90deg, #FFEBF1 0px, #FFEBF1 20px, #FFE0EA 20px, #FFE0EA 40px)',
    accentDotColor: '#FF8AA8',
  },
  {
    id: 'forest_pine',
    name: '森林木屋壁紙',
    price: 120,
    themeId: 'forest_camp',
    emoji: '🌲',
    description: '清爽鼠尾草綠木屋牆面，彷彿住在陽光林間小屋。',
    wallBgStyle: 'linear-gradient(180deg, #E8F5EB 0%, #D4ECD9 100%)',
    accentDotColor: '#5CC9A7',
  },
  {
    id: 'cloud_sky',
    name: '晴空雲朵壁紙',
    price: 140,
    themeId: 'cloud_nap',
    emoji: '☁️',
    description: '粉藍晴空配蓬鬆小雲朵，看一眼就放鬆下來。',
    wallBgStyle: 'linear-gradient(180deg, #EAF3FF 0%, #F4EDFF 100%)',
    accentDotColor: '#8FB8FF',
  },
];

export const WALLPAPER_BY_ID: Record<WallpaperId, WallpaperDefinition> = WALLPAPERS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<WallpaperId, WallpaperDefinition>
);

export interface FlooringDefinition {
  id: FlooringId;
  name: string;
  price: number;
  themeId: ThemeSetId | null;
  emoji: string;
  description: string;
  floorBgStyle: string;
}

export const FLOORINGS: FlooringDefinition[] = [
  {
    id: 'oak_wood',
    name: '溫潤橡木地板',
    price: 0,
    themeId: null,
    emoji: '🪵',
    description: '經典暖色原木拼花地板，赤腳踩起來舒適自在。',
    floorBgStyle:
      'repeating-linear-gradient(0deg, #F3DFC6 0px, #F3DFC6 22px, #E9D0B0 22px, #E9D0B0 24px)',
  },
  {
    id: 'strawberry_check',
    name: '草莓格紋地磚',
    price: 110,
    themeId: 'strawberry_sweet',
    emoji: '🍰',
    description: '粉白相間甜點店棋盤格地板，拍照超級上鏡！',
    floorBgStyle:
      'repeating-conic-gradient(#FFEFF4 0% 25%, #FFDCE6 0% 50%) 0 0 / 28px 28px',
  },
  {
    id: 'forest_moss',
    name: '森林草坪木板',
    price: 110,
    themeId: 'forest_camp',
    emoji: '🍀',
    description: '柔軟草苔與原木交織的露營地面，自然清新。',
    floorBgStyle:
      'repeating-linear-gradient(90deg, #DCEFE0 0px, #DCEFE0 28px, #CEE6D3 28px, #CEE6D3 56px)',
  },
  {
    id: 'cloud_plush',
    name: '雲朵綿綿地坪',
    price: 130,
    themeId: 'cloud_nap',
    emoji: '🫧',
    description: '像踩在雲端上的柔霧鋪棉地板，溫柔保護小腳丫。',
    floorBgStyle:
      'linear-gradient(135deg, #F4F7FF 0%, #ECE8FF 50%, #F7F1FF 100%)',
  },
];

export const FLOORING_BY_ID: Record<FlooringId, FlooringDefinition> = FLOORINGS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<FlooringId, FlooringDefinition>
);

export interface ThemeSetDefinition {
  id: ThemeSetId;
  name: string;
  emoji: string;
  bundlePrice: number;
  description: string;
  wallpaperId: WallpaperId;
  flooringId: FlooringId;
  itemIds: string[];
  rewardTitleId: TitleId;
  rewardPoseId: RoomPhotoPoseId;
  accentCardClass: string;
}

export const THEME_SETS: ThemeSetDefinition[] = [
  {
    id: 'strawberry_sweet',
    name: '草莓甜心',
    emoji: '🍓',
    bundlePrice: 380,
    description: '粉嫩草莓糖霜牆面、格紋地板與全套草莓甜點家具，甜度破表！',
    wallpaperId: 'strawberry_pink',
    flooringId: 'strawberry_check',
    itemIds: [
      'strawberry_lace_bed',
      'strawberry_bow_rug',
      'strawberry_heart_mat',
      'bakery_snack_rack',
      'strawberry_cafe_art',
    ],
    rewardTitleId: 'strawberry_dreamer',
    rewardPoseId: 'berry_heart',
    accentCardClass: 'bg-gradient-to-br from-[#FFF0F5] to-[#FFE4EC] border-[#F4B6CA]',
  },
  {
    id: 'forest_camp',
    name: '森林露營',
    emoji: '⛺',
    bundlePrice: 320,
    description: '木屋牆面、草坪地板搭營火野餐桌與露營燈串，不出門也能去露營！',
    wallpaperId: 'forest_pine',
    flooringId: 'forest_moss',
    itemIds: [
      'forest_plaid_blanket',
      'forest_woven_rug',
      'camp_picnic_table',
      'camp_lantern_lights',
      'camp_trail_sign',
    ],
    rewardTitleId: 'forest_camper',
    rewardPoseId: 'camp_cheer',
    accentCardClass: 'bg-gradient-to-br from-[#EEFBF3] to-[#DFF5E8] border-[#A8DFC2]',
  },
  {
    id: 'cloud_nap',
    name: '雲朵午睡',
    emoji: '☁️',
    bundlePrice: 460,
    description: '晴空壁紙與蓬鬆雲朵大床，收集完解鎖「雲朵築夢師」稱號與飄飄睡姿勢！',
    wallpaperId: 'cloud_sky',
    flooringId: 'cloud_plush',
    itemIds: [
      'cloud_big_bed',
      'cloud_puff_pillow',
      'cloud_star_ball',
      'cloud_dessert_tower',
      'cloud_gauze_curtain',
      'warm_star_lights',
    ],
    rewardTitleId: 'cloud_napper',
    rewardPoseId: 'cloud_float',
    accentCardClass: 'bg-gradient-to-br from-[#EEF5FF] to-[#F3EDFF] border-[#C1D3F8]',
  },
];

export const FARM_PLOT_EXPANSION_COSTS: Record<number, number> = {
  5: 150,
  6: 300,
  7: 600,
  8: 1000,
};

export const FARM_UPGRADES: FarmUpgrade[] = [
  {
    id: 'sprinkler',
    name: '自動灑水器',
    emoji: '🚿',
    description: '定時灑水保濕，裝設後全農場作物成長時間縮短 30%！',
    prices: [550],
    maxLevel: 1,
    effectSummaries: ['所有作物生長速度 +30%'],
  },
  {
    id: 'greenhouse',
    name: '玻璃小溫室',
    emoji: '🏡',
    description: '恆溫日照溫室罩，再縮短 25% 成長時間且每次採收額外 +1 份！',
    prices: [1250],
    maxLevel: 1,
    effectSummaries: ['生長速度再 +25%，每次採收產量 +1'],
  },
  {
    id: 'storage',
    name: '農場小倉庫',
    emoji: '🏚️',
    description: '擴大每種食材的庫存上限，囤滿食材準備大型料理派對！',
    prices: [280, 520, 820],
    maxLevel: 3,
    effectSummaries: [
      '每種食材儲存上限提升至 30',
      '每種食材儲存上限提升至 50',
      '每種食材儲存上限提升至 80',
    ],
  },
];

export const STORAGE_CAPS_BY_LEVEL = [15, 30, 50, 80];

export const FARM_DECORATIONS: FarmDecoration[] = [
  {
    id: 'wooden_fence',
    name: '暖木圍欄',
    category: 'fence',
    price: 80,
    emoji: '🪵',
    description: '繞著小農地一圈的溫馨原木圍欄，充滿田園感。',
  },
  {
    id: 'white_picket_fence',
    name: '奶油白柵欄',
    category: 'fence',
    price: 140,
    emoji: '🤍',
    description: '夢幻鄉村風白色尖頂小柵欄，質感倍增！',
  },
  {
    id: 'daisy_flowerbed',
    name: '雛菊小花圃',
    category: 'flowerbed',
    price: 90,
    emoji: '🌼',
    description: '開滿黃白小雛菊的長條花圃，吸引小蝴蝶飛舞。',
  },
  {
    id: 'lavender_flowerbed',
    name: '薰衣草花圃',
    category: 'flowerbed',
    price: 150,
    emoji: '🪻',
    description: '紫色香草花叢圍繞農田，散發淡淡舒壓香氣。',
  },
  {
    id: 'farm_welcome_sign',
    name: '原木農場招牌',
    category: 'sign',
    price: 75,
    emoji: '🪧',
    description: '立在農田入口處的手寫小屋木牌，可自訂專屬小屋名稱！',
  },
  {
    id: 'berry_arch_sign',
    name: '草莓花拱門招牌',
    category: 'sign',
    price: 160,
    emoji: '🌸',
    description: '掛滿花朵與小燈的雙人共養歡迎拱門看板。',
  },
];

export const FARM_DECORATION_BY_ID: Record<FarmDecorationId, FarmDecoration> =
  FARM_DECORATIONS.reduce(
    (acc, item) => {
      acc[item.id] = item;
      return acc;
    },
    {} as Record<FarmDecorationId, FarmDecoration>
  );

export const SHARED_GOALS: SharedGoal[] = [
  {
    id: 'goal_cloud_bed',
    title: '一起存 1,000 金幣購買雲朵大床',
    description: '把金幣存進共同金庫達 1,000，就能直接解鎖超夢幻「雲朵大床」並額外獲得成長值！',
    targetCoins: 1000,
    rewardSummary: '解鎖雲朵大床 +50 金幣 +30 成長值',
    rewardCoinsBonus: 50,
    rewardGrowthBonus: 30,
    rewardItemId: 'cloud_big_bed',
  },
  {
    id: 'goal_sprinkler',
    title: '一起存 550 金幣添購灑水器',
    description: '存滿 550 共同金庫即可啟用「自動灑水器」，讓農場作物長超快！',
    targetCoins: 550,
    rewardSummary: '啟用自動灑水器 +30 金幣 +20 成長值',
    rewardCoinsBonus: 30,
    rewardGrowthBonus: 20,
  },
  {
    id: 'goal_farm_6',
    title: '一起存 450 金幣擴建第 6 塊農地',
    description: '合力累積 450 金庫資金，一起拓展屬於兩人的豐收小農場！',
    targetCoins: 450,
    rewardSummary: '解鎖農地擴建基金 +40 金幣 +20 成長值',
    rewardCoinsBonus: 40,
    rewardGrowthBonus: 20,
  },
  {
    id: 'goal_cozy_6_items',
    title: '一起布置滿 6 件溫暖家具',
    description: '只要共同金庫累積 300 且小屋放滿 6 件以上家具，就能一起慶祝喬遷！',
    targetCoins: 300,
    rewardSummary: '喬遷慶祝禮包 +60 金幣 +25 成長值',
    rewardCoinsBonus: 60,
    rewardGrowthBonus: 25,
  },
];

export const SHARED_GOAL_BY_ID: Record<SharedGoalId, SharedGoal> = SHARED_GOALS.reduce(
  (acc, g) => {
    acc[g.id] = g;
    return acc;
  },
  {} as Record<SharedGoalId, SharedGoal>
);

export interface SharedMilestoneDefinition {
  id: SharedMilestoneId;
  title: string;
  description: string;
  emoji: string;
  rewardCoins: number;
  rewardGrowth: number;
}

export const SHARED_MILESTONES: SharedMilestoneDefinition[] = [
  {
    id: 'first_furniture',
    title: '第一次購買家具',
    description: '買下第 1 件房間家具，正式開啟溫馨佈置生活！',
    emoji: '🛋️',
    rewardCoins: 40,
    rewardGrowth: 12,
  },
  {
    id: 'four_zones_filled',
    title: '四區都擺好家具啦',
    description: '睡眠區、遊玩區、用餐區、裝飾區都有家具擺放。',
    emoji: '🏠',
    rewardCoins: 80,
    rewardGrowth: 20,
  },
  {
    id: 'theme_room_complete',
    title: '完成主題房間',
    description: '收集齊全任意 1 套主題家具＋壁紙＋地板。',
    emoji: '✨',
    rewardCoins: 120,
    rewardGrowth: 30,
  },
  {
    id: 'farm_expanded',
    title: '農場擴建第一步',
    description: '解鎖第 5 塊以上農地，或是添購農場設施/裝飾。',
    emoji: '🌾',
    rewardCoins: 60,
    rewardGrowth: 15,
  },
  {
    id: 'shared_goal_completed',
    title: '達成兩人共同目標',
    description: '合力達成共同金庫目標，見證兩人的默契累積！',
    emoji: '💞',
    rewardCoins: 100,
    rewardGrowth: 25,
  },
  {
    id: 'first_room_photo',
    title: '拍下小屋紀念照',
    description: '使用拍照模式幫萌寵與房間拍下第一張合照。',
    emoji: '📸',
    rewardCoins: 50,
    rewardGrowth: 15,
  },
];

export interface RoomPhotoPoseDefinition {
  id: RoomPhotoPoseId;
  label: string;
  emoji: string;
  badgeText: string;
  requiresTheme: ThemeSetId | null;
  action: 'idle' | 'petted' | 'sleeping' | 'walking';
  expression: 'normal' | 'sparkle' | 'wink' | 'shy' | 'happyTongue';
  animClass: string;
  speechPreview: string;
}

export const ROOM_PHOTO_POSES: RoomPhotoPoseDefinition[] = [
  {
    id: 'normal',
    label: '乖乖坐好',
    emoji: '😊',
    badgeText: '基礎姿勢',
    requiresTheme: null,
    action: 'idle',
    expression: 'normal',
    animClass: 'animate-piggy-float',
    speechPreview: '看鏡頭～茄子！今天家裡好溫馨！',
  },
  {
    id: 'happy_jump',
    label: '開心歡呼跳',
    emoji: '🎉',
    badgeText: '基礎姿勢',
    requiresTheme: null,
    action: 'walking',
    expression: 'happyTongue',
    animClass: 'animate-pet-hop',
    speechPreview: '耶～最喜歡跟你們一起住在這個小窩！',
  },
  {
    id: 'sleepy_cozy',
    label: '軟綿打瞌睡',
    emoji: '💤',
    badgeText: '基礎姿勢',
    requiresTheme: null,
    action: 'sleeping',
    expression: 'shy',
    animClass: '',
    speechPreview: '呼…房間太舒服了，先眯一下下…',
  },
  {
    id: 'berry_heart',
    label: '草莓比心 Wink',
    emoji: '🍓',
    badgeText: '草莓甜心限定',
    requiresTheme: 'strawberry_sweet',
    action: 'petted',
    expression: 'wink',
    animClass: 'animate-pet-wiggle',
    speechPreview: '甜度滿分的愛心送給你～啾咪！',
  },
  {
    id: 'camp_cheer',
    label: '露營小探險家',
    emoji: '⛺',
    badgeText: '森林露營限定',
    requiresTheme: 'forest_camp',
    action: 'walking',
    expression: 'sparkle',
    animClass: 'animate-pet-earshake',
    speechPreview: '營火點好了！出發去森林找美味果實吧！',
  },
  {
    id: 'cloud_float',
    label: '雲朵飄飄飛',
    emoji: '☁️',
    badgeText: '雲朵午睡限定',
    requiresTheme: 'cloud_nap',
    action: 'petted',
    expression: 'sparkle',
    animClass: 'animate-piggy-jump',
    speechPreview: '像軟綿綿小雲朵一樣飄起來囉～',
  },
];
