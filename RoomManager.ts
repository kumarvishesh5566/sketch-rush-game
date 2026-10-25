import { Server } from 'socket.io';
import { Room } from './Room.js';
import { RoomSettings, RoomSummary } from '../../src/types/game.js';

export class RoomManager {
  private static instance: RoomManager;
  private rooms: Map<string, Room> = new Map(); // roomId -> Room
  private codeToRoomId: Map<string, string> = new Map(); // code -> roomId
  private socketToPlayerRoom: Map<string, { roomId: string; playerId: string }> = new Map();
  private io!: Server;

  private constructor() {}

  public static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  public init(io: Server) {
    this.io = io;
  }

  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  public createRoom(settings?: Partial<RoomSettings>): Room {
    const id = `room_${Math.random().toString(36).substring(2, 9)}`;
    let code = this.generateRoomCode();
    while (this.codeToRoomId.has(code)) {
      code = this.generateRoomCode();
    }

    const room = new Room(id, code, this.io, settings);
    this.rooms.set(id, room);
    this.codeToRoomId.set(code, id);
    return room;
  }

  public getRoom(roomIdOrCode: string): Room | undefined {
    if (!roomIdOrCode) return undefined;
    const clean = roomIdOrCode.trim().toUpperCase();
    if (this.rooms.has(roomIdOrCode)) {
      return this.rooms.get(roomIdOrCode);
    }
    const idFromCode = this.codeToRoomId.get(clean);
    if (idFromCode) {
      return this.rooms.get(idFromCode);
    }
    return undefined;
  }

  public getPublicRooms(): RoomSummary[] {
    const summaries: RoomSummary[] = [];
    this.rooms.forEach((room) => {
      if (!room.settings.isPrivate) {
        summaries.push({
          id: room.id,
          code: room.code,
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
          phase: room.game.phase,
          isPrivate: false,
          category: room.settings.category,
        });
      }
    });
    return summaries;
  }

  public findQuickPlayRoom(): Room {
    // Find an open public room in lobby or drawing with space
    for (const room of this.rooms.values()) {
      if (!room.settings.isPrivate && room.players.size < room.settings.maxPlayers) {
        return room;
      }
    }
    // If no suitable room exists, create a new public room
    return this.createRoom({ isPrivate: false });
  }

  public registerSocketPlayer(socketId: string, roomId: string, playerId: string) {
    this.socketToPlayerRoom.set(socketId, { roomId, playerId });
  }

  public getSocketPlayer(socketId: string): { roomId: string; playerId: string } | undefined {
    return this.socketToPlayerRoom.get(socketId);
  }

  public handleSocketDisconnect(socketId: string) {
    const entry = this.socketToPlayerRoom.get(socketId);
    if (!entry) return;

    this.socketToPlayerRoom.delete(socketId);
    const room = this.rooms.get(entry.roomId);
    if (room) {
      const { remainingCount } = room.removePlayer(entry.playerId);
      if (remainingCount <= 0) {
        // Destroy room if all human players left after 10s grace
        setTimeout(() => {
          if (room.players.size === 0) {
            room.game.clearTimer();
            this.rooms.delete(room.id);
            this.codeToRoomId.delete(room.code);
            console.log(`[RoomManager] Room ${room.code} cleaned up.`);
          }
        }, 10000);
      }
    }
  }
}
