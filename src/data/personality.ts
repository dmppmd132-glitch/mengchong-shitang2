import {
  PersonalityId,
  PetPreference,
  PetSpecies,
} from '../types';

export interface PersonalityDefinition {
  id: PersonalityId;
  label: string;
  emoji: string;
  tagline: string;
  description: string;
  careHint: string;
  badgeClass: string;
  barColorClass: string;
}

export const PERSONALITY_IDS: PersonalityId[] = [
  'greedy',
  'sleepy',
  'mischievous',
  'clingy',
  'elegant',
  'curious',
  'lively',
  'shy',
];

export const PERSONALITY_DEFINITIONS: Record<PersonalityId, PersonalityDefinition> = {
  greedy: {
    id: 'greedy',
    label: '貪吃',
    emoji: '🍮',
    tagline: '點心雷達全開的小吃貨',
    description: '對香甜布丁與熱呼呼速食毫無抵抗力，每次開飯眼睛都會閃閃發亮！',
    careHint: '常餵甜點與速食',
    badgeClass: 'bg-[#FFF1D6] border-[#F2C97D] text-[#9A5B12]',
    barColorClass: 'bg-[#F6B94E]',
  },
  sleepy: {
    id: 'sleepy',
    label: '愛睡',
    emoji: '💤',
    tagline: '軟綿綿抱枕與雲朵床守護者',
    description: '最喜歡在柔軟小床上窩成一團午睡，呼吸節奏像溫柔的搖籃曲。',
    careHint: '常哄寶貝睡覺休息',
    badgeClass: 'bg-[#EFEAFF] border-[#C9BDF2] text-[#5B449C]',
    barColorClass: 'bg-[#A492E3]',
  },
  mischievous: {
    id: 'mischievous',
    label: '調皮',
    emoji: '😜',
    tagline: '鬼點子多多的驚喜製造機',
    description: '喜歡追著飛盤或玩躲貓貓，偶爾會用可愛的小惡作劇逗飼主開心！',
    careHint: '常玩小遊戲累積快樂',
    badgeClass: 'bg-[#FFEAF2] border-[#F4B4CB] text-[#C43463]',
    barColorClass: 'bg-[#FF7FA4]',
  },
  clingy: {
    id: 'clingy',
    label: '撒嬌',
    emoji: '🩷',
    tagline: '最黏人也最會貼貼的小甜心',
    description: '只要收到摸摸或暖心留言就會立刻貼過來蹭蹭，把滿滿的愛都給你們。',
    careHint: '常摸摸與留言互動',
    badgeClass: 'bg-[#FFE7EE] border-[#F5B0C5] text-[#BE3360]',
    barColorClass: 'bg-[#FF6E97]',
  },
  elegant: {
    id: 'elegant',
    label: '優雅',
    emoji: '🫧',
    tagline: '香噴噴又注重儀態的小紳士／小淑女',
    description: '喜歡乾淨整潔的環境與洗香香，散發淡雅果香與從容氣質。',
    careHint: '常清理環境與洗澡',
    badgeClass: 'bg-[#E4F7F0] border-[#A7E0CB] text-[#1F6B54]',
    barColorClass: 'bg-[#5CC9A7]',
  },
  curious: {
    id: 'curious',
    label: '好奇',
    emoji: '🔍',
    tagline: '對新家具與秘密角落充滿探索欲',
    description: '每次小屋多了新擺設或新玩具，總會第一個跑過去嗅嗅看個仔細！',
    careHint: '常添購新家具與玩具',
    badgeClass: 'bg-[#EAF3FF] border-[#B6D1FA] text-[#2F5B9E]',
    barColorClass: 'bg-[#74A7F2]',
  },
  lively: {
    id: 'lively',
    label: '活潑',
    emoji: '⚡',
    tagline: '電力滿格的陽光小夥伴',
    description: '隨時準備好陪飼主玩遊戲、散步與奔跑，到哪裡都能帶動歡樂氣氛！',
    careHint: '常玩小遊戲與出門散步',
    badgeClass: 'bg-[#FFF5D4] border-[#F4D06E] text-[#94600D]',
    barColorClass: 'bg-[#F8C443]',
  },
  shy: {
    id: 'shy',
    label: '害羞',
    emoji: '🌸',
    tagline: '溫柔細膩、容易臉紅的小可愛',
    description: '起初會悄悄躲在帳篷或紗簾後面偷看，熟了之後會偷偷靠過來牽牽手。',
    careHint: '溫柔陪伴與細心照護',
    badgeClass: 'bg-[#FFF0F6] border-[#F3C5DA] text-[#A44672]',
    barColorClass: 'bg-[#EC8EB9]',
  },
};

