import React from 'react';
import { PlayerAvatar } from '../../types/game';
import { AvatarDisplay, AVATAR_COLORS, TOTAL_EYES, TOTAL_MOUTHS } from './AvatarDisplay';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';

interface AvatarCustomizerProps {
  avatar: PlayerAvatar;
  onChange: (avatar: PlayerAvatar) => void;
}

export const AvatarCustomizer: React.FC<AvatarCustomizerProps> = ({ avatar, onChange }) => {
  const currentColorIdx = Math.max(0, AVATAR_COLORS.indexOf(avatar.color));

  const handlePrevColor = () => {
    const nextIdx = (currentColorIdx - 1 + AVATAR_COLORS.length) % AVATAR_COLORS.length;
    onChange({ ...avatar, color: AVATAR_COLORS[nextIdx] });
  };

  const handleNextColor = () => {
    const nextIdx = (currentColorIdx + 1) % AVATAR_COLORS.length;
    onChange({ ...avatar, color: AVATAR_COLORS[nextIdx] });
  };

  const handlePrevEyes = () => {
    const nextEyes = (avatar.eyes - 1 + TOTAL_EYES) % TOTAL_EYES;
    onChange({ ...avatar, eyes: nextEyes });
  };

  const handleNextEyes = () => {
    const nextEyes = (avatar.eyes + 1) % TOTAL_EYES;
    onChange({ ...avatar, eyes: nextEyes });
  };

  const handlePrevMouth = () => {
    const nextMouth = (avatar.mouth - 1 + TOTAL_MOUTHS) % TOTAL_MOUTHS;
    onChange({ ...avatar, mouth: nextMouth });
  };

  const handleNextMouth = () => {
    const nextMouth = (avatar.mouth + 1) % TOTAL_MOUTHS;
    onChange({ ...avatar, mouth: nextMouth });
  };

  const handleRandomize = () => {
    onChange({
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: Math.floor(Math.random() * TOTAL_EYES),
      mouth: Math.floor(Math.random() * TOTAL_MOUTHS),
    });
  };

  return (
    <div className="flex flex-col items-center bg-sky-50/70 p-4 rounded-2xl border-2 border-sky-200">
      <div className="relative mb-3">
        <AvatarDisplay avatar={avatar} size={88} />
        <button
          type="button"
          onClick={handleRandomize}
          title="Randomize avatar"
          aria-label="Randomize avatar"
          className="absolute -bottom-1 -right-1 bg-amber-400 hover:bg-amber-500 text-amber-950 p-1.5 rounded-full shadow border-2 border-white transition-transform active:scale-95"
        >
          <Shuffle size={14} />
        </button>
      </div>

      <div className="w-full space-y-2 text-xs font-semibold text-slate-700">
        {/* Color row */}
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="w-12 text-slate-500">Color</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevColor}
              aria-label="Previous color"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronLeft size={16} />
            </button>
            <div
              className="w-5 h-5 rounded-full border border-slate-400 shadow-xs"
              style={{ backgroundColor: avatar.color }}
            />
            <button
              type="button"
              onClick={handleNextColor}
              aria-label="Next color"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Eyes row */}
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="w-12 text-slate-500">Eyes</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevEyes}
              aria-label="Previous eyes"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-6 text-center text-slate-800">
              {avatar.eyes + 1}/{TOTAL_EYES}
            </span>
            <button
              type="button"
              onClick={handleNextEyes}
              aria-label="Next eyes"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Mouth row */}
        <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-xs">
          <span className="w-12 text-slate-500">Mouth</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevMouth}
              aria-label="Previous mouth"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="w-6 text-center text-slate-800">
              {avatar.mouth + 1}/{TOTAL_MOUTHS}
            </span>
            <button
              type="button"
              onClick={handleNextMouth}
              aria-label="Next mouth"
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
