import React from 'react';
import {
  FLOORING_BY_ID,
  ROOM_GRID_COLS,
  ROOM_GRID_ROWS,
  ROOM_ITEM_BY_ID,
  ROOM_PHOTO_POSES,
  WALLPAPER_BY_ID,
} from '../../data/house';
import { RoomPhotoRecord } from '../../types';
import { PiggyCharacter } from '../PiggyCharacter';
import { FurnitureGraphic } from './FurnitureGraphic';

interface RoomPhotoCardProps {
  photo: RoomPhotoRecord;
  compact?: boolean;
}

export const RoomPhotoCard: React.FC<RoomPhotoCardProps> = ({ photo, compact = false }) => {
  const wall = WALLPAPER_BY_ID[photo.wallpaperId] ?? WALLPAPER_BY_ID.cream_warm;
  const floor = FLOORING_BY_ID[photo.flooringId] ?? FLOORING_BY_ID.oak_wood;
  const pose = ROOM_PHOTO_POSES.find((p) => p.id === photo.poseId) ?? ROOM_PHOTO_POSES[0];

  const cellMap = new Map<string, string>();
  for (const placed of photo.placedItems) {
    cellMap.set(`${placed.x}_${placed.y}`, placed.itemId);
  }

  const dateLabel = new Date(photo.createdAt).toLocaleString('zh-TW', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="rounded-3xl bg-[#FFFDF8] border-2 border-[#F2D9CF] p-2.5 shadow-sm overflow-hidden">
      <div className="rounded-2xl overflow-hidden border border-[#EAD5CC] relative">
        {/* Top Wallpaper Band */}
        <div
          className={`${compact ? 'h-12' : 'h-16'} px-2.5 pt-2 flex items-start justify-between relative`}
          style={{ background: wall.wallBgStyle }}
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/85 border border-[#E7CFC4] text-[10px] font-extrabold text-[#5A3E36] truncate max-w-[65%]">
            🪧 {photo.houseName}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-white/80 text-[10px] font-extrabold text-[#9D5B12]">
            {pose.emoji} {pose.label}
          </span>
        </div>

        {/* Floor & 6x4 miniature furniture grid + posing Pet */}
        <div
          className={`relative ${compact ? 'p-1.5' : 'p-2.5'}`}
          style={{ background: floor.floorBgStyle }}
        >
          <div className="grid grid-cols-6 gap-1 opacity-95">
            {Array.from({ length: ROOM_GRID_ROWS * ROOM_GRID_COLS }, (_, idx) => {
              const x = idx % ROOM_GRID_COLS;
              const y = Math.floor(idx / ROOM_GRID_COLS);
              const itemId = cellMap.get(`${x}_${y}`);
              const itemDef = itemId ? ROOM_ITEM_BY_ID[itemId] : null;
              return (
                <div
                  key={`${x}_${y}`}
                  className={`${
                    compact ? 'h-6' : 'h-9'
                  } rounded-lg flex items-center justify-center bg-white/25 border border-white/35`}
                  title={itemDef?.name}
                >
                  {itemId && <FurnitureGraphic itemId={itemId} size={compact ? 22 : 30} />}
                </div>
              );
            })}
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="drop-shadow-md">
              <PiggyCharacter
                species={photo.species}
                growth={60}
                roundness={36}
                action={pose.action}
                expression={pose.expression}
                equipped={photo.equipped}
                interactive={false}
                customAnimClass={pose.animClass}
                size={compact ? 72 : 104}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pt-2 px-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-extrabold text-[#4A3531] truncate">{photo.title}</h4>
          <span className="text-[10px] font-bold text-[#957B74] tabular-nums shrink-0">
            {dateLabel}
          </span>
        </div>
        {photo.caption && (
          <p className="text-[11px] font-medium text-[#6E544E] leading-snug break-words">
            {photo.caption}
          </p>
        )}
        {photo.noteHighlight && !compact && (
          <p className="text-[10px] font-bold text-[#B83B64] truncate">
            💌 「{photo.noteHighlight}」
          </p>
        )}
      </div>
    </article>
  );
};
