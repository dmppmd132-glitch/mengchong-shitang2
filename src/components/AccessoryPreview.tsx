import React from 'react';

interface AccessoryPreviewProps {
  accessoryId: string;
}

export const AccessoryPreview: React.FC<AccessoryPreviewProps> = ({ accessoryId }) => {
  return (
    <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
      {accessoryId === 'pink_bow' && (
        <g transform="translate(32, 32)">
          <path d="M 0 0 L -20 -10 Q -24 2 -18 10 Z" fill="#FF6B9A" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <path d="M 0 0 L 20 -10 Q 24 2 18 10 Z" fill="#FF6B9A" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="0" cy="0" r="6.5" fill="#FFE082" stroke="#5A3E36" strokeWidth="3" />
        </g>
      )}
      {accessoryId === 'strawberry_clip' && (
        <g transform="translate(32, 34)">
          <path d="M 0 -12 C 15 -12 18 5 0 18 C -18 5 -15 -12 0 -12 Z" fill="#FF5C8D" stroke="#5A3E36" strokeWidth="3" />
          <path d="M -10 -12 Q 0 -20 10 -12 Q 0 -7 -10 -12 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="2.5" />
          <circle cx="-4" cy="-2" r="1.8" fill="#FFF8E1" />
          <circle cx="5" cy="1" r="1.8" fill="#FFF8E1" />
          <circle cx="0" cy="8" r="1.8" fill="#FFF8E1" />
        </g>
      )}
      {accessoryId === 'mini_crown' && (
        <g transform="translate(32, 34)">
          <path d="M -20 12 L -24 -10 L -9 2 L 0 -14 L 9 2 L 24 -10 L 20 12 Z" fill="#FFD54F" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="0" cy="4" r="3" fill="#FF6B9A" />
        </g>
      )}
      {accessoryId === 'chef_hat' && (
        <g transform="translate(32, 34)">
          <path d="M -20 10 C -30 -2 -18 -20 -4 -14 C 0 -24 14 -22 15 -12 C 26 -14 30 2 20 10 Z" fill="#FFFFFF" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <rect x="-18" y="8" width="36" height="9" rx="3" fill="#FFF5DA" stroke="#5A3E36" strokeWidth="2.8" />
        </g>
      )}
      {accessoryId === 'round_glasses' && (
        <g fill="none" stroke="#6B4423" strokeWidth="3.2">
          <circle cx="20" cy="32" r="10" fill="#FFFFFF" fillOpacity="0.4" />
          <circle cx="44" cy="32" r="10" fill="#FFFFFF" fillOpacity="0.4" />
          <path d="M 30 32 Q 32 29 34 32" />
        </g>
      )}
      {accessoryId === 'star_blush' && (
        <g fill="#FFE066" stroke="#5A3E36" strokeWidth="2.4" strokeLinejoin="round">
          <path d="M 20 22 L 23 29 L 30 30 L 25 35 L 26 42 L 20 38 L 14 42 L 15 35 L 10 30 L 17 29 Z" />
          <path d="M 44 22 L 47 29 L 54 30 L 49 35 L 50 42 L 44 38 L 38 42 L 39 35 L 34 30 L 41 29 Z" />
        </g>
      )}
      {accessoryId === 'heart_shades' && (
        <g stroke="#5A3E36" strokeWidth="2.8">
          <path d="M 20 42 C 9 35 8 24 16 24 C 19 24 20 27 20 28 C 20 27 21 24 24 24 C 32 24 31 35 20 42 Z" fill="#FF6B9A" />
          <path d="M 44 42 C 33 35 32 24 40 24 C 43 24 44 27 44 28 C 44 27 45 24 48 24 C 56 24 55 35 44 42 Z" fill="#FF6B9A" />
          <path d="M 29 30 L 35 30" fill="none" />
        </g>
      )}
      {accessoryId === 'baby_bib' && (
        <g transform="translate(32, 32)">
          <path d="M -20 -14 Q 0 -4 20 -14 Q 24 14 0 20 Q -24 14 -20 -14 Z" fill="#FFF0A5" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="0" cy="4" r="4.5" fill="#FF7A9E" />
        </g>
      )}
      {accessoryId === 'mint_bell_tie' && (
        <g transform="translate(32, 32)">
          <path d="M -20 -8 L 0 0 L -20 8 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M 20 -8 L 0 0 L 20 8 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="2.8" strokeLinejoin="round" />
          <circle cx="0" cy="4" r="6" fill="#FFE066" stroke="#5A3E36" strokeWidth="2.6" />
        </g>
      )}
      {accessoryId === 'mint_apron' && (
        <g transform="translate(32, 32)">
          <path d="M -18 -14 Q 0 -10 18 -14 L 22 18 Q 0 24 -22 18 Z" fill="#7EDBC0" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <rect x="-10" y="-2" width="20" height="12" rx="4" fill="#FFF8E1" stroke="#5A3E36" strokeWidth="2.5" />
        </g>
      )}
      {accessoryId === 'strawberry_cape' && (
        <g transform="translate(32, 32)">
          <path d="M -18 -16 Q -26 8 -20 18 Q 0 24 20 18 Q 26 8 18 -16 Q 0 -10 -18 -16 Z" fill="#FF8AA8" stroke="#5A3E36" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="-8" cy="4" r="3" fill="#FFFDF7" />
          <circle cx="8" cy="4" r="3" fill="#FFFDF7" />
          <circle cx="0" cy="12" r="3" fill="#FFFDF7" />
        </g>
      )}
      {accessoryId === 'beret_hat' && (
        <g transform="translate(32, 35)">
          <path d="M 0 -18 L 2 -23" stroke="#5A3E36" strokeWidth="3.2" strokeLinecap="round" />
          <ellipse cx="0" cy="-4" rx="22" ry="12" fill="#C97E49" stroke="#5A3E36" strokeWidth="3" />
          <path d="M -18 4 Q 0 11 18 4" fill="none" stroke="#5A3E36" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {accessoryId === 'sprout_clip' && (
        <g transform="translate(32, 36)">
          <path d="M 0 10 L 0 -6" stroke="#5A3E36" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 0 -4 C -4 -18 -20 -18 -18 -6 C -16 2 -4 2 0 -4 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="2.8" />
          <path d="M 0 -6 C 4 -20 20 -20 18 -8 C 16 0 4 0 0 -6 Z" fill="#95E8C9" stroke="#5A3E36" strokeWidth="2.8" />
        </g>
      )}
      {accessoryId === 'bandaid_cute' && (
        <g transform="translate(32, 32) rotate(-20)">
          <rect x="-20" y="-8" width="40" height="16" rx="8" fill="#FFB2C8" stroke="#5A3E36" strokeWidth="2.8" />
          <rect x="-7" y="-7" width="14" height="14" rx="2" fill="#FFF7EC" stroke="#5A3E36" strokeWidth="2.2" />
          <circle cx="-13" cy="-2" r="1.4" fill="#5A3E36" />
          <circle cx="-13" cy="2" r="1.4" fill="#5A3E36" />
          <circle cx="13" cy="-2" r="1.4" fill="#5A3E36" />
          <circle cx="13" cy="2" r="1.4" fill="#5A3E36" />
        </g>
      )}
      {accessoryId === 'monocle_gold' && (
        <g transform="translate(32, 30)">
          <circle cx="-2" cy="0" r="14" fill="#FFF7D6" fillOpacity="0.45" stroke="#D99B26" strokeWidth="3.6" />
          <circle cx="-2" cy="0" r="11" fill="none" stroke="#5A3E36" strokeWidth="1.5" opacity="0.5" />
          <path d="M 12 4 Q 16 14 13 24" fill="none" stroke="#D99B26" strokeWidth="2.8" strokeLinecap="round" />
        </g>
      )}
      {accessoryId === 'pearl_necklace' && (
        <g transform="translate(32, 32)">
          <path d="M -20 -6 Q 0 18 20 -6" fill="none" stroke="#5A3E36" strokeWidth="2" />
          <circle cx="-18" cy="-4" r="4.2" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.2" />
          <circle cx="-10" cy="4" r="4.5" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.2" />
          <circle cx="0" cy="8" r="5" fill="#FFE6EA" stroke="#5A3E36" strokeWidth="2.2" />
          <circle cx="10" cy="4" r="4.5" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.2" />
          <circle cx="18" cy="-4" r="4.2" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.2" />
        </g>
      )}
      {accessoryId === 'carrot_scarf' && (
        <g transform="translate(32, 34)">
          <path d="M -22 -12 Q 0 -4 22 -12 L 0 16 Z" fill="#FF8C42" stroke="#5A3E36" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M -10 -7 L 0 3 L 10 -7" fill="none" stroke="#FFF4D8" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="0" cy="-6" r="4.5" fill="#FF6B4A" stroke="#5A3E36" strokeWidth="2.4" />
        </g>
      )}
      {accessoryId === 'sailor_collar' && (
        <g transform="translate(32, 32)">
          <path d="M -20 -12 L 0 -2 L 20 -12 L 22 14 L 0 18 L -22 14 Z" fill="#5D9CEC" stroke="#5A3E36" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M -16 8 L 0 12 L 16 8" fill="none" stroke="#FFFFFF" strokeWidth="2.6" strokeLinecap="round" />
          <path d="M -7 -2 L 0 2 L 7 -2 L 4 8 L 0 4 L -4 8 Z" fill="#FF6B8B" stroke="#5A3E36" strokeWidth="2.2" strokeLinejoin="round" />
        </g>
      )}
      {accessoryId === 'star_pajama' && (
        <g transform="translate(32, 32)">
          <path d="M -19 -14 Q -24 8 -18 18 Q 0 22 18 18 Q 24 8 19 -14 Q 0 -8 -19 -14 Z" fill="#A996E6" stroke="#5A3E36" strokeWidth="2.8" strokeLinejoin="round" />
          <path d="M -8 0 L -6 4 L -2 5 L -5 7 L -4 11 L -8 9 L -12 11 L -11 7 L -14 5 L -10 4 Z" fill="#FFE066" />
          <path d="M 8 2 L 10 6 L 14 7 L 11 9 L 12 13 L 8 11 L 4 13 L 5 9 L 2 7 L 6 6 Z" fill="#FFE066" />
        </g>
      )}
      {accessoryId === 'crystal_crown' && (
        <g transform="translate(32, 36)">
          <path
            d="M -20 10 L -23 -9 L -11 0 L 0 -15 L 11 0 L 23 -9 L 20 10 Z"
            fill="#FFD54F"
            stroke="#5A3E36"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path d="M -18 5 L 18 5" stroke="#F4B400" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-23" cy="-11" r="2.8" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2" />
          <circle cx="0" cy="-17" r="3.2" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2" />
          <circle cx="23" cy="-11" r="2.8" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2" />
          <polygon points="0,-4 4,1 0,6 -4,1" fill="#6EC6FF" stroke="#5A3E36" strokeWidth="1.6" />
          <circle cx="-11" cy="4" r="2.3" fill="#FF6B9A" />
          <circle cx="11" cy="4" r="2.3" fill="#FF6B9A" />
        </g>
      )}
      {accessoryId === 'bunny_flower_crown' && (
        <g transform="translate(32, 34)">
          <path d="M -22 4 Q 0 -6 22 4" fill="none" stroke="#68B984" strokeWidth="4" strokeLinecap="round" />
          <ellipse cx="-17" cy="2" rx="5" ry="2.8" transform="rotate(-30 -17 2)" fill="#7EDBC0" stroke="#5A3E36" strokeWidth="1.8" />
          <ellipse cx="17" cy="2" rx="5" ry="2.8" transform="rotate(30 17 2)" fill="#7EDBC0" stroke="#5A3E36" strokeWidth="1.8" />
          <g transform="translate(-11, -1)">
            <circle cx="0" cy="-4" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="4" cy="0" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="-4" cy="0" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="4" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="0" r="2.5" fill="#FFE066" />
          </g>
          <g transform="translate(0, -4)">
            <circle cx="0" cy="-4.5" r="3.6" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="4.5" cy="0" r="3.6" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="-4.5" cy="0" r="3.6" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="4.5" r="3.6" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="0" r="2.8" fill="#FFE066" />
          </g>
          <g transform="translate(11, -1)">
            <circle cx="0" cy="-4" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="4" cy="0" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="-4" cy="0" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="4" r="3.4" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.6" />
            <circle cx="0" cy="0" r="2.5" fill="#FFE066" />
          </g>
        </g>
      )}
      {accessoryId === 'pilot_goggles' && (
        <g transform="translate(32, 32)">
          <path d="M -27 -2 L -20 -2 M 20 -2 L 27 -2" stroke="#8D5B34" strokeWidth="4.2" strokeLinecap="round" />
          <rect x="-22" y="-11" width="19" height="17" rx="7" fill="#7ED4F7" stroke="#8D5B34" strokeWidth="3.8" />
          <rect x="3" y="-11" width="19" height="17" rx="7" fill="#7ED4F7" stroke="#8D5B34" strokeWidth="3.8" />
          <path d="M -3 -3 L 3 -3" stroke="#5A3E36" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M -17 -6 L -12 -1" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
          <path d="M 8 -6 L 13 -1" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.85" />
        </g>
      )}
      {accessoryId === 'lucky_clover_tie' && (
        <g transform="translate(32, 32)">
          <path d="M 0 0 C -12 -16 -24 -4 -14 0 C -24 4 -12 16 0 0 Z" fill="#68C98D" stroke="#5A3E36" strokeWidth="2.6" strokeLinejoin="round" />
          <path d="M 0 0 C 12 -16 24 -4 14 0 C 24 4 12 16 0 0 Z" fill="#82DB9F" stroke="#5A3E36" strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="0" cy="0" r="5" fill="#FFE066" stroke="#5A3E36" strokeWidth="2.4" />
        </g>
      )}
      {accessoryId === 'hero_cape' && (
        <g transform="translate(32, 32)">
          <path
            d="M -18 -14 L -24 16 Q 0 22 24 16 L 18 -14 Q 0 -7 -18 -14 Z"
            fill="#FF6464"
            stroke="#5A3E36"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path d="M -16 -12 Q 0 -5 16 -12" fill="none" stroke="#FFD54F" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M 0 -5 L 2 -1 L 6 0 L 3 3 L 4 7 L 0 5 L -4 7 L -3 3 L -6 0 L -2 -1 Z" fill="#FFE066" stroke="#5A3E36" strokeWidth="1.6" />
        </g>
      )}
      {accessoryId === 'anniversary_bib' && (
        <g transform="translate(32, 32)">
          <path
            d="M -21 -14 Q 0 -3 21 -14 Q 25 15 0 21 Q -25 15 -21 -14 Z"
            fill="#FFE1EC"
            stroke="#5A3E36"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M -16 8 Q 0 15 16 8"
            fill="none"
            stroke="#FFD54F"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M 0 -4 L 2.6 1 L 8 1.8 L 4 5.5 L 5 11 L 0 8.2 L -5 11 L -4 5.5 L -8 1.8 L -2.6 1 Z"
            fill="#FFD54F"
            stroke="#5A3E36"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
};
