import { Player as IPlayer, PlayerAvatar } from '../../src/types/game.js';

export class Player implements IPlayer {
  public id: string;
  public socketId: string;
  public name: string;
  public avatar: PlayerAvatar;
  public score: number = 0;
  public roundScore: number = 0;
  public isHost: boolean = false;
  public isDrawing: boolean = false;
  public hasGuessed: boolean = false;
  public isSpectator: boolean = false;
  public isBot: boolean = false;

  constructor(
    id: string,
    socketId: string,
    name: string,
    avatar?: Partial<PlayerAvatar>,
    isHost: boolean = false,
    isBot: boolean = false
  ) {
    this.id = id;
    this.socketId = socketId;
    this.name = (name || 'Player').trim().slice(0, 18);
    this.avatar = {
      color: avatar?.color || '#3b82f6',
      eyes: avatar?.eyes ?? Math.floor(Math.random() * 5),
      mouth: avatar?.mouth ?? Math.floor(Math.random() * 5),
    };
    this.isHost = isHost;
    this.isBot = isBot;
  }

  public resetRound() {
    this.roundScore = 0;
    this.hasGuessed = false;
    this.isDrawing = false;
  }

  public resetGame() {
    this.score = 0;
    this.resetRound();
  }

  public addScore(points: number) {
    this.roundScore += points;
    this.score += points;
  }

  public toJSON(): IPlayer {
    return {
      id: this.id,
      socketId: this.socketId,
      name: this.name,
      avatar: this.avatar,
      score: this.score,
      roundScore: this.roundScore,
      isHost: this.isHost,
      isDrawing: this.isDrawing,
      hasGuessed: this.hasGuessed,
      isSpectator: this.isSpectator,
      isBot: this.isBot,
    };
  }
}
