import React from 'react';
import { ROOM_ITEM_BY_ID } from '../../data/house';
import { FurnitureCategory, ThemeSetId } from '../../types';

interface FurnitureGraphicProps {
  itemId: string;
  size?: number;
  className?: string;
}

function getPalette(themeId: ThemeSetId | null, itemId: string) {
  if (themeId === 'strawberry_sweet') {
    return {
      primary: '#FF85A6',
      secondary: '#FFD6E3',
      accent: '#D93B6B',
      wood: '#E8A5B8',
      dark: '#6D2C43',
    };
  }
  if (themeId === 'forest_camp') {
    return {
      primary: '#59B487',
      secondary: '#DFF5E7',
      accent: '#D48A45',
      wood: '#B07B4E',
      dark: '#2D4D3B',
    };
  }
  if (themeId === 'cloud_nap') {
    return {
      primary: '#97B9F7',
      secondary: '#EEF4FF',
      accent: '#FFD966',
      wood: '#C3D3F0',
      dark: '#384C75',
    };
  }
  if (itemId.includes('pumpkin')) {
    return {
      primary: '#F38B3A',
      secondary: '#FFE4C7',
      accent: '#4F9E66',
      wood: '#C88E5B',
      dark: '#5C381C',
    };
  }
  if (itemId.includes('mint')) {
    return {
      primary: '#66C9A7',
      secondary: '#E2F9F0',
      accent: '#2D8A6B',
      wood: '#9CCEB8',
      dark: '#255243',
    };
  }
  if (itemId.includes('sunflower')) {
    return {
      primary: '#F8C138',
      secondary: '#FFF4C7',
      accent: '#7A4C24',
      wood: '#CE9B64',
      dark: '#57391B',
    };
  }
  if (itemId.includes('blueberry')) {
    return {
      primary: '#6D83DF',
      secondary: '#E8EEFF',
      accent: '#59B487',
      wood: '#B98E6B',
      dark: '#333F75',
    };
  }
  return {
    primary: '#E59F6C',
    secondary: '#FFF2DF',
    accent: '#FF7A9E',
    wood: '#C78E5D',
    dark: '#5C3E31',
  };
}

function renderToySvg(itemId: string) {
  switch (itemId) {
    case 'toy_rainbow_ball':
      return (
        <g>
          <circle cx="32" cy="34" r="17" fill="#FF7A9E" stroke="#5C3E31" strokeWidth="1.8" />
          <path d="M18 24 Q32 16 46 24" stroke="#FFD166" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M16 34 Q32 27 48 34" stroke="#5CC9A7" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <path d="M19 43 Q32 37 45 43" stroke="#74A7F2" strokeWidth="4.5" fill="none" strokeLinecap="round" />
          <circle cx="25" cy="24" r="2.8" fill="#FFFFFF" opacity="0.85" />
        </g>
      );
    case 'toy_mini_tent':
      return (
        <g>
          <path d="M32 14 L12 49 H52 Z" fill="#59B487" stroke="#2D4D3B" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M32 14 L23 49 H41 Z" fill="#FFF3D8" />
          <path d="M32 24 L26 49 H38 Z" fill="#4A3531" opacity="0.85" />
          <path d="M32 14 V10" stroke="#D48A45" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M32 10 L40 12 L32 14 Z" fill="#FF7A9E" />
        </g>
      );
    case 'toy_throw_pillow':
      return (
        <g>
          <path
            d="M15 22 Q32 17 49 22 Q53 34 49 46 Q32 51 15 46 Q11 34 15 22 Z"
            fill="#FF9EB8"
            stroke="#6D2C43"
            strokeWidth="1.8"
          />
          <circle cx="22" cy="27" r="2.5" fill="#FFF6FA" />
          <circle cx="42" cy="27" r="2.5" fill="#FFF6FA" />
          <circle cx="22" cy="41" r="2.5" fill="#FFF6FA" />
          <circle cx="42" cy="41" r="2.5" fill="#FFF6FA" />
          <path d="M27 33 Q32 38 37 33" stroke="#6D2C43" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="34" r="5" fill="#FFEAF0" opacity="0.7" />
        </g>
      );
    case 'toy_puzzle_cube':
      return (
        <g>
          <rect x="16" y="18" width="16" height="16" rx="3" fill="#FF8AA8" stroke="#5C3E31" strokeWidth="1.5" />
          <rect x="32" y="18" width="16" height="16" rx="3" fill="#FFD166" stroke="#5C3E31" strokeWidth="1.5" />
          <rect x="16" y="34" width="16" height="16" rx="3" fill="#74A7F2" stroke="#5C3E31" strokeWidth="1.5" />
          <rect x="32" y="34" width="16" height="16" rx="3" fill="#5CC9A7" stroke="#5C3E31" strokeWidth="1.5" />
          <circle cx="24" cy="26" r="2.5" fill="#FFFFFF" />
          <circle cx="40" cy="42" r="2.5" fill="#FFFFFF" />
        </g>
      );
    case 'toy_mirror':
      return (
        <g>
          <rect x="29" y="42" width="6" height="8" rx="2" fill="#C78E5D" />
          <ellipse cx="32" cy="51" rx="13" ry="3.5" fill="#E59F6C" stroke="#5C3E31" strokeWidth="1.4" />
          <ellipse cx="32" cy="28" rx="14" ry="17" fill="#FFE8B6" stroke="#5C3E31" strokeWidth="1.8" />
          <ellipse cx="32" cy="28" rx="10" ry="13" fill="#DFF3FF" stroke="#B6D9EE" strokeWidth="1.2" />
          <path d="M26 22 L30 18 M25 29 L33 21" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
        </g>
      );
    case 'toy_frisbee':
      return (
        <g>
          <ellipse cx="32" cy="35" rx="22" ry="11" fill="#6BB6F5" stroke="#2F5B9E" strokeWidth="1.8" />
          <ellipse cx="32" cy="33" rx="16" ry="7" fill="#B8E0FF" />
          <ellipse cx="32" cy="32" rx="9" ry="3.5" fill="#FFD166" />
        </g>
      );
    default:
      return (
        <g>
          <circle cx="32" cy="34" r="15" fill="#FF8AA8" stroke="#5C3E31" strokeWidth="1.8" />
          <circle cx="28" cy="29" r="3" fill="#FFFFFF" opacity="0.8" />
        </g>
      );
  }
}

