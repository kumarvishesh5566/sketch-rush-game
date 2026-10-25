import { Server, Socket } from 'socket.io';
import { RoomSettings, Stroke, ChatMessage, PlayerAvatar } from '../../src/types/game.js';
import { Player } from './Player.js';
import { Game } from './Game.js';
import { GameHistoryModel, LeaderboardModel, isDbConnected } from '../db/mongoose.js';

export class Room {
  public id: string;
  public code: string;
  public settings: RoomSettings;
  public players: Map<string, Player> = new Map();
  public game: Game;
  public messages: ChatMessage[] = [];
  public bannedPlayerNames: Set<string> = new Set();
  public votekicks: Map<string, Set<string>> = new Map(); // targetPlayerId -> Set of voterIds

  private io: Server;

  constructor(id: string, code: string, io: Server, initialSettings?: Partial<RoomSettings>) {
    this.id = id;
    this.code = code;
    this.io = io;
    this.settings = {
      maxPlayers: initialSettings?.maxPlayers ?? 8,
      rounds: initialSettings?.rounds ?? 3,
      drawTime: initialSettings?.drawTime ?? 60,
      wordChoicesCount: initialSettings?.wordChoicesCount ?? 3,
      hintsCount: initialSettings?.hintsCount ?? 2,
      category: initialSettings?.category ?? 'mixed',
      wordMode: initialSettings?.wordMode ?? 'normal',
      customWords: initialSettings?.customWords ?? [],
      isPrivate: initialSettings?.isPrivate ?? false,
    };

    this.game = new Game(
      this.id,
      this.code,
      () => Array.from(this.players.values()),
      {
        onStateUpdate: () => this.broadcastGameState(),
        onChatMessage: (msg) => this.addMessage(msg),
        onClearCanvas: () => this.io.to(this.id).emit('canvas_clear'),
        onGameOver: (winner, leaderboard) => this.handleGameOver(winner, leaderboard),
      }
    );
  }

