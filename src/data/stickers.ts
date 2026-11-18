import { PetStickerId, PetStickerInfo } from '../types';

export const PET_STICKERS: PetStickerInfo[] = [
  {
    id: 'heart',
    label: '愛你喔',
    caption: '送你一顆粉紅大愛心！',
    bgClass: 'bg-[#FFEAF0]',
  },
  {
    id: 'hungry',
    label: '想吃飯',
    caption: '咕嚕咕嚕… 該開飯囉！',
    bgClass: 'bg-[#FFF3D8]',
  },
  {
    id: 'happy',
    label: '超開心',
    caption: '今天心情好得不得了！',
    bgClass: 'bg-[#E9F9F2]',
  },
  {
    id: 'sleepy',
    label: '想睡覺',
    caption: '呼嚕呼嚕… 晚安好夢',
    bgClass: 'bg-[#EFEAFD]',
  },
  {
    id: 'cheers',
    label: '乾杯慶祝',
    caption: '喝杯奶茶慶祝一下！',
    bgClass: 'bg-[#FFEFE2]',
  },
  {
    id: 'hug',
    label: '討抱抱',
    caption: '張開手手給你大擁抱！',
    bgClass: 'bg-[#FCE8F6]',
  },
  {
    id: 'walk',
    label: '去散步',
    caption: '一起出去吹風散步吧～',
    bgClass: 'bg-[#E6F6EC]',
  },
  {
    id: 'thankyou',
    label: '謝謝你',
    caption: '謝謝你這麼用心照顧我！',
    bgClass: 'bg-[#FFF5D6]',
  },
];

export function isValidStickerId(value: unknown): value is PetStickerId {
  return (
    value === 'heart' ||
    value === 'hungry' ||
    value === 'happy' ||
    value === 'sleepy' ||
    value === 'cheers' ||
    value === 'hug' ||
    value === 'walk' ||
    value === 'thankyou'
  );
}

export function getStickerById(id: PetStickerId | null): PetStickerInfo | null {
  if (!id) return null;
  return PET_STICKERS.find((item) => item.id === id) ?? null;
}
