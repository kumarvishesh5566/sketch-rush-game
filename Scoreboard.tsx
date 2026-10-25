import React from 'react';
import { Player } from '../../types/game';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { Pencil, CheckCircle2, Bot } from 'lucide-react';

interface ScoreboardProps {
  players: Player[];
  currentDrawerId: string | null;
  currentPlayerId: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  players,
  currentDrawerId,
  currentPlayerId,
}) => {
  // Sort players by total score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <aside className="w-56 sm:w-64 bg-white rounded-xl shadow-md border-2 border-slate-200 overflow-hidden flex flex-col select-none">
      <div className="bg-sky-600 px-3 py-2 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
        <span>Players ({players.length})</span>
        <span className="text-[10px] text-sky-200">Score</span>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5 space-y-1">
        {sorted.map((player, index) => {
          const isDrawer = player.id === currentDrawerId;
          const isMe = player.id === currentPlayerId;
          const hasGuessed = player.hasGuessed;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                isMe ? 'bg-sky-50 border border-sky-300' : 'hover:bg-slate-50'
              } ${hasGuessed ? 'bg-emerald-50/70 border border-emerald-200' : ''}`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-black text-slate-400 w-4 text-center">
                  #{index + 1}
                </span>

                <div className="relative">
                  <AvatarDisplay avatar={player.avatar} size={36} showCrown={player.isHost} />
                  {isDrawer && (
                    <span
                      title="Currently Drawing"
                      className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-0.5 rounded-full shadow-xs"
                    >
                      <Pencil size={11} />
                    </span>
                  )}
                  {hasGuessed && !isDrawer && (
                    <span
                      title="Guessed the word!"
                      className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs"
                    >
                      <CheckCircle2 size={11} />
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex flex-col">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isMe ? 'text-sky-900 font-extrabold' : 'text-slate-800'
                      }`}
                      title={player.name}
                    >
                      {player.name}
                    </span>
                    {player.isBot && (
                      <span className="text-[10px] bg-purple-100 text-purple-700 font-semibold px-1 py-0.2 rounded">
                        BOT
                      </span>
                    )}
                  </div>
                  {hasGuessed && (
                    <span className="text-[10px] font-bold text-emerald-600">
                      Guessed!
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end">
                <span className="text-xs font-extrabold text-slate-800 font-mono">
                  {player.score}
                </span>
                {player.roundScore > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 animate-pulse">
                    +{player.roundScore}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