  public addPlayer(
    id: string,
    socketId: string,
    name: string,
    avatar?: Partial<PlayerAvatar>,
    isBot: boolean = false
  ): { success: boolean; error?: string; player?: Player } {
    if (this.bannedPlayerNames.has(name.toLowerCase())) {
      return { success: false, error: 'You are banned from this room.' };
    }

    if (this.players.size >= this.settings.maxPlayers) {
      return { success: false, error: 'Room is full.' };
    }

    // Assign host if this is the first player
    const isHost = this.players.size === 0;
    const player = new Player(id, socketId, name, avatar, isHost, isBot);
    this.players.set(id, player);

    this.addMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `${player.name} joined the room.`,
      timestamp: Date.now(),
    });

    this.broadcastPlayers();
    this.broadcastGameState();

    return { success: true, player };
  }

  public removePlayer(playerId: string): { remainingCount: number } {
    const player = this.players.get(playerId);
    if (!player) return { remainingCount: this.players.size };

    const wasHost = player.isHost;
    const wasDrawer = this.game.currentDrawer && this.game.currentDrawer.id === playerId;
    this.players.delete(playerId);

    this.addMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `${player.name} left the room.`,
      timestamp: Date.now(),
    });

    // If host left, elect next player as host
    if (wasHost && this.players.size > 0) {
      const nextPlayer = Array.from(this.players.values())[0];
      nextPlayer.isHost = true;
      this.addMessage({
        id: Math.random().toString(36).substring(7),
        type: 'system',
        text: `${nextPlayer.name} is now the host.`,
        timestamp: Date.now(),
      });
    }

    // If active drawer left during drawing, advance to next turn
    if (wasDrawer && (this.game.phase === 'drawing' || this.game.phase === 'selecting_word')) {
      this.game.clearTimer();
      this.game.startTurn();
    }

    this.broadcastPlayers();
    this.broadcastGameState();

    return { remainingCount: this.players.size };
  }

  public addBotPlayer(): Player | null {
    if (this.players.size >= this.settings.maxPlayers) return null;
    const botId = `bot_${Math.random().toString(36).substring(7)}`;
    const botNames = ['DoodleBot', 'PixelPanda', 'SketchArtie', 'ScribbleSam', 'DrawMaster'];
    const botName = botNames[Math.floor(Math.random() * botNames.length)];
    const botColors = ['#ec4899', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];

    const res = this.addPlayer(
      botId,
      botId,
      botName,
      {
        color: botColors[Math.floor(Math.random() * botColors.length)],
        eyes: Math.floor(Math.random() * 5),
        mouth: Math.floor(Math.random() * 5),
      },
      true
    );

    return res.player || null;
  }

  public removeBotPlayer(): boolean {
    const bot = Array.from(this.players.values()).find((p) => p.isBot);
    if (bot) {
      this.removePlayer(bot.id);
      return true;
    }
    return false;
  }

  public updateSettings(newSettings: Partial<RoomSettings>, requesterId: string): boolean {
    const player = this.players.get(requesterId);
    if (!player || !player.isHost) return false;

    this.settings = { ...this.settings, ...newSettings };
    this.io.to(this.id).emit('room_settings_updated', this.settings);
    return true;
  }

  public startGame(requesterId: string): { success: boolean; error?: string } {
    const player = this.players.get(requesterId);
    if (!player || !player.isHost) return { success: false, error: 'Only the host can start the game.' };
    if (this.players.size < 2) return { success: false, error: 'Minimum 2 players are required to start the game.' };

    this.game.startGame(this.settings);
    return { success: true };
  }

  public handleStroke(stroke: Stroke, playerId: string) {
    if (this.game.phase !== 'drawing') return;
    if (!this.game.currentDrawer || this.game.currentDrawer.id !== playerId) return;

    this.game.addStroke(stroke);
    const drawerSocketId = this.players.get(playerId)?.socketId;
    if (drawerSocketId) {
      this.io.to(this.id).except(drawerSocketId).emit('draw_data', stroke);
    } else {
      this.io.to(this.id).emit('draw_data', stroke);
    }
  }

  public handleUndo(playerId: string) {
    if (this.game.phase !== 'drawing') return;
    if (!this.game.currentDrawer || this.game.currentDrawer.id !== playerId) return;

    this.game.undoStroke();
    const drawerSocketId = this.players.get(playerId)?.socketId;
    if (drawerSocketId) {
      this.io.to(this.id).except(drawerSocketId).emit('draw_undo');
    } else {
      this.io.to(this.id).emit('draw_undo');
    }
  }

  public handleClear(playerId: string) {
    if (this.game.phase !== 'drawing') return;
    if (!this.game.currentDrawer || this.game.currentDrawer.id !== playerId) return;

    this.game.clearCanvas();
    const drawerSocketId = this.players.get(playerId)?.socketId;
    if (drawerSocketId) {
      this.io.to(this.id).except(drawerSocketId).emit('canvas_clear');
    } else {
      this.io.to(this.id).emit('canvas_clear');
    }
  }

  public handleIncomingText(playerId: string, text: string) {
    const player = this.players.get(playerId);
    if (!player) return;

    const cleanText = text.trim();
    if (!cleanText) return;

    // Check if it's a guess during drawing
    if (this.game.phase === 'drawing') {
      const { isHandledAsGuess } = this.game.handleGuess(player, cleanText);
      if (isHandledAsGuess) {
        // Already dispatched 'correct' or 'close'
        this.broadcastPlayers();
        return;
      }
    }

    // Regular chat message
    this.addMessage({
      id: Math.random().toString(36).substring(7),
      senderId: player.id,
      senderName: player.name,
      type: 'chat',
      text: cleanText,
      timestamp: Date.now(),
    });
  }

  public addMessage(msg: ChatMessage) {
    this.messages.push(msg);
    if (this.messages.length > 100) this.messages.shift();
    this.io.to(this.id).emit('chat_message', msg);
  }

  public broadcastPlayers() {
    const playerList = Array.from(this.players.values()).map((p) => p.toJSON());
    this.io.to(this.id).emit('players_update', playerList);
  }

  public broadcastGameState() {
    this.players.forEach((player) => {
      const state = this.game.getStateForPlayer(player.id);
      this.io.to(player.socketId).emit('game_state', state);
    });
  }

  public async handleGameOver(winner: Player | null, leaderboard: Player[]) {
    // Save record to MongoDB
    try {
      if (isDbConnected()) {
        await GameHistoryModel.create({
          roomId: this.id,
          roomCode: this.code,
          winnerName: winner ? winner.name : 'None',
          winnerScore: winner ? winner.score : 0,
          totalRounds: this.game.totalRounds,
          playerCount: this.players.size,
          players: leaderboard.map((p) => ({
            name: p.name,
            score: p.score,
            avatar: p.avatar,
          })),
          category: this.settings.category,
        });

        // Add top 3 players to global leaderboard
        for (const p of leaderboard.slice(0, 3)) {
          if (p.score > 0 && !p.isBot) {
            await LeaderboardModel.create({
              playerName: p.name,
              avatar: p.avatar,
              score: p.score,
              roundsWon: p.id === winner?.id ? 1 : 0,
              roomId: this.id,
            });
          }
        }
        console.log(`[MongoDB] Successfully persisted game results for room ${this.code}`);
      }
    } catch (e: any) {
      console.warn('[MongoDB] Could not persist game stats:', e?.message || e);
    }
  }
}
