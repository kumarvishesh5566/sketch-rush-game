export interface PlayerAvatar {
  color: string; // Hex color code or css color for body
  eyes: number;  // 0 to 9 index for eye expressions
  mouth: number; // 0 to 9 index for mouth expressions
}

export interface Player {
  id: string;
  socketId: string;
  name: string;
  avatar: PlayerAvatar;
  score: number;
  roundScore: number;
  isHost: boolean;
  isDrawing: boolean;
  hasGuessed: boolean;
  isSpectator: boolean;
  isBot?: boolean;
}

export type WordCategory = 'mixed' | 'animals' | 'food' | 'objects' | 'places' | 'verbs';
export type WordMode = 'normal' | 'hidden' | 'combination';

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordChoicesCount: number;
  hintsCount: number;
  category: WordCategory;
  wordMode: WordMode;
  customWords: string[];
  isPrivate: boolean;
}

export type GamePhase = 'lobby' | 'selecting_word' | 'drawing' | 'round_end' | 'game_over';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  type: 'brush' | 'fill';
  color: string;
  size: number;
  isEraser?: boolean;
  points: StrokePoint[];
}

export interface ChatMessage {
  id: string;
  senderId?: string;
  senderName?: string;
  text: string;
  type: 'chat' | 'guess' | 'correct' | 'close' | 'system';
  timestamp: number;
}

export interface GameState {
  roomId: string;
  roomCode: string;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  drawerId: string | null;
  drawerName: string | null;
  wordDisplay: string;
  wordLength?: number;
  timeLeft: number;
  maxTime: number;
  wordChoices?: string[]; // sent only to drawer
  currentWord?: string;   // revealed at round_end or to drawer
  hintsRevealed: number[];
  winner?: Player | null;
  leaderboard?: Player[];
}

export interface RoomSummary {
  id: string;
  code: string;
  playerCount: number;
  maxPlayers: number;
  phase: GamePhase;
  isPrivate: boolean;
  category: string;
}

export interface LeaderboardRecord {
  _id?: string;
  playerName: string;
  avatar: PlayerAvatar;
  score: number;
  roundsWon: number;
  date: string;
}
