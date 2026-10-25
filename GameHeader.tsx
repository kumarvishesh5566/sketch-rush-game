import React, { useState } from 'react';
import { GameState } from '../../types/game';
import { Clock, Copy, Check, LogOut } from 'lucide-react';

interface GameHeaderProps {
  gameState: GameState;
  isDrawer: boolean;
  onLeave: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameState, isDrawer, onLeave }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timerColor =
    gameState.timeLeft <= 10
      ? 'text-rose-600 bg-rose-50 border-rose-400 animate-pulse'
      : gameState.timeLeft <= 25
      ? 'text-amber-600 bg-amber-50 border-amber-300'
      : 'text-slate-800 bg-white border-slate-300';

  return (
    <header className="w-full bg-sky-700 text-white px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between gap-3 select-none">
      {/* Left: Round & Timer */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-200">
            Round
          </span>
          <span className="text-base font-extrabold text-white">
            {gameState.currentRound} / {gameState.totalRounds}
          </span>
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 font-mono font-extrabold text-lg shadow-inner ${timerColor}`}
        >
          <Clock size={18} />
          <span>{gameState.timeLeft}s</span>
        </div>
      </div>

      {/* Center: Word Banner / Hints */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
        {gameState.phase === 'drawing' ? (
          <div>
            <div className="text-xl sm:text-2xl font-mono font-black tracking-widest text-amber-300 drop-shadow">
              {gameState.wordDisplay}
            </div>
            <div className="text-xs text-sky-200 font-medium">
              {isDrawer ? (
                <span className="text-emerald-300 font-bold">You are drawing!</span>
              ) : (
                <span>Word length: {gameState.wordLength} characters</span>
              )}
            </div>
          </div>
        ) : gameState.phase === 'selecting_word' ? (
          <div className="text-sm sm:text-base font-bold text-amber-200 animate-pulse">
            {isDrawer ? 'Pick a word below!' : `${gameState.drawerName || 'Drawer'} is choosing a word...`}
          </div>
        ) : gameState.phase === 'round_end' ? (
          <div className="text-sm sm:text-base font-bold text-emerald-300">
            Word was: <span className="font-extrabold underline">{gameState.currentWord}</span>
          </div>
        ) : (
          <div className="text-sm font-semibold text-sky-100">
            {gameState.wordDisplay}
          </div>
        )}
      </div>

      {/* Right: Room Code & Leave */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCode}
          title="Click to copy Room Code"
          aria-label="Copy room code"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-sky-800 hover:bg-sky-900 border border-sky-500 rounded-lg text-xs font-mono font-bold text-sky-100 transition-colors"
        >
          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          <span>{gameState.roomCode}</span>
        </button>

        <button
          type="button"
          onClick={onLeave}
          title="Leave Room"
          aria-label="Leave game room"
          className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
};
