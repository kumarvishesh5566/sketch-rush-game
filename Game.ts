import { GamePhase, Stroke, GameState } from '../../src/types/game.js';
import { Player } from './Player.js';
import { getRandomWordList } from './words.js';
import {
  checkWordMatch,
  calculateGuessPoints,
  calculateDrawerPoints,
  generateHintDisplay,
  pickNextHintIndex,
} from '../../src/game/logic.js';

export interface GameCallbacks {
  onStateUpdate: (state: GameState) => void;
  onChatMessage: (message: any) => void;
  onClearCanvas: () => void;
  onGameOver: (winner: Player | null, leaderboard: Player[]) => void;
  onBotAction?: (action: 'draw' | 'guess', data?: any) => void;
}

export class Game {
  public phase: GamePhase = 'lobby';
  public currentRound: number = 1;
  public totalRounds: number = 3;
  public drawTime: number = 60;
  public wordChoicesCount: number = 3;
  public hintsCount: number = 2;
  public category: string = 'mixed';
  public customWords: string[] = [];

  public drawerIndex: number = 0;
  public currentDrawer: Player | null = null;
  public currentWord: string = '';
  public wordChoices: string[] = [];
  public revealedIndices: number[] = [];

  public timeLeft: number = 0;
  public timerInterval: NodeJS.Timeout | null = null;
  public strokeHistory: Stroke[] = [];
  public guessOrder: number = 0;
  public correctGuessCount: number = 0;

  private callbacks: GameCallbacks;
  private playersSupplier: () => Player[];
  private roomId: string;
  private roomCode: string;

  constructor(
    roomId: string,
    roomCode: string,
    playersSupplier: () => Player[],
    callbacks: GameCallbacks
  ) {
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.playersSupplier = playersSupplier;
    this.callbacks = callbacks;
  }

  public getActivePlayers(): Player[] {
    return this.playersSupplier().filter((p) => !p.isSpectator);
  }

  public startGame(settings: {
    rounds: number;
    drawTime: number;
    wordChoicesCount: number;
    hintsCount: number;
    category: string;
    customWords: string[];
  }) {
    this.totalRounds = settings.rounds || 3;
    this.drawTime = settings.drawTime || 60;
    this.wordChoicesCount = settings.wordChoicesCount || 3;
    this.hintsCount = settings.hintsCount ?? 2;
    this.category = settings.category || 'mixed';
    this.customWords = settings.customWords || [];

    this.currentRound = 1;
    this.drawerIndex = 0;

    // Reset player scores
    this.getActivePlayers().forEach((p) => p.resetGame());

    this.startTurn();
  }