function renderCategorySvg(
  category: FurnitureCategory,
  p: ReturnType<typeof getPalette>,
  itemId: string
) {
  switch (category) {
    case 'toy':
      return renderToySvg(itemId);
    case 'bed':
      return (
        <g>
          <rect x="10" y="34" width="44" height="16" rx="5" fill={p.wood} />
          <rect x="12" y="20" width="8" height="22" rx="3" fill={p.wood} />
          <rect x="44" y="26" width="8" height="18" rx="3" fill={p.wood} />
          <rect x="15" y="29" width="34" height="12" rx="4" fill={p.secondary} />
          <rect x="18" y="25" width="12" height="7" rx="3" fill="#FFFFFF" stroke={p.primary} strokeWidth="1.5" />
          <path d="M29 29 H49 Q52 29 52 34 V41 H27 V31 Q27 29 29 29 Z" fill={p.primary} />
          <circle cx="15" cy="52" r="2.5" fill={p.dark} />
          <circle cx="49" cy="52" r="2.5" fill={p.dark} />
        </g>
      );
    case 'pillow':
      return (
        <g>
          <path
            d="M14 24 Q32 18 50 24 Q54 36 50 46 Q32 51 14 46 Q10 36 14 24 Z"
            fill={p.primary}
            stroke={p.dark}
            strokeWidth="1.5"
          />
          <path d="M19 28 Q32 24 45 28" stroke={p.secondary} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <circle cx="32" cy="35" r="4" fill={p.secondary} />
        </g>
      );
    case 'blanket':
      return (
        <g>
          <rect x="12" y="20" width="40" height="28" rx="6" fill={p.primary} stroke={p.dark} strokeWidth="1.5" />
          <rect x="12" y="30" width="40" height="8" fill={p.secondary} opacity="0.85" />
          <path d="M16 48 V53 M24 48 V53 M32 48 V53 M40 48 V53 M48 48 V53" stroke={p.wood} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'rug':
      return (
        <g>
          <ellipse cx="32" cy="36" rx="24" ry="14" fill={p.primary} stroke={p.dark} strokeWidth="1.5" />
          <ellipse cx="32" cy="36" rx="17" ry="9" fill={p.secondary} />
          <circle cx="32" cy="36" r="4" fill={p.accent} />
        </g>
      );
    case 'toyBall':
      return (
        <g>
          <circle cx="32" cy="34" r="16" fill={p.primary} stroke={p.dark} strokeWidth="1.8" />
          <path d="M21 23 Q32 34 21 45" stroke="#FFFFFF" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M43 23 Q32 34 43 45" stroke={p.accent} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx="27" cy="26" r="3" fill="#FFFFFF" opacity="0.7" />
        </g>
      );
    case 'diningTable':
      return (
        <g>
          <rect x="16" y="34" width="5" height="17" rx="2" fill={p.wood} />
          <rect x="43" y="34" width="5" height="17" rx="2" fill={p.wood} />
          <ellipse cx="32" cy="31" rx="23" ry="9" fill={p.primary} stroke={p.dark} strokeWidth="1.5" />
          <ellipse cx="32" cy="29" rx="18" ry="6" fill={p.secondary} />
          <circle cx="32" cy="29" r="3.5" fill={p.accent} />
        </g>
      );
    case 'placemat':
      return (
        <g>
          <rect x="10" y="21" width="44" height="26" rx="5" fill={p.secondary} stroke={p.primary} strokeWidth="2" />
          <circle cx="32" cy="34" r="8" fill="#FFFFFF" stroke={p.primary} strokeWidth="1.5" />
          <path d="M17 27 V41 M47 27 V41" stroke={p.accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    case 'snackRack':
      return (
        <g>
          <rect x="30" y="14" width="4" height="36" rx="2" fill={p.wood} />
          <ellipse cx="32" cy="48" rx="18" ry="5" fill={p.primary} stroke={p.dark} strokeWidth="1.3" />
          <ellipse cx="32" cy="35" rx="15" ry="4.5" fill={p.secondary} stroke={p.dark} strokeWidth="1.3" />
          <ellipse cx="32" cy="23" rx="11" ry="4" fill={p.primary} stroke={p.dark} strokeWidth="1.3" />
          <circle cx="26" cy="33" r="3" fill={p.accent} />
          <circle cx="37" cy="33" r="3" fill="#FFD166" />
          <circle cx="32" cy="20" r="3.2" fill="#FF7A9E" />
        </g>
      );
    case 'plant':
      return (
        <g>
          <path d="M22 36 H42 L39 51 H25 Z" fill={p.wood} stroke={p.dark} strokeWidth="1.5" />
          <rect x="20" y="33" width="24" height="5" rx="2" fill={p.primary} />
          <path d="M32 33 V19" stroke="#3D8E62" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="24" cy="22" rx="7" ry="4.5" transform="rotate(-24 24 22)" fill="#5CC9A7" />
          <ellipse cx="40" cy="22" rx="7" ry="4.5" transform="rotate(24 40 22)" fill="#47B590" />
          <circle cx="32" cy="17" r="5" fill={p.primary} />
        </g>
      );
    case 'curtain':
      return (
        <g>
          <rect x="10" y="14" width="44" height="4" rx="2" fill={p.wood} />
          <path d="M13 18 H28 Q26 35 19 49 H13 Z" fill={p.primary} stroke={p.dark} strokeWidth="1.3" />
          <path d="M51 18 H36 Q38 35 45 49 H51 Z" fill={p.primary} stroke={p.dark} strokeWidth="1.3" />
          <rect x="21" y="20" width="22" height="22" rx="3" fill={p.secondary} opacity="0.7" />
        </g>
      );
    case 'painting':
      return (
        <g>
          <rect x="13" y="16" width="38" height="32" rx="4" fill={p.wood} stroke={p.dark} strokeWidth="1.5" />
          <rect x="17" y="20" width="30" height="24" rx="2" fill={p.secondary} />
          <circle cx="25" cy="27" r="4" fill="#FFD166" />
          <path d="M18 42 L26 33 L33 39 L39 32 L46 42 Z" fill={p.primary} />
        </g>
      );
    case 'stringLights':
      return (
        <g>
          <path d="M10 22 Q32 36 54 22" stroke={p.dark} strokeWidth="2" fill="none" />
          <circle cx="17" cy="26" r="4.5" fill="#FFE07D" stroke="#E5A622" strokeWidth="1.2" />
          <circle cx="27" cy="30" r="4.5" fill={p.primary} stroke={p.dark} strokeWidth="1.2" />
          <circle cx="37" cy="30" r="4.5" fill="#FFE07D" stroke="#E5A622" strokeWidth="1.2" />
          <circle cx="47" cy="26" r="4.5" fill={p.secondary} stroke={p.dark} strokeWidth="1.2" />
        </g>
      );
    case 'sign':
      return (
        <g>
          <rect x="30" y="34" width="4" height="17" rx="1.5" fill={p.dark} />
          <rect x="12" y="16" width="40" height="22" rx="5" fill={p.primary} stroke={p.dark} strokeWidth="1.5" />
          <rect x="16" y="20" width="32" height="14" rx="3" fill={p.secondary} />
          <path d="M22 27 H42" stroke={p.dark} strokeWidth="2.5" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

export const FurnitureGraphic: React.FC<FurnitureGraphicProps> = ({
  itemId,
  size = 44,
  className = '',
}) => {
  const item = ROOM_ITEM_BY_ID[itemId];
  if (!item) return null;

  const palette = getPalette(item.themeId, item.id);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
    >
      {renderCategorySvg(item.category, palette, item.id)}
    </svg>
  );
};