export const PET_PREFERENCES: Record<PetSpecies, PetPreference> = {
  pig: {
    species: 'pig',
    favoriteFoodIds: ['caramel_pudding', 'crispy_fries'],
    favoriteToyIds: ['toy_throw_pillow'],
    favoriteFurnitureIds: [
      'bakery_snack_rack',
      'cloud_dessert_tower',
      'fluffy_cotton_pillow',
      'pumpkin_plush_pillow',
      'cloud_puff_pillow',
    ],
    dislikedFoodIds: ['veggie_porridge', 'carrot_salad'],
    dislikedToyIds: ['toy_mirror'],
    dislikedFurnitureIds: ['wooden_welcome_sign', 'linen_flower_curtain'],
  },
  rabbit: {
    species: 'rabbit',
    favoriteFoodIds: ['carrot_salad', 'fruit_box'],
    favoriteToyIds: ['toy_mini_tent'],
    favoriteFurnitureIds: [
      'monstera_pot',
      'sunflower_vase',
      'blueberry_scent_pot',
    ],
    dislikedFoodIds: ['meat_bento', 'cheese_burger'],
    dislikedToyIds: ['toy_frisbee'],
    dislikedFurnitureIds: ['camp_picnic_table', 'camp_trail_sign'],
  },
  dog: {
    species: 'dog',
    favoriteFoodIds: ['meat_bento', 'cheese_burger'],
    favoriteToyIds: ['toy_rainbow_ball', 'toy_frisbee'],
    favoriteFurnitureIds: ['rainbow_bounce_ball', 'cloud_star_ball'],
    dislikedFoodIds: ['dried_fruit', 'mint_parfait'],
    dislikedToyIds: ['toy_mirror'],
    dislikedFurnitureIds: ['strawberry_lace_bed', 'cloud_gauze_curtain'],
  },
};

export const SPECIES_INITIAL_PERSONALITY_DEFAULTS: Record<
  PetSpecies,
  {
    primary: PersonalityId;
    secondary: PersonalityId;
    baseScores: Record<PersonalityId, number>;
  }
> = {
  pig: {
    primary: 'greedy',
    secondary: 'clingy',
    baseScores: {
      greedy: 26,
      clingy: 20,
      sleepy: 15,
      shy: 12,
      curious: 11,
      lively: 10,
      mischievous: 9,
      elegant: 8,
    },
  },
  rabbit: {
    primary: 'shy',
    secondary: 'elegant',
    baseScores: {
      shy: 26,
      elegant: 20,
      curious: 15,
      sleepy: 13,
      clingy: 12,
      greedy: 10,
      lively: 9,
      mischievous: 8,
    },
  },
  dog: {
    primary: 'lively',
    secondary: 'clingy',
    baseScores: {
      lively: 26,
      clingy: 20,
      curious: 15,
      greedy: 13,
      mischievous: 12,
      sleepy: 10,
      elegant: 9,
      shy: 8,
    },
  },
};

export type PersonalityCareTrigger =
  | 'feed_dessert_fastfood'
  | 'sleep'
  | 'minigame'
  | 'pet_or_message'
  | 'clean_or_bath'
  | 'buy_furniture';

export const PERSONALITY_CARE_DELTAS: Record<
  PersonalityCareTrigger,
  Partial<Record<PersonalityId, number>>
> = {
  feed_dessert_fastfood: { greedy: 2 },
  sleep: { sleepy: 2 },
  minigame: { lively: 1, mischievous: 1 },
  pet_or_message: { clingy: 2 },
  clean_or_bath: { elegant: 2 },
  buy_furniture: { curious: 2 },
};

export const DISLIKED_FOOD_SPEECHES: Record<PetSpecies, string[]> = {
  pig: [
    '唔… 這個太清淡了啦，不過既然是你夾給我的，我還是乖乖吃一口…',
    '呼嚕… 下次可以換香甜布丁或酥脆薯條嗎？但謝謝你照顧我！',
  ],
  rabbit: [
    '啾… 這個味道有點太重了，小兔小口吃一點點就好…',
    '唔啾… 還是紅蘿蔔沙拉和水果盒比較合口味，不過謝謝你的心意！',
  ],
  dog: [
    '嗚… 味道好淡喔汪，雖然不太喜歡，但主人給的我還是會吃完！',
    '汪… 下次想要大口吃肉肉便當或漢堡啦～不過謝謝你！',
  ],
};

export const FAVORITE_FOOD_SPEECHES: Record<PetSpecies, string[]> = {
  pig: [
    '呼嚕呼嚕！！這是我最愛的美味！幸福到原地彈起來啦～',
    '眼睛都變成星星了！布丁與點心萬歲，最愛你了呼嚕！',
  ],
  rabbit: [
    '咔滋咔滋！！最愛這口清爽甜香了啾，耳朵都要飛起來囉！',
    '啾咪！這完全就是夢幻級美食，幸福感一百分啾～',
  ],
  dog: [
    '汪嗚！！最喜歡的香氣來了！尾巴搖到變成螺旋槳啦！',
    '太幸福了汪！這是我心中第一名的超級料理！',
  ],
};

export const FAVORITE_ITEM_BUBBLE_SPEECHES: Record<PetSpecies, string[]> = {
  pig: [
    '最愛在抱枕和點心架旁邊待著了，幸福滿分呼嚕～',
    '哇！這就是我最喜歡的寶貝，趕快過來蹭蹭！',
  ],
  rabbit: [
    '啾！最喜歡躲進小帳篷和聞花盆的清香了～',
    '發現最愛的角落！待在這裡感覺安心又快樂啾！',
  ],
  dog: [
    '汪汪！這是我最愛的玩具！快陪我一起玩吧！',
    '眼睛亮晶晶！看到最喜歡的球球和飛盤就停不下來汪！',
  ],
};
