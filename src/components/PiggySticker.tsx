import React from 'react';
import { PetStickerId } from '../types';

interface PiggyStickerProps {
  stickerId: PetStickerId;
  size?: number;
}

export const PiggySticker: React.FC<PiggyStickerProps> = ({ stickerId, size = 64 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="shrink-0 overflow-visible"
    >
      {/* Background Circle */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill={
          stickerId === 'heart'
            ? '#FFE6EE'
            : stickerId === 'hungry'
            ? '#FFF2D6'
            : stickerId === 'happy'
            ? '#E5F7EF'
            : stickerId === 'sleepy'
            ? '#EDE8FC'
            : stickerId === 'cheers'
            ? '#FFEDE0'
            : stickerId === 'hug'
            ? '#FCE6F4'
            : stickerId === 'walk'
            ? '#E4F5E9'
            : '#FFF4D2'
        }
        stroke="#F4D7DF"
        strokeWidth="2.5"
      />

      {/* Ears */}
      <ellipse
        cx="31"
        cy="30"
        rx="10"
        ry="12"
        transform="rotate(-18 31 30)"
        fill="#FFB6CA"
        stroke="#5A3E36"
        strokeWidth="3"
      />
      <ellipse
        cx="69"
        cy="30"
        rx="10"
        ry="12"
        transform="rotate(18 69 30)"
        fill="#FFB6CA"
        stroke="#5A3E36"
        strokeWidth="3"
      />

      {/* Head / Chubby Body */}
      <ellipse
        cx="50"
        cy="54"
        rx="28"
        ry="24"
        fill="#FFC2D4"
        stroke="#5A3E36"
        strokeWidth="3.2"
      />

      {/* Cheeks */}
      <ellipse cx="32" cy="56" rx="5.5" ry="3.4" fill="#FF8AA8" opacity="0.72" />
      <ellipse cx="68" cy="56" rx="5.5" ry="3.4" fill="#FF8AA8" opacity="0.72" />

      {/* Eyes by expression */}
      {stickerId === 'happy' || stickerId === 'hug' || stickerId === 'thankyou' ? (
        <>
          <path
            d="M 33 47 Q 37 42 41 47"
            fill="none"
            stroke="#5A3E36"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 59 47 Q 63 42 67 47"
            fill="none"
            stroke="#5A3E36"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </>
      ) : stickerId === 'sleepy' ? (
        <>
          <path
            d="M 33 47 Q 37 51 41 47"
            fill="none"
            stroke="#5A3E36"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M 59 47 Q 63 51 67 47"
            fill="none"
            stroke="#5A3E36"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </>
      ) : (
        <>
          <circle cx="37" cy="46" r="3.4" fill="#4A3531" />
          <circle cx="38.2" cy="44.8" r="1.2" fill="#FFFFFF" />
          <circle cx="63" cy="46" r="3.4" fill="#4A3531" />
          <circle cx="64.2" cy="44.8" r="1.2" fill="#FFFFFF" />
        </>
      )}

      {/* Snout */}
      <ellipse
        cx="50"
        cy="56"
        rx="10.5"
        ry="7.5"
        fill="#FF9DB8"
        stroke="#5A3E36"
        strokeWidth="2.6"
      />
      <circle cx="46.5" cy="56" r="1.7" fill="#5A3E36" />
      <circle cx="53.5" cy="56" r="1.7" fill="#5A3E36" />

      {/* Mouth */}
      {stickerId === 'hungry' ? (
        <ellipse cx="50" cy="67" rx="4.2" ry="3.4" fill="#E45B7F" stroke="#5A3E36" strokeWidth="2" />
      ) : stickerId === 'sleepy' ? (
        <circle cx="50" cy="67" r="2.2" fill="#5A3E36" />
      ) : (
        <path
          d="M 44 66 Q 50 71 56 66"
          fill="none"
          stroke="#5A3E36"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )}

      {/* Sticker-specific cute props */}
      {stickerId === 'heart' && (
        <path
          d="M 50 28 C 46 21, 37 23, 37 30 C 37 36, 50 42, 50 42 C 50 42, 63 36, 63 30 C 63 23, 54 21, 50 28 Z"
          fill="#FF5A87"
          stroke="#5A3E36"
          strokeWidth="2.2"
          transform="translate(22, -6) scale(0.58)"
        />
      )}

      {stickerId === 'hungry' && (
        <g transform="translate(65, 62)">
          <path d="M 0 8 Q 10 20 20 8 Z" fill="#FFFFFF" stroke="#5A3E36" strokeWidth="2.4" />
          <path d="M 4 8 Q 10 2 16 8" fill="#FFE69A" stroke="#5A3E36" strokeWidth="2" />
        </g>
      )}

      {stickerId === 'happy' && (
        <g fill="#FFB830">
          <circle cx="20" cy="24" r="3" />
          <circle cx="80" cy="26" r="3" />
          <path d="M 80 65 L 82 70 L 87 72 L 82 74 L 80 79 L 78 74 L 73 72 L 78 70 Z" />
        </g>
      )}

      {stickerId === 'sleepy' && (
        <g fill="#7A62B8" fontWeight="900" fontSize="13">
          <text x="70" y="29">Z</text>
          <text x="79" y="21" fontSize="10">z</text>
        </g>
      )}

      {stickerId === 'cheers' && (
        <g transform="translate(66, 56)">
          <rect x="2" y="6" width="14" height="18" rx="3" fill="#F7D098" stroke="#5A3E36" strokeWidth="2.2" />
          <rect x="0" y="5" width="18" height="4" rx="2" fill="#FFFDF8" stroke="#5A3E36" strokeWidth="2" />
          <line x1="9" y1="0" x2="9" y2="6" stroke="#FF7A9E" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {stickerId === 'hug' && (
        <>
          <ellipse cx="22" cy="60" rx="7" ry="4.5" transform="rotate(-24 22 60)" fill="#FFC2D4" stroke="#5A3E36" strokeWidth="2.6" />
          <ellipse cx="78" cy="60" rx="7" ry="4.5" transform="rotate(24 78 60)" fill="#FFC2D4" stroke="#5A3E36" strokeWidth="2.6" />
        </>
      )}

      {stickerId === 'walk' && (
        <g transform="translate(45, 19)">
          <line x1="5" y1="11" x2="5" y2="2" stroke="#47A87D" strokeWidth="2.6" strokeLinecap="round" />
          <ellipse cx="10" cy="4" rx="5" ry="2.8" transform="rotate(-20 10 4)" fill="#67D4A3" stroke="#5A3E36" strokeWidth="1.8" />
        </g>
      )}

      {stickerId === 'thankyou' && (
        <g transform="translate(66, 60)">
          <circle cx="10" cy="10" r="4" fill="#FFE066" stroke="#5A3E36" strokeWidth="1.8" />
          <circle cx="10" cy="3" r="3.2" fill="#FF7A9E" />
          <circle cx="17" cy="10" r="3.2" fill="#FF7A9E" />
          <circle cx="10" cy="17" r="3.2" fill="#FF7A9E" />
          <circle cx="3" cy="10" r="3.2" fill="#FF7A9E" />
        </g>
      )}
    </svg>
  );
};
