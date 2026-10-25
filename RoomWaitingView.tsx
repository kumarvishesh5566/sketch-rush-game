import React, { useState } from 'react';
import { Player, RoomSettings } from '../../types/game';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import {
  Copy,
  Check,
  Play,
  Sliders,
  LogOut,
  Bot,
  Users,
  Clock,
  Sparkles,
  Shield,
  Share2,
} from 'lucide-react';

interface RoomWaitingViewProps {
  roomCode: string;
  players: Player[];
  settings: RoomSettings;
  currentPlayerId: string;
  isHost: boolean;
  onStartGame: () => void;
  onOpenSettings: () => void;
  onToggleBot: () => void;
  onLeaveRoom: () => void;
  onKickPlayer?: (targetPlayerId: string) => void;
}

export const RoomWaitingView: React.FC<RoomWaitingViewProps> = ({
  roomCode,
  players,
  settings,
  currentPlayerId,
  isHost,
  onStartGame,
  onOpenSettings,
  onToggleBot,
  onLeaveRoom,
  onKickPlayer,
}) => {
  const [copied, setCopied] = useState(false);
  const hasBot = players.some((p) => p.isBot);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?room=${roomCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border-4 border-sky-400 overflow-hidden flex flex-col select-none">
      {/* Top Header */}
      <div className="bg-sky-600 px-6 py-4 text-white flex flex-wrap items-center justify-between gap-3 border-b-4 border-sky-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-wide">Waiting Lobby</h2>
            <p className="text-xs text-sky-100 font-medium">
              Players are gathering... Room Code:{' '}
              <span className="font-mono font-bold text-amber-300">{roomCode}</span>
            </p>
          </div>
        </div>

        {/* Share / Copy button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            aria-label="Copy invite link"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-700 hover:bg-sky-850 active:scale-95 text-sky-100 text-xs font-bold rounded-xl border border-sky-400/50 shadow-xs transition-all"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Share2 size={15} />}
            <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
          </button>

          <button
            type="button"
            onClick={onLeaveRoom}
            aria-label="Leave room"
            className="p-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl shadow-xs transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Players Grid */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <span>Players in Room</span>
              <span className="bg-sky-100 text-sky-800 text-xs px-2 py-0.5 rounded-full font-mono">
                {players.length} / {settings.maxPlayers}
              </span>
            </h3>

            {/* Quick Bot Toggle */}
            <button
              type="button"
              onClick={onToggleBot}
              aria-label="Toggle AI Bot Player"
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                hasBot
                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <Bot size={14} />
              <span>{hasBot ? 'Remove Bot' : '+ Add Bot (Solo Test)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 min-h-[200px]">
            {players.map((player) => {
              const isMe = player.id === currentPlayerId;

              return (
                <div
                  key={player.id}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-transform hover:-translate-y-0.5 ${
                    isMe
                      ? 'bg-sky-50 border-sky-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 shadow-xs'
                  }`}
                >
                  {/* Host badge */}
                  {player.isHost && (
                    <span
                      title="Room Host"
                      className="absolute top-2 left-2 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold flex items-center gap-0.5"
                    >
                      <Shield size={11} /> Host
                    </span>
                  )}

                  {/* Kick button (host can kick other non-host players) */}
                  {isHost && !isMe && onKickPlayer && (
                    <button
                      type="button"
                      onClick={() => onKickPlayer(player.id)}
                      title={`Kick ${player.name}`}
                      aria-label={`Kick ${player.name}`}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600 p-0.5 rounded"
                    >
                      ×
                    </button>
                  )}

                  <AvatarDisplay avatar={player.avatar} size={54} />

                  <span className="text-xs font-black text-slate-800 mt-2 truncate max-w-full">
                    {player.name} {isMe && '(You)'}
                  </span>

                  {player.isBot && (
                    <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-1.5 rounded mt-0.5">
                      Bot Player
                    </span>
                  )}
                </div>
              );
            })}

            {/* Empty player slots */}
            {Array.from({ length: Math.max(0, 3 - players.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-semibold"
              >
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300 mb-2">
                  ?
                </div>
                <span>Waiting...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Settings Card & Actions */}
        <div className="bg-sky-50/70 p-4 rounded-2xl border-2 border-sky-200 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-sky-200">
              <span className="text-xs font-black text-sky-900 uppercase">Game Rules</span>
              {isHost && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900"
                >
                  <Sliders size={13} />
                  Edit
                </button>
              )}
            </div>

            <div className="space-y-2 text-xs font-medium text-slate-600">
              <div className="flex justify-between">
                <span>Rounds:</span>
                <span className="font-bold text-slate-800">{settings.rounds}</span>
              </div>
              <div className="flex justify-between">
                <span>Draw Time:</span>
                <span className="font-bold text-slate-800">{settings.drawTime}s</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-bold text-slate-800 capitalize">{settings.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Hints:</span>
                <span className="font-bold text-slate-800">{settings.hintsCount} letters</span>
              </div>
              <div className="flex justify-between">
                <span>Word Choices:</span>
                <span className="font-bold text-slate-800">{settings.wordChoicesCount}</span>
              </div>
              {settings.customWords && settings.customWords.length > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Custom Words:</span>
                  <span className="font-bold">{settings.customWords.length} words</span>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            {isHost ? (
              <>
                <button
                  type="button"
                  onClick={onStartGame}
                  disabled={players.length < 2}
                  className={`w-full flex items-center justify-center gap-2 py-3 font-black text-sm rounded-xl shadow-md border-2 transition-all uppercase tracking-wider ${
                    players.length >= 2
                      ? 'bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white border-emerald-600 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-80'
                  }`}
                >
                  <Play size={16} fill="currentColor" />
                  {players.length >= 2 ? 'Start Game!' : 'Need 2+ Players to Start'}
                </button>
                {players.length < 2 && (
                  <p className="text-[11px] text-amber-700 font-bold text-center bg-amber-50 p-2 rounded-lg border border-amber-200">
                    ⚠️ At least 2 players are required to play. Invite a friend via link or click <strong>&quot;+ Add Bot&quot;</strong>!
                  </p>
                )}
              </>
            ) : (
              <div className="text-center py-2 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs font-bold animate-pulse">
                Waiting for host to start the game...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
