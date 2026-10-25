import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Player } from '../../types/game';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface GameOverModalProps {
  winner: Player | null;
  leaderboard: Player[];
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  isHost: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  leaderboard,
  onPlayAgain,
  onReturnToLobby,
  isHost,
}) => {
  useEffect(() => {
    // Fire celebratory confetti burst
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 300);
    } catch {
      // safe fallback if canvas context is restricted
    }
  }, []);

  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-amber-400 p-6 max-w-lg w-full text-center space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shadow-md mb-2">
            <Trophy size={36} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">Game Over!</h2>
          <p className="text-sm font-semibold text-slate-500">
            {winner ? (
              <span>
                🏆 <strong className="text-amber-600">{winner.name}</strong> wins the match!
              </span>
            ) : (
              'Great game everyone!'
            )}
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="flex items-end justify-center gap-3 pt-4">
          {/* 2nd place */}
          {top3[1] && (
            <div className="flex flex-col items-center">
              <AvatarDisplay avatar={top3[1].avatar} size={48} />
              <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] mt-1">
                {top3[1].name}
              </span>
              <span className="text-xs font-extrabold text-slate-500 font-mono">
                {top3[1].score} pts
              </span>
              <div className="w-20 bg-slate-200 rounded-t-lg h-20 flex items-center justify-center font-black text-slate-500 text-lg border-2 border-b-0 border-slate-300">
                2nd
              </div>
            </div>
          )}

          {/* 1st place */}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <AvatarDisplay avatar={top3[0].avatar} size={64} showCrown />
              <span className="text-sm font-black text-amber-700 truncate max-w-[100px] mt-1">
                {top3[0].name}
              </span>
              <span className="text-xs font-black text-amber-600 font-mono">
                {top3[0].score} pts
              </span>
              <div className="w-24 bg-amber-400 rounded-t-lg h-28 flex items-center justify-center font-black text-white text-2xl border-2 border-b-0 border-amber-500 shadow-md">
                1st
              </div>
            </div>
          )}

          {/* 3rd place */}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <AvatarDisplay avatar={top3[2].avatar} size={44} />
              <span className="text-xs font-bold text-slate-700 truncate max-w-[80px] mt-1">
                {top3[2].name}
              </span>
              <span className="text-xs font-extrabold text-slate-500 font-mono">
                {top3[2].score} pts
              </span>
              <div className="w-20 bg-amber-700/30 rounded-t-lg h-14 flex items-center justify-center font-black text-amber-900 text-base border-2 border-b-0 border-amber-700/40">
                3rd
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {isHost && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md border-2 border-emerald-600 transition-all"
            >
              <RotateCcw size={16} />
              Play Again
            </button>
          )}

          <button
            type="button"
            onClick={onReturnToLobby}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md border-2 border-sky-700 transition-all"
          >
            <Home size={16} />
            Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
