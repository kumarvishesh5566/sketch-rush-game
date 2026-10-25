import React, { useState, useEffect } from 'react';
import { PlayerAvatar, RoomSummary } from '../../types/game';
import { AvatarCustomizer } from '../Avatar/AvatarCustomizer';
import { api } from '../../services/api';
import {
  Sparkles,
  Zap,
  PlusCircle,
  LogIn,
  Trophy,
  Users,
  HelpCircle,
  RefreshCw,
  Palette,
} from 'lucide-react';

interface LobbyViewProps {
  playerName: string;
  onPlayerNameChange: (name: string) => void;
  avatar: PlayerAvatar;
  onAvatarChange: (avatar: PlayerAvatar) => void;
  onQuickPlay: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onOpenLeaderboard: () => void;
  initialRoomCode?: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  playerName,
  onPlayerNameChange,
  avatar,
  onAvatarChange,
  onQuickPlay,
  onCreateRoom,
  onJoinRoom,
  onOpenLeaderboard,
  initialRoomCode = '',
}) => {
  const [joinCode, setJoinCode] = useState(initialRoomCode);
  const [publicRooms, setPublicRooms] = useState<RoomSummary[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const fetchRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await api.getRooms();
      if (data.success && Array.isArray(data.rooms)) {
        setPublicRooms(data.rooms);
      }
    } catch {
      // safe fallback
    } finally {
      setLoadingRooms(false);
    }
  };

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    onJoinRoom(joinCode.trim());
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none py-2 px-4 space-y-6">
      {/* Game Title & Mascot Banner */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 bg-amber-400 text-amber-950 px-4 py-1 rounded-full font-black text-xs uppercase tracking-widest shadow-sm">
          <Sparkles size={14} /> MERN Multiplayer Drawing Game
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-2 drop-shadow-xs">
          <span className="text-sky-600">Sketch</span>
          <span className="text-amber-500">Rush</span>
          <Palette className="text-pink-500 hidden sm:inline" size={38} />
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-semibold max-w-md mx-auto">
          Draw in real time, guess words rapidly, and rise to the top of the leaderboard!
        </p>
      </div>

      {/* Invitation Alert if opened via share link */}
      {initialRoomCode && (
        <div className="w-full bg-amber-300 text-amber-950 px-4 py-2.5 rounded-2xl border-2 border-amber-400 font-bold text-xs sm:text-sm flex items-center justify-between shadow-sm animate-bounce">
          <div className="flex items-center gap-2">
            <span>🎉</span>
            <span>You&apos;ve been invited to Room <strong className="font-mono text-base underline">{initialRoomCode}</strong>! Choose your name and avatar below, then click Join!</span>
          </div>
          <button
            type="button"
            onClick={() => onJoinRoom(initialRoomCode)}
            className="px-3 py-1 bg-amber-950 text-white rounded-lg text-xs font-black shadow-xs hover:bg-black transition-colors"
          >
            Join Now
          </button>
        </div>
      )}

      {/* Center Setup Card */}
      <div className="w-full bg-white rounded-3xl shadow-xl border-4 border-sky-400 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Avatar Customizer & Nickname */}
        <div className="flex flex-col space-y-4">
          <div>
            <label htmlFor="player-name-input" className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Your Nickname
            </label>
            <input
              id="player-name-input"
              type="text"
              value={playerName}
              onChange={(e) => onPlayerNameChange(e.target.value)}
              placeholder="Enter your name..."
              maxLength={16}
              className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-slate-800 text-sm focus:border-sky-500 focus:bg-white focus:outline-none shadow-xs"
            />
          </div>

          <div>
            <span className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Customize Avatar
            </span>
            <AvatarCustomizer avatar={avatar} onChange={onAvatarChange} />
          </div>
        </div>

        {/* Right Column: Game Modes & Room Actions */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="block text-xs font-black text-slate-700 uppercase tracking-wider">
              Play Game
            </span>

            {/* Quick Play Button */}
            <button
              type="button"
              onClick={onQuickPlay}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-black text-base rounded-2xl shadow-md border-2 border-emerald-600 transition-all uppercase tracking-wide group"
            >
              <Zap size={20} className="fill-current group-hover:scale-110 transition-transform" />
              Quick Play (Instant Match)
            </button>

            {/* Create Custom Room */}
            <button
              type="button"
              onClick={onCreateRoom}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-black text-base rounded-2xl shadow-md border-2 border-sky-600 transition-all uppercase tracking-wide"
            >
              <PlusCircle size={20} />
              Create Room (Custom Settings)
            </button>

            {/* Join by Code Form */}
            <form onSubmit={handleJoinSubmit} className="pt-1">
              <label htmlFor="room-code-input" className="block text-xs font-bold text-slate-600 mb-1">
                Have a Room Code or Link?
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="room-code-input"
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A9B2X7"
                  maxLength={10}
                  className="flex-1 px-3 py-2 bg-slate-50 border-2 border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 uppercase focus:border-sky-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!joinCode.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-slate-300 text-amber-950 font-black text-xs rounded-xl shadow-xs border-2 border-amber-600 transition-all uppercase"
                >
                  <LogIn size={15} />
                  Join
                </button>
              </div>
            </form>
          </div>

          {/* Hall of Fame & Tutorial Footer */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onOpenLeaderboard}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl border border-amber-300 font-bold text-xs transition-colors"
            >
              <Trophy size={15} className="text-amber-500" />
              Hall of Fame
            </button>

            <button
              type="button"
              onClick={() => setShowHowToPlay(!showHowToPlay)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 font-bold text-xs transition-colors"
            >
              <HelpCircle size={15} />
              How to Play
            </button>
          </div>
        </div>
      </div>

      {/* How to Play Accordion */}
      {showHowToPlay && (
        <div className="w-full bg-sky-50 border-2 border-sky-300 rounded-2xl p-4 text-xs text-slate-700 space-y-2 animate-in fade-in duration-150">
          <h3 className="font-extrabold text-sky-900 text-sm flex items-center gap-1.5">
            <Sparkles size={16} /> How Sketch Rush Works:
          </h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Drawing Turn:</strong> When it is your turn to draw, pick 1 of the 3 secret words. Use brush, sizes, colors, and bucket fill to sketch it!</li>
            <li><strong>Guessing:</strong> When others draw, type your guesses in the chat box. Correct guesses award points based on how quickly you guess!</li>
            <li><strong>Close Guesses:</strong> If you are within 1 or 2 letters, the game will notify you that you are close!</li>
            <li><strong>Hints:</strong> Over time, blank spaces reveal letters to help guessers.</li>
          </ul>
        </div>
      )}

      {/* Public Rooms Section */}
      <div className="w-full bg-white/90 backdrop-blur-xs rounded-2xl border-2 border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-sky-600" />
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Active Public Rooms ({publicRooms.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={fetchRooms}
            title="Refresh rooms list"
            aria-label="Refresh public rooms list"
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
          >
            <RefreshCw size={14} className={loadingRooms ? 'animate-spin' : ''} />
          </button>
        </div>

        {publicRooms.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs italic">
            No public rooms currently active. Click &quot;Quick Play&quot; to start a new room!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="flex items-center justify-between p-3 bg-slate-50 hover:bg-sky-50/50 rounded-xl border border-slate-200 transition-all"
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-sky-800">
                      {room.code}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        room.phase === 'lobby'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {room.phase === 'lobby' ? 'In Lobby' : 'Playing'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {room.playerCount}/{room.maxPlayers} players • {room.category}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onJoinRoom(room.code)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 active:scale-95 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
