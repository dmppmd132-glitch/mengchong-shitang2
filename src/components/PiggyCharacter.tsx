import React, { useEffect, useState } from 'react';
import { getGrowthStage } from '../data/growth';
import { getPetSpeciesInfo } from '../data/species';
import {
  AccessorySlot,
  FeedingVisualEffect,
  PetExpression,
  PetSpecies,
  PetTouchZone,
  PiggyActionState,
} from '../types';

interface PiggyCharacterProps {
  species?: PetSpecies;
  growth: number;
  roundness: number;
  action: PiggyActionState;
  expression?: PetExpression;
  equipped: Record<AccessorySlot, string | null>;
  flyingFoodEmoji?: string | null;
  feedEffect?: FeedingVisualEffect;
  feedParticles?: string[];
  onPet?: (zone: PetTouchZone) => void;
  size?: number;
  interactive?: boolean;
  isDropTarget?: boolean;
  customAnimClass?: string;
}

export const PiggyCharacter: React.FC<PiggyCharacterProps> = ({
  species = 'pig',
  growth,
  roundness,
  action,
  expression = 'normal',
  equipped,
  flyingFoodEmoji = null,
  feedEffect = 'none',
  feedParticles = [],
  onPet,
  size = 216,
  interactive = true,
  isDropTarget = false,
  customAnimClass = '',
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [chewTick, setChewTick] = useState(false);
  const [tapKey, setTapKey] = useState(0);

  const stage = getGrowthStage(growth);
  const speciesInfo = getPetSpeciesInfo(species);
  const clampedRoundness = Math.min(100, Math.max(0, roundness));
  const chubbyFactor = 0.95 + clampedRoundness * 0.0018;
  const scaleX = stage.bodyScaleX * chubbyFactor;
  const scaleY = stage.bodyScaleY * (0.97 + clampedRoundness * 0.0006);
  const bodyRx = 68 + clampedRoundness * 0.1;
  const bodyRy = 61 + clampedRoundness * 0.05;

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 150);
    }, 3400);
    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, []);

  useEffect(() => {
    if (action !== 'eating') {
      setChewTick(false);
      return;
    }
    const interval = setInterval(() => {
      setChewTick((prev) => !prev);
    }, 180);
    return () => clearInterval(interval);
  }, [action]);

  const detectTouchZone = (clientX?: number, clientY?: number, target?: HTMLElement): PetTouchZone => {
    if (clientX === undefined || clientY === undefined || !target) {
      return 'head';
    }
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return 'head';
    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    if (relY < 0.42) return 'head';
    if (relY < 0.62) return 'cheek';
    if (relX < 0.28 || relX > 0.72 || relY >= 0.8) return 'paw';
    return 'belly';
  };

  const handleTap = (zone: PetTouchZone) => {
    if (!interactive) return;
    setTapKey((k) => k + 1);
    onPet?.(zone);
  };

  const animClass =
    customAnimClass
      ? customAnimClass
      : feedEffect === 'favoriteJump'
      ? 'animate-piggy-jump'
      : action === 'stuffed' || feedEffect === 'stuffed'
      ? 'animate-piggy-stuffed'
      : action === 'eating'
      ? 'animate-piggy-chew'
      : action === 'sleeping'
      ? ''
      : 'animate-piggy-float';

  const eyesClosed = isBlinking || action === 'sleeping';
  const happyArcEyes =
    (action === 'eating' && feedEffect !== 'favoriteJump' && expression === 'normal') ||
    action === 'opening' ||
    action === 'walking' ||
    (action === 'petted' && expression === 'normal');

  const palette =
    species === 'rabbit'
      ? {
          body: stage.level >= 4 ? '#FFF9FC' : '#FFFDF9',
          belly: '#FFEAF2',
          bellyLine: '#F0B8CC',
          limb: '#FFEFF5',
          blush: '#FF9AB8',
        }
      : species === 'dog'
      ? {
          body: stage.level >= 4 ? '#FFE09E' : '#FFE7B3',
          belly: '#FFF6DC',
          bellyLine: '#DCA75B',
          limb: '#F9D68D',
          blush: '#FF8D8D',
        }
      : {
          body: stage.level >= 4 ? '#FFACC3' : '#FFB7CB',
          belly: '#FFD3E0',
          bellyLine: '#E991AA',
          limb: '#FF9EB8',
          blush: '#FF7B9C',
        };

  return (
    <div
      key={tapKey}
      onClick={(e) => handleTap(detectTouchZone(e.clientX, e.clientY, e.currentTarget))}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `摸摸${speciesInfo.shortName}的頭、臉頰、肚子或小手` : undefined}
      onKeyDown={(e) => {
        if (interactive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          handleTap('head');
        }
      }}
      style={{ width: size, height: size }}
      className={`relative select-none flex items-center justify-center transition-transform duration-200 ${
        interactive
          ? 'cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF7A9E]/40 rounded-full'
          : ''
      } ${action === 'petted' ? 'animate-piggy-squish' : ''} ${
        isDropTarget ? 'scale-105' : ''
      }`}
    >
      {isDropTarget && (
        <div className="absolute inset-2 rounded-full bg-[#FFE082]/45 border-2 border-dashed border-[#FF7A9E] pointer-events-none" />
      )}

      {/* Flying food animation toward pet mouth */}
      {flyingFoodEmoji && (
        <div
          key={flyingFoodEmoji + '_' + action}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          aria-hidden="true"
        >
          <span className="text-4xl animate-food-fly drop-shadow-sm translate-y-6">
            {flyingFoodEmoji}
          </span>
        </div>
      )}

      {stage.level === 4 && (
        <svg
          viewBox="0 0 240 240"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-85"
          aria-hidden="true"
        >
          <circle cx="120" cy="126" r="92" fill="#FFF3C4" opacity="0.55" />
          <path d="M40 72 L44 82 L54 86 L44 90 L40 100 L36 90 L26 86 L36 82 Z" fill="#FFD54F" />
          <path d="M198 64 L201 72 L209 75 L201 78 L198 86 L195 78 L187 75 L195 72 Z" fill="#FFD54F" />
        </svg>
      )}

      {action === 'bathing' && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute left-6 bottom-12 w-5 h-5 rounded-full bg-white/80 border-2 border-[#7EDBC0] animate-bubble-rise" />
          <span
            className="absolute right-8 bottom-14 w-7 h-7 rounded-full bg-white/80 border-2 border-[#7EDBC0] animate-bubble-rise"
            style={{ animationDelay: '0.35s' }}
          />
          <span
            className="absolute left-14 top-10 w-4 h-4 rounded-full bg-white/85 border-2 border-[#A7EDE0] animate-bubble-rise"
            style={{ animationDelay: '0.7s' }}
          />
          <span
            className="absolute right-14 top-12 w-6 h-6 rounded-full bg-white/85 border-2 border-[#7EDBC0] animate-bubble-rise"
            style={{ animationDelay: '0.15s' }}
          />
        </div>
      )}

      {action === 'sleeping' && (
        <div
          className="absolute right-5 top-4 pointer-events-none flex flex-col items-end font-extrabold text-[#7B6594]"
          aria-hidden="true"
        >
          <span className="text-lg animate-bounce">Z</span>
          <span className="text-sm -mt-1 mr-2 opacity-80">z</span>
        </div>
      )}

      {(action === 'eating' || feedEffect === 'hearts' || feedEffect === 'favoriteJump') && (
        <div className="absolute inset-0 pointer-events-none z-20" aria-hidden="true">
          {(feedParticles.length > 0 ? feedParticles : ['🩷', '💖', '✨']).map((emoji, idx) => {
            const positions = [
              'left-6 top-10',
              'right-6 top-8',
              'left-1/2 -translate-x-1/2 top-4',
            ];
            return (
              <span
                key={`${emoji}_${idx}_${action}`}
                className={`absolute text-xl animate-feed-burst ${positions[idx % positions.length]}`}
                style={{ animationDelay: `${idx * 0.12}s` }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      )}

      <svg
        viewBox="0 0 240 240"
        className={`w-full h-full overflow-visible ${animClass}`}
        aria-hidden="true"
      >
        <ellipse cx="120" cy="212" rx={58 * scaleX} ry="11" fill="#E8D2C8" opacity="0.7" />

        <g transform={`translate(120, 128) scale(${scaleX}, ${scaleY}) translate(-120, -128)`}>
          {/* Tail */}
          {species === 'rabbit' ? (
            <circle
              cx="188"
              cy="160"
              r="14"
              fill="#FFFFFF"
              stroke="#5A3E36"
              strokeWidth="4.2"
            />
          ) : species === 'dog' ? (
            <path
              d="M 182 162 Q 208 148 202 124"
              fill="none"
              stroke="#E4AA68"
              strokeWidth="12"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M 184 156 C 202 150, 206 134, 194 132 C 185 131, 185 144, 196 144 C 204 144, 210 138, 208 130"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          )}
          {species === 'dog' && (
            <path
              d="M 182 162 Q 208 148 202 124"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="4.2"
              strokeLinecap="round"
              opacity="0.35"
            />
          )}

          {equipped.body === 'strawberry_cape' && (
            <g>
              <path
                d="M 60 132 Q 44 176 58 194 Q 120 206 182 194 Q 196 176 180 132 Q 120 144 60 132 Z"
                fill="#FF8AA8"
                stroke="#5A3E36"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <circle cx="84" cy="166" r="4" fill="#FFFDF7" />
              <circle cx="156" cy="166" r="4" fill="#FFFDF7" />
              <circle cx="120" cy="180" r="4" fill="#FFFDF7" />
            </g>
          )}
          {equipped.body === 'star_pajama' && (
            <g>
              <path
                d="M 60 132 Q 44 176 58 194 Q 120 206 182 194 Q 196 176 180 132 Q 120 144 60 132 Z"
                fill="#A996E6"
                stroke="#5A3E36"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path d="M 82 162 L 85 167 L 91 168 L 87 171 L 88 177 L 82 174 L 76 177 L 77 171 L 73 168 L 79 167 Z" fill="#FFE066" />
              <path d="M 158 162 L 161 167 L 167 168 L 163 171 L 164 177 L 158 174 L 152 177 L 153 171 L 149 168 L 155 167 Z" fill="#FFE066" />
              <circle cx="120" cy="182" r="3.5" fill="#FFE066" />
            </g>
          )}
          {equipped.body === 'hero_cape' && (
            <g>
              <path
                d="M 54 132 Q 34 176 48 198 Q 120 212 192 198 Q 206 176 186 132 Q 120 146 54 132 Z"
                fill="#FF6464"
                stroke="#5A3E36"
                strokeWidth="4"
                strokeLinejoin="round"
              />
              <path
                d="M 58 190 Q 120 202 182 190"
                fill="none"
                stroke="#FFD54F"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Ears behind body */}
          {species === 'rabbit' ? (
            <g>
              <ellipse
                cx="86"
                cy="48"
                rx="14"
                ry="38"
                transform="rotate(-12 86 58)"
                fill="#FFFDF9"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="86"
                cy="50"
                rx="7"
                ry="24"
                transform="rotate(-12 86 58)"
                fill="#FFBFCF"
              />
              <ellipse
                cx="154"
                cy="48"
                rx="14"
                ry="38"
                transform="rotate(12 154 58)"
                fill="#FFFDF9"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="154"
                cy="50"
                rx="7"
                ry="24"
                transform="rotate(12 154 58)"
                fill="#FFBFCF"
              />
            </g>
          ) : species === 'dog' ? (
            <g>
              <ellipse
                cx="56"
                cy="104"
                rx="17"
                ry="34"
                transform="rotate(24 56 104)"
                fill="#E4AA68"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="57"
                cy="108"
                rx="8"
                ry="20"
                transform="rotate(24 57 108)"
                fill="#D3924E"
                opacity="0.7"
              />
              <ellipse
                cx="184"
                cy="104"
                rx="17"
                ry="34"
                transform="rotate(-24 184 104)"
                fill="#E4AA68"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="183"
                cy="108"
                rx="8"
                ry="20"
                transform="rotate(-24 183 108)"
                fill="#D3924E"
                opacity="0.7"
              />
            </g>
          ) : (
            <g>
              <ellipse
                cx="68"
                cy={stage.level >= 3 ? 68 : 72}
                rx={stage.level >= 2 ? 21 : 19}
                ry={stage.level >= 2 ? 27 : 24}
                transform="rotate(-24 68 72)"
                fill="#FF9EB8"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="69"
                cy={stage.level >= 3 ? 71 : 75}
                rx="10"
                ry="14"
                transform="rotate(-24 69 75)"
                fill="#FFD1DF"
              />
              <ellipse
                cx="172"
                cy={stage.level >= 3 ? 68 : 72}
                rx={stage.level >= 2 ? 21 : 19}
                ry={stage.level >= 2 ? 27 : 24}
                transform="rotate(24 172 72)"
                fill="#FF9EB8"
                stroke="#5A3E36"
                strokeWidth="4.5"
              />
              <ellipse
                cx="171"
                cy={stage.level >= 3 ? 71 : 75}
                rx="10"
                ry="14"
                transform="rotate(24 171 75)"
                fill="#FFD1DF"
              />
            </g>
          )}

          {/* Main Chubby Pet Body / Head (scales dynamically with growth & roundness) */}
          <ellipse
            cx="120"
            cy="134"
            rx={bodyRx}
            ry={bodyRy}
            fill={palette.body}
            stroke="#5A3E36"
            strokeWidth="4.5"
          />

          <ellipse
            cx="120"
            cy="162"
            rx={38 + clampedRoundness * 0.1}
            ry={23 + clampedRoundness * 0.05}
            fill={palette.belly}
            opacity="0.82"
          />

          {/* Cute roundness belly curve when chubby */}
          {clampedRoundness >= 60 && (
            <path
              d="M 102 174 Q 120 182 138 174"
              fill="none"
              stroke={palette.bellyLine}
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          )}

          {equipped.body === 'mint_apron' && (
            <g>
              <path
                d="M 80 144 Q 120 150 160 144 L 166 186 Q 120 198 74 186 Z"
                fill="#7EDBC0"
                stroke="#5A3E36"
                strokeWidth="3.8"
                strokeLinejoin="round"
              />
              <rect
                x="102"
                y="158"
                width="36"
                height="20"
                rx="8"
                fill="#FFF8E1"
                stroke="#5A3E36"
                strokeWidth="3"
              />
              <path d="M 114 168 L 126 168" stroke="#FF7A9E" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}
          {equipped.body === 'sailor_collar' && (
            <g>
              <path
                d="M 74 146 L 120 162 L 166 146 L 172 184 L 120 194 L 68 184 Z"
                fill="#5D9CEC"
                stroke="#5A3E36"
                strokeWidth="3.8"
                strokeLinejoin="round"
              />
              <path
                d="M 78 174 L 120 184 L 162 174"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
              <path
                d="M 108 158 L 120 165 L 132 158 L 127 174 L 120 167 L 113 174 Z"
                fill="#FF6B8B"
                stroke="#5A3E36"
                strokeWidth="2.8"
                strokeLinejoin="round"
              />
            </g>
          )}
          {equipped.body === 'hero_cape' && (
            <g>
              <path
                d="M 76 150 Q 120 165 164 150"
                fill="none"
                stroke="#FFD54F"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M 120 152 L 123 158 L 130 159 L 125 164 L 126 171 L 120 168 L 114 171 L 115 164 L 110 159 L 117 158 Z"
                fill="#FFE066"
                stroke="#5A3E36"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
            </g>
          )}

          <ellipse cx="88" cy="194" rx="14" ry="10" fill={palette.limb} stroke="#5A3E36" strokeWidth="4" />
          <ellipse cx="152" cy="194" rx="14" ry="10" fill={palette.limb} stroke="#5A3E36" strokeWidth="4" />

          <ellipse
            cx="54"
            cy="148"
            rx="12"
            ry="16"
            transform={action === 'walking' ? 'rotate(25 54 148)' : 'rotate(16 54 148)'}
            fill={palette.body}
            stroke="#5A3E36"
            strokeWidth="4"
          />
          <ellipse
            cx="186"
            cy="148"
            rx="12"
            ry="16"
            transform={action === 'walking' ? 'rotate(-25 186 148)' : 'rotate(-16 186 148)'}
            fill={palette.body}
            stroke="#5A3E36"
            strokeWidth="4"
          />

          <ellipse
            cx="72"
            cy="132"
            rx={expression === 'shy' ? 16 : stage.level >= 3 ? 14 : 11}
            ry={expression === 'shy' ? 9.5 : stage.level >= 3 ? 8 : 6.5}
            fill={palette.blush}
            opacity={expression === 'shy' ? 0.88 : action === 'petted' || stage.level >= 3 ? 0.8 : 0.55}
          />
          <ellipse
            cx="168"
            cy="132"
            rx={expression === 'shy' ? 16 : stage.level >= 3 ? 14 : 11}
            ry={expression === 'shy' ? 9.5 : stage.level >= 3 ? 8 : 6.5}
            fill={palette.blush}
            opacity={expression === 'shy' ? 0.88 : action === 'petted' || stage.level >= 3 ? 0.8 : 0.55}
          />

          {expression === 'shy' && (
            <g stroke="#E85B7B" strokeWidth="2.2" strokeLinecap="round" opacity="0.8">
              <path d="M 65 130 L 68 135" />
              <path d="M 72 130 L 75 135" />
              <path d="M 164 130 L 167 135" />
              <path d="M 171 130 L 174 135" />
            </g>
          )}

          {eyesClosed ? (
            <g stroke="#4A3531" strokeWidth="4" strokeLinecap="round" fill="none">
              <path d="M 78 112 Q 87 118 96 112" />
              <path d="M 144 112 Q 153 118 162 112" />
            </g>
          ) : expression === 'ticklish' ? (
            <g stroke="#4A3531" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 78 106 L 94 112 L 78 118" />
              <path d="M 162 106 L 146 112 L 162 118" />
            </g>
          ) : expression === 'wink' ? (
            <g>
              <circle cx="87" cy="112" r="8" fill="#4A3531" />
              <circle cx="84.5" cy="109" r="3" fill="#FFFFFF" />
              <circle cx="90" cy="115" r="1.6" fill="#FFFFFF" />
              <path
                d="M 144 114 Q 153 103 162 114"
                stroke="#4A3531"
                strokeWidth="4.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          ) : expression === 'sparkle' ? (
            <g>
              <circle cx="87" cy="112" r="9" fill="#4A3531" />
              <path d="M 86 105 L 88 109 L 92 111 L 88 113 L 86 117 L 84 113 L 80 111 L 84 109 Z" fill="#FFF8B8" />
              <circle cx="91" cy="116" r="1.8" fill="#FFFFFF" />
              <circle cx="153" cy="112" r="9" fill="#4A3531" />
              <path d="M 152 105 L 154 109 L 158 111 L 154 113 L 152 117 L 150 113 L 146 111 L 150 109 Z" fill="#FFF8B8" />
              <circle cx="157" cy="116" r="1.8" fill="#FFFFFF" />
            </g>
          ) : happyArcEyes || expression === 'happyTongue' ? (
            <g stroke="#4A3531" strokeWidth="4.2" strokeLinecap="round" fill="none">
              <path d="M 78 114 Q 87 103 96 114" />
              <path d="M 144 114 Q 153 103 162 114" />
            </g>
          ) : (
            <g>
              <circle cx="87" cy="112" r="8" fill="#4A3531" />
              <circle cx="84.5" cy="109" r="3" fill="#FFFFFF" />
              {stage.level >= 3 && <circle cx="90" cy="115" r="1.6" fill="#FFFFFF" />}
              <circle cx="153" cy="112" r="8" fill="#4A3531" />
              <circle cx="150.5" cy="109" r="3" fill="#FFFFFF" />
              {stage.level >= 3 && <circle cx="156" cy="115" r="1.6" fill="#FFFFFF" />}
            </g>
          )}

          {action === 'stuffed' && (
            <path
              d="M 184 94 Q 192 106 184 112 Q 176 106 184 94 Z"
              fill="#A5E7F5"
              stroke="#5A3E36"
              strokeWidth="2.5"
            />
          )}

          {/* Species-specific Nose & Muzzle */}
          {species === 'rabbit' ? (
            <g>
              {/* Soft whiskers */}
              <g stroke="#C6A9A2" strokeWidth="2.4" strokeLinecap="round">
                <path d="M 60 128 L 76 130" />
                <path d="M 59 136 L 75 135" />
                <path d="M 164 130 L 180 128" />
                <path d="M 165 135 L 181 136" />
              </g>
              {/* Cute pink triangle bunny nose */}
              <path
                d="M 113 124 Q 120 121 127 124 Q 124 133 120 133 Q 116 133 113 124 Z"
                fill="#FF85A6"
                stroke="#5A3E36"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </g>
          ) : species === 'dog' ? (
            <g>
              {/* Cream puppy muzzle patch */}
              <ellipse cx="120" cy="134" rx="23" ry="15" fill="#FFF8E6" />
              {/* Cute brown puppy nose */}
              <ellipse
                cx="120"
                cy="126"
                rx="10"
                ry="7"
                fill="#5A3E36"
              />
              <ellipse cx="117" cy="124" rx="3" ry="1.8" fill="#8C675B" />
            </g>
          ) : (
            <g>
              <ellipse
                cx="120"
                cy="128"
                rx="27"
                ry="19"
                fill="#FF90AE"
                stroke="#5A3E36"
                strokeWidth="4"
              />
              <ellipse cx="110" cy="128" rx="4.2" ry="6.2" fill="#5A3E36" />
              <ellipse cx="130" cy="128" rx="4.2" ry="6.2" fill="#5A3E36" />
            </g>
          )}

          {/* Mouth: Wide open -> chewing -> stuffed -> sleeping -> expression -> smile */}
          {action === 'opening' ? (
            <ellipse
              cx="120"
              cy="155"
              rx="12"
              ry="10"
              fill="#E85B7B"
              stroke="#5A3E36"
              strokeWidth="3.6"
            />
          ) : action === 'eating' ? (
            <ellipse
              cx="120"
              cy="154"
              rx={chewTick ? 10 : 6.5}
              ry={chewTick ? 7.5 : 4}
              fill="#E85B7B"
              stroke="#5A3E36"
              strokeWidth="3.4"
            />
          ) : action === 'stuffed' ? (
            <path
              d="M 110 154 Q 115 149 120 154 Q 125 159 130 154"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          ) : action === 'sleeping' ? (
            <circle cx="120" cy="153" r="3.4" fill="#5A3E36" />
          ) : expression === 'happyTongue' ? (
            <g>
              <path
                d="M 108 148 Q 120 158 132 148"
                fill="none"
                stroke="#5A3E36"
                strokeWidth="3.6"
                strokeLinecap="round"
              />
              <path
                d="M 114 152 Q 120 167 126 152 Z"
                fill="#FF7A9E"
                stroke="#5A3E36"
                strokeWidth="2.8"
              />
            </g>
          ) : expression === 'ticklish' ? (
            <path
              d="M 106 151 Q 113 145 120 151 Q 127 157 134 151"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          ) : expression === 'shy' ? (
            <path
              d="M 114 152 Q 120 156 126 152"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          ) : species === 'rabbit' || species === 'dog' ? (
            <g>
              <path
                d="M 108 144 Q 114 150 120 142 Q 126 150 132 144"
                fill="none"
                stroke="#5A3E36"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {species === 'dog' && action === 'petted' && (
                <path
                  d="M 115 146 Q 120 160 125 146 Z"
                  fill="#FF7A9E"
                  stroke="#5A3E36"
                  strokeWidth="2.6"
                />
              )}
            </g>
          ) : (
            <path
              d="M 108 152 Q 120 163 132 152"
              fill="none"
              stroke="#5A3E36"
              strokeWidth="3.8"
              strokeLinecap="round"
            />
          )}

          {equipped.neck === 'baby_bib' && (
            <g>
              <path
                d="M 92 158 Q 120 170 148 158 Q 154 184 120 192 Q 86 184 92 158 Z"
                fill="#FFF0A5"
                stroke="#5A3E36"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="120" cy="176" r="5" fill="#FF7A9E" />
            </g>
          )}
          {equipped.neck === 'mint_bell_tie' && (
            <g>
              <path d="M 96 160 L 120 168 L 96 176 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="3.2" strokeLinejoin="round" />
              <path d="M 144 160 L 120 168 L 144 176 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="3.2" strokeLinejoin="round" />
              <circle cx="120" cy="172" r="7" fill="#FFE066" stroke="#5A3E36" strokeWidth="3" />
              <circle cx="120" cy="174" r="1.8" fill="#5A3E36" />
            </g>
          )}
          {equipped.neck === 'pearl_necklace' && (
            <g>
              <path d="M 88 158 Q 120 182 152 158" fill="none" stroke="#5A3E36" strokeWidth="2.2" />
              <circle cx="91" cy="161" r="4.8" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="101" cy="168" r="5" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="111" cy="172" r="5.2" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="120" cy="174" r="6" fill="#FFE6EA" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="129" cy="172" r="5.2" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="139" cy="168" r="5" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="149" cy="161" r="4.8" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
            </g>
          )}
          {equipped.neck === 'carrot_scarf' && (
            <g>
              <path
                d="M 86 158 Q 120 170 154 158 L 120 192 Z"
                fill="#FF8C42"
                stroke="#5A3E36"
                strokeWidth="3.2"
                strokeLinejoin="round"
              />
              <path
                d="M 102 166 L 120 180 L 138 166"
                fill="none"
                stroke="#FFF4D8"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <circle cx="120" cy="166" r="5.5" fill="#FF6B4A" stroke="#5A3E36" strokeWidth="2.8" />
            </g>
          )}
          {equipped.neck === 'lucky_clover_tie' && (
            <g transform="translate(120, 168)">
              <path
                d="M 0 0 C -14 -18 -30 -5 -16 0 C -30 5 -14 18 0 0 Z"
                fill="#68C98D"
                stroke="#5A3E36"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M 0 0 C 14 -18 30 -5 16 0 C 30 5 14 18 0 0 Z"
                fill="#82DB9F"
                stroke="#5A3E36"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="0" r="6" fill="#FFE066" stroke="#5A3E36" strokeWidth="2.8" />
            </g>
          )}
          {equipped.neck === 'anniversary_bib' && (
            <g>
              <path
                d="M 90 157 Q 120 171 150 157 Q 156 187 120 195 Q 84 187 90 157 Z"
                fill="#FFE1EC"
                stroke="#5A3E36"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M 97 180 Q 120 189 143 180"
                fill="none"
                stroke="#FFD54F"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M 120 168 L 122.5 173 L 128 173.8 L 124 177.5 L 125 183 L 120 180.2 L 115 183 L 116 177.5 L 112 173.8 L 117.5 173 Z"
                fill="#FFD54F"
                stroke="#5A3E36"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
            </g>
          )}

          {equipped.face === 'round_glasses' && (
            <g fill="none" stroke="#6B4423" strokeWidth="3.6">
              <circle cx="87" cy="112" r="15" fill="#FFFFFF" fillOpacity="0.22" />
              <circle cx="153" cy="112" r="15" fill="#FFFFFF" fillOpacity="0.22" />
              <path d="M 102 112 Q 120 107 138 112" />
              <path d="M 65 110 L 72 112" />
              <path d="M 168 112 L 175 110" />
            </g>
          )}
          {equipped.face === 'star_blush' && (
            <g fill="#FFE066" stroke="#5A3E36" strokeWidth="2">
              <path d="M 68 122 L 71 128 L 77 129 L 72 133 L 73 139 L 68 136 L 63 139 L 64 133 L 59 129 L 65 128 Z" />
              <path d="M 172 122 L 175 128 L 181 129 L 176 133 L 177 139 L 172 136 L 167 139 L 168 133 L 163 129 L 169 128 Z" />
            </g>
          )}
          {equipped.face === 'heart_shades' && (
            <g stroke="#5A3E36" strokeWidth="3">
              <path
                d="M 87 124 C 72 115 70 101 81 101 C 85 101 87 105 87 106 C 87 105 89 101 93 101 C 104 101 102 115 87 124 Z"
                fill="#FF6B9A"
              />
              <path
                d="M 153 124 C 138 115 136 101 147 101 C 151 101 153 105 153 106 C 153 105 155 101 159 101 C 170 101 168 115 153 124 Z"
                fill="#FF6B9A"
              />
              <path d="M 101 108 L 139 108" fill="none" strokeWidth="3.5" />
            </g>
          )}
          {equipped.face === 'bandaid_cute' && (
            <g transform="translate(70, 126) rotate(-18)">
              <rect x="-12" y="-5" width="24" height="10" rx="5" fill="#FFB2C8" stroke="#5A3E36" strokeWidth="2.6" />
              <rect x="-4" y="-4" width="8" height="8" rx="1.5" fill="#FFF7EC" stroke="#5A3E36" strokeWidth="1.8" />
            </g>
          )}
          {equipped.face === 'monocle_gold' && (
            <g>
              <circle cx="153" cy="112" r="15" fill="#FFF7D6" fillOpacity="0.28" stroke="#D99B26" strokeWidth="3.6" />
              <path d="M 167 118 Q 172 132 167 144" fill="none" stroke="#D99B26" strokeWidth="2.6" strokeLinecap="round" />
            </g>
          )}
          {equipped.face === 'pilot_goggles' && (
            <g>
              <path d="M 55 110 L 66 110 M 174 110 L 185 110" stroke="#8D5B34" strokeWidth="5.2" strokeLinecap="round" />
              <rect
                x="66"
                y="97"
                width="40"
                height="29"
                rx="11"
                fill="#7ED4F7"
                fillOpacity="0.6"
                stroke="#8D5B34"
                strokeWidth="4.6"
              />
              <rect
                x="134"
                y="97"
                width="40"
                height="29"
                rx="11"
                fill="#7ED4F7"
                fillOpacity="0.6"
                stroke="#8D5B34"
                strokeWidth="4.6"
              />
              <path d="M 106 110 Q 120 106 134 110" fill="none" stroke="#5A3E36" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M 74 104 L 82 112" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.88" />
              <path d="M 142 104 L 150 112" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" opacity="0.88" />
            </g>
          )}

          {equipped.head === 'pink_bow' && (
            <g transform="translate(120, 68)">
              <path d="M 0 0 L -24 -12 Q -28 2 -22 12 Z" fill="#FF6B9A" stroke="#5A3E36" strokeWidth="3.5" strokeLinejoin="round" />
              <path d="M 0 0 L 24 -12 Q 28 2 22 12 Z" fill="#FF6B9A" stroke="#5A3E36" strokeWidth="3.5" strokeLinejoin="round" />
              <circle cx="0" cy="0" r="8" fill="#FFE082" stroke="#5A3E36" strokeWidth="3.5" />
            </g>
          )}
          {equipped.head === 'strawberry_clip' && (
            <g transform="translate(152, 74) rotate(16)">
              <path d="M 0 -10 C 12 -10 14 4 0 14 C -14 4 -12 -10 0 -10 Z" fill="#FF5C8D" stroke="#5A3E36" strokeWidth="3.2" />
              <path d="M -8 -10 Q 0 -16 8 -10 Q 0 -6 -8 -10 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="2.5" />
              <circle cx="-3" cy="-1" r="1.5" fill="#FFF8E1" />
              <circle cx="4" cy="1" r="1.5" fill="#FFF8E1" />
              <circle cx="0" cy="6" r="1.5" fill="#FFF8E1" />
            </g>
          )}
          {equipped.head === 'mini_crown' && (
            <g transform="translate(120, 62)">
              <path
                d="M -22 12 L -26 -10 L -10 2 L 0 -14 L 10 2 L 26 -10 L 22 12 Z"
                fill="#FFD54F"
                stroke="#5A3E36"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="4" r="3.5" fill="#FF6B9A" />
            </g>
          )}
          {equipped.head === 'chef_hat' && (
            <g transform="translate(120, 56)">
              <path
                d="M -24 14 C -36 0 -22 -22 -6 -16 C 0 -28 16 -26 18 -14 C 32 -16 36 4 24 14 Z"
                fill="#FFFFFF"
                stroke="#5A3E36"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <rect x="-22" y="10" width="44" height="10" rx="4" fill="#FFF5DA" stroke="#5A3E36" strokeWidth="3.2" />
            </g>
          )}
          {equipped.head === 'beret_hat' && (
            <g transform="translate(120, 68)">
              <path d="M 0 -22 L 3 -29" stroke="#5A3E36" strokeWidth="3.5" strokeLinecap="round" />
              <ellipse cx="0" cy="-6" rx="30" ry="14" fill="#C97E49" stroke="#5A3E36" strokeWidth="3.5" />
              <path d="M -24 4 Q 0 12 24 4" fill="none" stroke="#5A3E36" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}
          {equipped.head === 'sprout_clip' && (
            <g transform="translate(120, 68)">
              <path d="M 0 6 L 0 -12" stroke="#5A3E36" strokeWidth="3.6" strokeLinecap="round" />
              <path d="M 0 -10 C -5 -26 -24 -26 -22 -12 C -20 -2 -5 -2 0 -10 Z" fill="#6CD4B5" stroke="#5A3E36" strokeWidth="3.2" />
              <path d="M 0 -12 C 5 -28 24 -28 22 -14 C 20 -4 5 -4 0 -12 Z" fill="#95E8C9" stroke="#5A3E36" strokeWidth="3.2" />
            </g>
          )}
          {equipped.head === 'crystal_crown' && (
            <g transform="translate(120, 62)">
              <path
                d="M -24 12 L -28 -11 L -12 0 L 0 -18 L 12 0 L 28 -11 L 24 12 Z"
                fill="#FFD54F"
                stroke="#5A3E36"
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
              <path d="M -21 6 L 21 6" stroke="#F4B400" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="-28" cy="-13" r="3.4" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="0" cy="-20" r="3.8" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <circle cx="28" cy="-13" r="3.4" fill="#FFFDF7" stroke="#5A3E36" strokeWidth="2.4" />
              <polygon points="0,-5 5,1 0,7 -5,1" fill="#6EC6FF" stroke="#5A3E36" strokeWidth="2" />
              <circle cx="-13" cy="4" r="2.8" fill="#FF6B9A" />
              <circle cx="13" cy="4" r="2.8" fill="#FF6B9A" />
            </g>
          )}
          {equipped.head === 'bunny_flower_crown' && (
            <g transform="translate(120, 72)">
              <path d="M -32 6 Q 0 -6 32 6" fill="none" stroke="#68B984" strokeWidth="4.6" strokeLinecap="round" />
              <ellipse cx="-26" cy="3" rx="6" ry="3.2" transform="rotate(-28 -26 3)" fill="#7EDBC0" stroke="#5A3E36" strokeWidth="2.2" />
              <ellipse cx="26" cy="3" rx="6" ry="3.2" transform="rotate(28 26 3)" fill="#7EDBC0" stroke="#5A3E36" strokeWidth="2.2" />
              <g transform="translate(-16, -1)">
                <circle cx="0" cy="-4.5" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="4.5" cy="0" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="-4.5" cy="0" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="4.5" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#FFE066" />
              </g>
              <g transform="translate(0, -4)">
                <circle cx="0" cy="-5" r="4.2" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="5" cy="0" r="4.2" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="-5" cy="0" r="4.2" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="5" r="4.2" fill="#FFB8D0" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3.2" fill="#FFE066" />
              </g>
              <g transform="translate(16, -1)">
                <circle cx="0" cy="-4.5" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="4.5" cy="0" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="-4.5" cy="0" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="4.5" r="3.8" fill="#FF9EBB" stroke="#5A3E36" strokeWidth="1.8" />
                <circle cx="0" cy="0" r="3" fill="#FFE066" />
              </g>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
};
