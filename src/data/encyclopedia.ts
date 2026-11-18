import { TitleId } from '../types';

export interface TitleDefinition {
  id: TitleId;
  name: string;
  emoji: string;
  description: string;
  unlockCondition: string;
  badgeClass: string;
}

export const TITLE_DEFINITIONS: Record<TitleId, TitleDefinition> = {
  gourmet_owner: {
    id: 'gourmet_owner',
    name: '美食家飼主',
    emoji: '🍽️',
    description: '嘗遍萌寵食堂全部料理，最懂寶貝味蕾的超級大廚！',
    unlockCondition: '收集完所有食物圖鑑',
    badgeClass: 'bg-[#FFF3D8] border-[#F2CE6D] text-[#8A5610]',
  },
  fashion_stylist: {
    id: 'fashion_stylist',
    name: '時尚造型師',
    emoji: '👑',
    description: '集齊全系列可愛配件，走在路上永遠是全場焦點！',
    unlockCondition: '收集完所有配件圖鑑',
    badgeClass: 'bg-[#FFEAF2] border-[#F3B6CC] text-[#B83B64]',
  },
  strawberry_dreamer: {
    id: 'strawberry_dreamer',
    name: '草莓甜心家',
    emoji: '🍓',
    description: '集齊「草莓甜心」主題套裝，把房間變成粉嫩甜點屋！',
    unlockCondition: '完成「草莓甜心」主題套裝',
    badgeClass: 'bg-[#FFEAF2] border-[#F5B0C8] text-[#C83B67]',
  },
  forest_camper: {
    id: 'forest_camper',
    name: '森林露營家',
    emoji: '🌲',
    description: '集齊「森林露營」主題套裝，在微風燈火旁享受自然野趣！',
    unlockCondition: '完成「森林露營」主題套裝',
    badgeClass: 'bg-[#E7F7EE] border-[#A6DFC5] text-[#1F6B54]',
  },
  cloud_napper: {
    id: 'cloud_napper',
    name: '雲朵築夢師',
    emoji: '☁️',
    description: '集齊「雲朵午睡」主題套裝，擁有最軟綿治癒的空中夢境房！',
    unlockCondition: '完成「雲朵午睡」主題套裝',
    badgeClass: 'bg-[#EEF4FF] border-[#BFD4FA] text-[#355A9C]',
  },
  coop_partner: {
    id: 'coop_partner',
    name: '默契搭檔',
    emoji: '💞',
    description: '連續 7 天攜手完成共養合作遊戲，兩人的默契已達滿分殿堂！',
    unlockCondition: '連續 7 天完成合作遊戲',
    badgeClass: 'bg-[#FFEAF2] border-[#F4A6C2] text-[#B83B64]',
  },
};

export const ACCESSORY_MILESTONE_STEP = 5;
export const ACCESSORY_MILESTONE_COINS = 50;
export const ACCESSORY_MILESTONE_GROWTH = 20;

export const FURNITURE_MILESTONE_STEP = 5;
export const FURNITURE_MILESTONE_COINS = 80;
export const FURNITURE_MILESTONE_GROWTH = 25;

export function getTitleDefinition(id: TitleId): TitleDefinition {
  return TITLE_DEFINITIONS[id];
}
