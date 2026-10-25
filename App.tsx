/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getSocket } from './services/socket';
import {
  Player,
  PlayerAvatar,
  RoomSettings,
  GameState,
  Stroke,
  ChatMessage,
} from './types/game';
import { AVATAR_COLORS } from './components/Avatar/AvatarDisplay';
import { LobbyView } from './components/Lobby/LobbyView';
import { RoomWaitingView } from './components/Lobby/RoomWaitingView';
import { GameHeader } from './components/Game/GameHeader';
import { Scoreboard } from './components/Game/Scoreboard';
import { ChatBox } from './components/Game/ChatBox';
import { DrawingCanvas } from './components/Canvas/DrawingCanvas';
import { WordSelectModal } from './components/Modals/WordSelectModal';
import { GameOverModal } from './components/Modals/GameOverModal';
import { SettingsModal } from './components/Modals/SettingsModal';
import { LeaderboardModal } from './components/Modals/LeaderboardModal';

// Clean Web Audio synthesizer for cheerful game sounds (ding, tick, fanfare)
class GameAudio {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playCorrect() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch {
      // AudioContext safe catch
    }
  }

  public playTick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // AudioContext safe catch
    }
  }
}

const audio = new GameAudio();

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  rounds: 3,
  drawTime: 60,
  wordChoicesCount: 3,
  hintsCount: 2,
  category: 'mixed',
  wordMode: 'normal',
  customWords: [],
  isPrivate: false,
};

