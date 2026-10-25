import React from 'react';
import { PlayerAvatar } from '../../types/game';

interface AvatarDisplayProps {
  avatar?: PlayerAvatar;
  size?: number; // size in px
  className?: string;
  showCrown?: boolean;
}

export const AVATAR_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow/orange
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#64748b', // slate
];

export const TOTAL_EYES = 6;
export const TOTAL_MOUTHS = 6;

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatar = { color: '#3b82f6', eyes: 0, mouth: 0 },
  size = 48,
  className = '',
  showCrown = false,
}) => {
  const { color = '#3b82f6', eyes = 0, mouth = 0 } = avatar;

  const renderEyes = () => {
    switch (eyes % TOTAL_EYES) {
      case 1:
        // Cool sunglasses
        return (
          <g fill="#18181b">
            <rect x="22" y="36" width="22" height="14" rx="4" />
            <rect x="56" y="36" width="22" height="14" rx="4" />
            <rect x="42" y="40" width="16" height="3" />
          </g>
        );
      case 2:
        // Wink ;)
        return (
          <g stroke="#18181b" strokeWidth="4" strokeLinecap="round" fill="none">
            <circle cx="34" cy="42" r="5" fill="#18181b" />
            <path d="M 56 42 Q 66 38 74 44" />
          </g>
        );
      case 3:
        // Big happy eyes with sparkles
        return (
          <g fill="#18181b">
            <circle cx="34" cy="42" r="7" />
            <circle cx="66" cy="42" r="7" />
            <circle cx="36" cy="39" r="2.5" fill="#ffffff" />
            <circle cx="68" cy="39" r="2.5" fill="#ffffff" />
          </g>
        );
      case 4:
        // Sleepy / chill eyes
        return (
          <g stroke="#18181b" strokeWidth="4" strokeLinecap="round" fill="none">
            <path d="M 26 44 Q 34 38 42 44" />
            <path d="M 58 44 Q 66 38 74 44" />
          </g>
        );
      case 5:
        // Starry eyes
        return (
          <g fill="#fbbf24" stroke="#d97706" strokeWidth="1.5">
            <polygon points="34,34 36,40 42,40 37,44 39,50 34,46 29,50 31,44 26,40 32,40" />
            <polygon points="66,34 68,40 74,40 69,44 71,50 66,46 61,50 63,44 58,40 64,40" />
          </g>
        );
      default:
        // Standard cartoon dots
        return (
          <g fill="#18181b">
            <circle cx="34" cy="42" r="5" />
            <circle cx="66" cy="42" r="5" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (mouth % TOTAL_MOUTHS) {
      case 1:
        // Big open grin with teeth
        return (
          <g>
            <path d="M 32 62 Q 50 82 68 62 Z" fill="#ffffff" stroke="#18181b" strokeWidth="3" />
            <path d="M 32 62 Q 50 66 68 62" stroke="#18181b" strokeWidth="3" fill="none" />
          </g>
        );
      case 2:
        // Tongue sticking out :P
        return (
          <g>
            <path d="M 34 62 Q 50 74 66 62" stroke="#18181b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 46 66 Q 50 80 56 66 Z" fill="#f43f5e" stroke="#18181b" strokeWidth="2" />
          </g>
        );
      case 3:
        // Silly moustache
        return (
          <g fill="#27272a">
            <path d="M 32 62 C 40 56, 46 68, 50 62 C 54 68, 60 56, 68 62 C 64 68, 56 68, 50 64 C 44 68, 36 68, 32 62 Z" />
          </g>
        );
      case 4:
        // Surprised 'O' mouth
        return (
          <ellipse cx="50" cy="65" rx="7" ry="9" fill="#18181b" />
        );
      case 5:
        // Cool smirk
        return (
          <path d="M 36 64 Q 52 64 66 58" stroke="#18181b" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        );
      default:
        // Classic pleasant smile
        return (
          <path d="M 34 62 Q 50 74 66 62" stroke="#18181b" strokeWidth="4" strokeLinecap="round" fill="none" />
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="w-full h-full drop-shadow-sm select-none"
      >
        {/* Drop shadow ring */}
        <circle cx="50" cy="52" r="44" fill="rgba(0, 0, 0, 0.12)" />

        {/* Head Base */}
        <circle cx="50" cy="50" r="44" fill={color} stroke="#18181b" strokeWidth="4" />

        {/* Cheeks / Blush */}
        <circle cx="24" cy="54" r="5" fill="rgba(255, 255, 255, 0.35)" />
        <circle cx="76" cy="54" r="5" fill="rgba(255, 255, 255, 0.35)" />

        {/* Eyes & Mouth */}
        {renderEyes()}
        {renderMouth()}
      </svg>

      {/* Host / Winner Crown */}
      {showCrown && (
        <span
          className="absolute -top-3 -right-2 text-xl filter drop-shadow animate-bounce"
          title="Host / Leader"
        >
          👑
        </span>
      )}
    </div>
  );
};