  public startTurn() {
    this.clearTimer();
    const activePlayers = this.getActivePlayers();
    if (activePlayers.length < 1) {
      this.phase = 'lobby';
      this.broadcastState();
      return;
    }

    if (this.drawerIndex >= activePlayers.length) {
      this.drawerIndex = 0;
      this.currentRound++;
      if (this.currentRound > this.totalRounds) {
        this.endGame();
        return;
      }
    }

    this.currentDrawer = activePlayers[this.drawerIndex];
    if (!this.currentDrawer) {
      this.drawerIndex = 0;
      this.currentDrawer = activePlayers[0];
    }

    // Reset round-specific flags
    activePlayers.forEach((p) => {
      p.resetRound();
      if (this.currentDrawer && p.id === this.currentDrawer.id) {
        p.isDrawing = true;
      }
    });

    this.strokeHistory = [];
    this.callbacks.onClearCanvas();
    this.revealedIndices = [];
    this.guessOrder = 0;
    this.correctGuessCount = 0;

    // Pick 3 random words for drawer
    this.wordChoices = getRandomWordList(this.category, this.wordChoicesCount, this.customWords);
    this.phase = 'selecting_word';
    this.timeLeft = 15; // 15 seconds to choose

    this.callbacks.onChatMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `${this.currentDrawer.name} is choosing a word! (Round ${this.currentRound} of ${this.totalRounds})`,
      timestamp: Date.now(),
    });

    this.broadcastState();

    // If drawer is bot, choose immediately
    if (this.currentDrawer.isBot) {
      setTimeout(() => {
        const choice = this.wordChoices[0] || 'apple';
        this.chooseWord(choice);
      }, 1500);
      return;
    }

    // Timer for word selection
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        // Auto pick first word
        const autoPick = this.wordChoices[0] || 'apple';
        this.chooseWord(autoPick);
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  public chooseWord(word: string) {
    this.clearTimer();
    this.currentWord = word;
    this.phase = 'drawing';
    this.timeLeft = this.drawTime;

    this.callbacks.onChatMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `${this.currentDrawer?.name} has chosen a word! Start guessing!`,
      timestamp: Date.now(),
    });

    // Schedule hints if enabled
    this.broadcastState();

    const hintIntervalTime = Math.floor(this.drawTime / (this.hintsCount + 1));
    let hintsGiven = 0;

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      // Check if we should reveal a hint
      if (
        this.hintsCount > 0 &&
        hintsGiven < this.hintsCount &&
        this.timeLeft > 5 &&
        (this.drawTime - this.timeLeft) >= (hintsGiven + 1) * hintIntervalTime
      ) {
        const nextIdx = pickNextHintIndex(this.currentWord, this.revealedIndices);
        if (nextIdx !== null) {
          this.revealedIndices.push(nextIdx);
          hintsGiven++;
          this.callbacks.onChatMessage({
            id: Math.random().toString(36).substring(7),
            type: 'system',
            text: `Hint revealed: A letter was uncovered!`,
            timestamp: Date.now(),
          });
        }
      }

      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.endRound('Time is up!');
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  public handleGuess(player: Player, guessText: string): { isHandledAsGuess: boolean } {
    if (this.phase !== 'drawing') return { isHandledAsGuess: false };
    if (!this.currentDrawer || player.id === this.currentDrawer.id) {
      return { isHandledAsGuess: false };
    }
    if (player.hasGuessed) {
      // Already guessed, they can chat only with other guessed players or system suppresses word
      return { isHandledAsGuess: false };
    }

    const match = checkWordMatch(guessText, this.currentWord);

    if (match.isExact) {
      this.guessOrder++;
      this.correctGuessCount++;
      player.hasGuessed = true;

      const points = calculateGuessPoints(this.timeLeft, this.drawTime, this.guessOrder);
      player.addScore(points);

      this.callbacks.onChatMessage({
        id: Math.random().toString(36).substring(7),
        senderId: player.id,
        senderName: player.name,
        type: 'correct',
        text: `${player.name} guessed the word! (+${points} pts)`,
        timestamp: Date.now(),
      });

      // Check if all non-drawing active players have guessed
      const guessers = this.getActivePlayers().filter(
        (p) => this.currentDrawer && p.id !== this.currentDrawer.id
      );
      const allGuessed = guessers.length > 0 && guessers.every((p) => p.hasGuessed);

      if (allGuessed) {
        this.clearTimer();
        this.endRound('Everyone guessed the word!');
      } else {
        this.broadcastState();
      }
      return { isHandledAsGuess: true };
    } else if (match.isClose) {
      // Alert player they are close privately or via whisper
      this.callbacks.onChatMessage({
        id: Math.random().toString(36).substring(7),
        senderId: player.id,
        senderName: player.name,
        type: 'close',
        text: `'${guessText.trim()}' is very close!`,
        timestamp: Date.now(),
      });
      return { isHandledAsGuess: true };
    }

    return { isHandledAsGuess: false };
  }

  public endRound(reason: string) {
    this.clearTimer();
    this.phase = 'round_end';
    this.timeLeft = 5; // 5s intermission

    // Calculate drawer points
    const nonDrawingPlayers = this.getActivePlayers().filter(
      (p) => this.currentDrawer && p.id !== this.currentDrawer.id
    );
    if (this.currentDrawer && nonDrawingPlayers.length > 0) {
      const drawerPts = calculateDrawerPoints(this.correctGuessCount, nonDrawingPlayers.length);
      if (drawerPts > 0) {
        this.currentDrawer.addScore(drawerPts);
      }
    }

    this.callbacks.onChatMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `${reason} The word was "${this.currentWord.toUpperCase()}".`,
      timestamp: Date.now(),
    });

    this.broadcastState();

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        this.clearTimer();
        this.drawerIndex++;
        this.startTurn();
      } else {
        this.broadcastState();
      }
    }, 1000);
  }

  public endGame() {
    this.clearTimer();
    this.phase = 'game_over';
    this.timeLeft = 0;

    const sortedPlayers = [...this.getActivePlayers()].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0] || null;

    this.callbacks.onChatMessage({
      id: Math.random().toString(36).substring(7),
      type: 'system',
      text: `Game over! 🏆 ${winner ? `${winner.name} wins with ${winner.score} points!` : 'Great game!'}`,
      timestamp: Date.now(),
    });

    this.callbacks.onGameOver(winner, sortedPlayers);
    this.broadcastState();
  }

  public addStroke(stroke: Stroke) {
    this.strokeHistory.push(stroke);
  }

  public undoStroke(): Stroke | null {
    if (this.strokeHistory.length > 0) {
      return this.strokeHistory.pop() || null;
    }
    return null;
  }

  public clearCanvas() {
    this.strokeHistory = [];
    this.callbacks.onClearCanvas();
  }

  public clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public getStateForPlayer(playerId?: string): GameState {
    const isCurrentDrawer = this.currentDrawer && this.currentDrawer.id === playerId;
    const playerObj = this.playersSupplier().find((p) => p.id === playerId);
    const hasGuessed = !!playerObj?.hasGuessed;

    let wordDisplay = '';
    if (this.phase === 'lobby') {
      wordDisplay = 'Waiting for host to start...';
    } else if (this.phase === 'selecting_word') {
      wordDisplay = isCurrentDrawer ? 'Pick a word!' : 'Choosing a word...';
    } else if (this.phase === 'drawing') {
      if (isCurrentDrawer || hasGuessed) {
        wordDisplay = this.currentWord;
      } else {
        wordDisplay = generateHintDisplay(this.currentWord, this.revealedIndices);
      }
    } else if (this.phase === 'round_end' || this.phase === 'game_over') {
      wordDisplay = this.currentWord;
    }

    const sortedPlayers = [...this.getActivePlayers()].sort((a, b) => b.score - a.score);

    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      phase: this.phase,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
      drawerId: this.currentDrawer ? this.currentDrawer.id : null,
      drawerName: this.currentDrawer ? this.currentDrawer.name : null,
      wordDisplay,
      wordLength: this.currentWord ? this.currentWord.length : 0,
      timeLeft: this.timeLeft,
      maxTime: this.phase === 'selecting_word' ? 15 : this.drawTime,
      wordChoices: isCurrentDrawer && this.phase === 'selecting_word' ? this.wordChoices : undefined,
      currentWord: (isCurrentDrawer || this.phase === 'round_end' || this.phase === 'game_over') ? this.currentWord : undefined,
      hintsRevealed: this.revealedIndices,
      leaderboard: sortedPlayers,
      winner: sortedPlayers[0] || null,
    };
  }

  public broadcastState() {
    this.callbacks.onStateUpdate(this.getStateForPlayer());
  }
}