export default function App() {
  const socket = getSocket();

  // User profile
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('sketch_rush_player_name') || `Player_${Math.floor(100 + Math.random() * 900)}`;
  });
  const [avatar, setAvatar] = useState<PlayerAvatar>(() => {
    const saved = localStorage.getItem('sketch_rush_avatar');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      eyes: 0,
      mouth: 0,
    };
  });

  // Navigation & Room state
  const [urlRoomCode] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('room')?.toUpperCase() || '';
    }
    return '';
  });
  const [currentView, setCurrentView] = useState<'lobby' | 'waiting' | 'game'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [players, setPlayers] = useState<Player[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<string>('');

  // Game state
  const [gameState, setGameState] = useState<GameState>({
    roomId: '',
    roomCode: '',
    phase: 'lobby',
    currentRound: 1,
    totalRounds: 3,
    drawerId: null,
    drawerName: null,
    wordDisplay: '',
    timeLeft: 60,
    maxTime: 60,
    hintsRevealed: [],
  });

  // Canvas strokes & chat
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [incomingStroke, setIncomingStroke] = useState<Stroke | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);

  // Keep track of current user role
  const isHost = players.find((p) => p.id === myPlayerId)?.isHost ?? false;
  const isDrawer = gameState.drawerId === myPlayerId;
  const myPlayer = players.find((p) => p.id === myPlayerId);

  // Save profile changes
  const handlePlayerNameChange = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('sketch_rush_player_name', name);
  };

  const handleAvatarChange = (newAvatar: PlayerAvatar) => {
    setAvatar(newAvatar);
    localStorage.setItem('sketch_rush_avatar', JSON.stringify(newAvatar));
  };

  const showNotification = (msg: string) => {
    setStatusNotification(msg);
    setTimeout(() => setStatusNotification(null), 3500);
  };

  // Socket event subscriptions
  useEffect(() => {
    socket.on('players_update', (newPlayers: Player[]) => {
      setPlayers(newPlayers);
    });

    socket.on('game_state', (newState: GameState) => {
      setGameState(newState);
      if (newState.phase === 'lobby') {
        setCurrentView('waiting');
      } else {
        setCurrentView('game');
      }
    });

    socket.on('room_settings_updated', (updatedSettings: RoomSettings) => {
      setSettings(updatedSettings);
      showNotification('Room settings were updated by host');
    });

    socket.on('initial_strokes', (history: Stroke[]) => {
      setStrokes(history || []);
    });

    socket.on('initial_messages', (history: ChatMessage[]) => {
      setMessages(history || []);
    });

    socket.on('draw_data', (stroke: Stroke) => {
      setIncomingStroke(stroke);
      setStrokes((prev) => {
        if (prev.some((s) => s.id === stroke.id)) return prev;
        return [...prev, stroke];
      });
    });

    socket.on('draw_undo', () => {
      setStrokes((prev) => prev.slice(0, -1));
    });

    socket.on('canvas_clear', () => {
      setStrokes([]);
      setIncomingStroke(null);
    });

    socket.on('chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.type === 'correct') {
        audio.playCorrect();
      }
    });

    socket.on('kicked_notification', ({ reason }) => {
      showNotification(`You were removed from the room: ${reason}`);
      setCurrentView('lobby');
      setRoomCode('');
    });

    return () => {
      socket.off('players_update');
      socket.off('game_state');
      socket.off('room_settings_updated');
      socket.off('initial_strokes');
      socket.off('initial_messages');
      socket.off('draw_data');
      socket.off('draw_undo');
      socket.off('canvas_clear');
      socket.off('chat_message');
      socket.off('kicked_notification');
    };
  }, [socket]);

  // Autostart URL handling for automated testing or direct invite links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const autostart = params.get('autostart');
    const roomParam = params.get('room');

    if (autostart === '1') {
      // Auto-create room and add bot player so the game can be immediately inspected and played!
      socket.emit(
        'create_room',
        { hostName: playerName, avatar, settings: DEFAULT_SETTINGS },
        (res: any) => {
          if (res?.success) {
            setRoomCode(res.roomCode);
            setMyPlayerId(res.player?.id || '');
            setCurrentView('waiting');
            // Auto add bot and start
            socket.emit('toggle_bot');
            setTimeout(() => {
              socket.emit('start_game', {}, () => {});
            }, 800);
          }
        }
      );
    } else if (roomParam) {
      // Quick join requested room
      handleJoinRoom(roomParam);
    }
  }, []);

  // Actions
  const handleQuickPlay = () => {
    socket.emit(
      'quick_play',
      { playerName: playerName || 'Player', avatar },
      (res: any) => {
        if (res?.success) {
          setRoomCode(res.roomCode);
          setMyPlayerId(res.player?.id || '');
          setSettings(res.settings || DEFAULT_SETTINGS);
          if (res.players) setPlayers(res.players);
          setCurrentView('waiting');
        } else {
          showNotification(res?.error || 'Could not join quick play');
        }
      }
    );
  };

  const handleCreateRoom = () => {
    socket.emit(
      'create_room',
      { hostName: playerName || 'Player', avatar, settings },
      (res: any) => {
        if (res?.success) {
          setRoomCode(res.roomCode);
          setMyPlayerId(res.player?.id || '');
          setSettings(res.settings || DEFAULT_SETTINGS);
          if (res.players) setPlayers(res.players);
          setCurrentView('waiting');
        } else {
          showNotification(res?.error || 'Could not create room');
        }
      }
    );
  };

  const handleJoinRoom = (code: string) => {
    socket.emit(
      'join_room',
      { roomIdOrCode: code, playerName: playerName || 'Player', avatar },
      (res: any) => {
        if (res?.success) {
          setRoomCode(res.roomCode);
          setMyPlayerId(res.player?.id || '');
          setSettings(res.settings || DEFAULT_SETTINGS);
          if (res.players) setPlayers(res.players);
          setCurrentView('waiting');
        } else {
          showNotification(res?.error || 'Room not found. Check code.');
        }
      }
    );
  };

  const handleStartGame = () => {
    socket.emit('start_game', {}, (res: any) => {
      if (!res?.success) {
        showNotification(res?.error || 'Minimum 2 players are required to start the game.');
      }
    });
  };

  const handleToggleBot = () => {
    socket.emit('toggle_bot');
  };

  const handleKickPlayer = (targetPlayerId: string) => {
    socket.emit('kick_player', { targetPlayerId });
  };

  const handleSaveSettings = (newSettings: RoomSettings) => {
    setSettings(newSettings);
    socket.emit('update_settings', newSettings);
  };

  const handleSelectWord = (word: string) => {
    socket.emit('choose_word', { word });
  };

  const handleStrokeComplete = (stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);
    socket.emit('draw_stroke', stroke);
  };

  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
    socket.emit('draw_undo');
  };

  const handleClear = () => {
    setStrokes([]);
    setIncomingStroke(null);
    socket.emit('canvas_clear');
  };

  const handleSendMessage = (text: string) => {
    socket.emit('send_chat', { text });
  };

  const handleLeaveRoom = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 via-sky-300 to-indigo-300 text-slate-800 flex flex-col font-sans">
      {/* Toast Notification Banner */}
      {statusNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white font-bold text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700 animate-in fade-in slide-in-from-top-2">
          {statusNotification}
        </div>
      )}

      {/* Main Views */}
      <main className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 w-full">
        {currentView === 'lobby' && (
          <LobbyView
            playerName={playerName}
            onPlayerNameChange={handlePlayerNameChange}
            avatar={avatar}
            onAvatarChange={handleAvatarChange}
            onQuickPlay={handleQuickPlay}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            initialRoomCode={urlRoomCode}
          />
        )}

        {currentView === 'waiting' && (
          <RoomWaitingView
            roomCode={roomCode}
            players={players}
            settings={settings}
            currentPlayerId={myPlayerId}
            isHost={isHost}
            onStartGame={handleStartGame}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onToggleBot={handleToggleBot}
            onLeaveRoom={handleLeaveRoom}
            onKickPlayer={handleKickPlayer}
          />
        )}

        {currentView === 'game' && (
          <div className="w-full max-w-7xl flex flex-col space-y-3 h-[calc(100vh-2rem)] max-h-[920px]">
            {/* Header */}
            <GameHeader
              gameState={gameState}
              isDrawer={isDrawer}
              onLeave={handleLeaveRoom}
            />

            {/* Main Stage: Left Scoreboard, Center Canvas, Right Chat */}
            <div className="flex-1 flex flex-col lg:flex-row gap-3 min-h-0">
              {/* Scoreboard */}
              <div className="hidden sm:flex shrink-0">
                <Scoreboard
                  players={players}
                  currentDrawerId={gameState.drawerId}
                  currentPlayerId={myPlayerId}
                />
              </div>

              {/* Canvas Center */}
              <div className="flex-1 flex flex-col min-h-0">
                <DrawingCanvas
                  isDrawer={isDrawer}
                  onStrokeComplete={handleStrokeComplete}
                  onUndo={handleUndo}
                  onClear={handleClear}
                  currentStrokes={strokes}
                  incomingStroke={incomingStroke}
                />
              </div>

              {/* Chat & Guesses Right */}
              <div className="shrink-0 flex">
                <ChatBox
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  hasGuessed={myPlayer?.hasGuessed}
                  isDrawer={isDrawer}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Word Select Modal (for drawer during selecting_word phase) */}
      {isDrawer && gameState.phase === 'selecting_word' && gameState.wordChoices && (
        <WordSelectModal
          words={gameState.wordChoices}
          timeLeft={gameState.timeLeft}
          onSelectWord={handleSelectWord}
        />
      )}

      {/* Game Over Modal */}
      {gameState.phase === 'game_over' && (
        <GameOverModal
          winner={gameState.winner || null}
          leaderboard={gameState.leaderboard || players}
          onPlayAgain={handleStartGame}
          onReturnToLobby={handleLeaveRoom}
          isHost={isHost}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Hall of Fame Modal */}
      {isLeaderboardOpen && (
        <LeaderboardModal onClose={() => setIsLeaderboardOpen(false)} />
      )}
    </div>
  );
}
