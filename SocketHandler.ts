import { Server, Socket } from 'socket.io';
import { RoomManager } from './RoomManager.js';
import { Stroke } from '../../src/types/game.js';

export function setupSocketHandlers(io: Server) {
  const roomManager = RoomManager.getInstance();
  roomManager.init(io);

  io.on('connection', (socket: Socket) => {
    // 1. Create Room
    socket.on('create_room', ({ hostName, avatar, settings }, callback) => {
      try {
        const room = roomManager.createRoom(settings);
        const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
        socket.join(room.id);
        roomManager.registerSocketPlayer(socket.id, room.id, playerId);
        const joinResult = room.addPlayer(playerId, socket.id, hostName, avatar);

        if (!joinResult.success) {
          if (callback) callback({ success: false, error: joinResult.error });
          return;
        }

        if (callback) {
          callback({
            success: true,
            roomId: room.id,
            roomCode: room.code,
            player: joinResult.player?.toJSON(),
            settings: room.settings,
            players: Array.from(room.players.values()).map((p) => p.toJSON()),
          });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 2. Join Room
    socket.on('join_room', ({ roomIdOrCode, playerName, avatar }, callback) => {
      try {
        const room = roomManager.getRoom(roomIdOrCode);
        if (!room) {
          if (callback) callback({ success: false, error: 'Room not found. Check the room code.' });
          return;
        }

        const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
        socket.join(room.id);
        roomManager.registerSocketPlayer(socket.id, room.id, playerId);
        const joinResult = room.addPlayer(playerId, socket.id, playerName, avatar);

        if (!joinResult.success) {
          if (callback) callback({ success: false, error: joinResult.error });
          return;
        }

        // Send existing stroke history to late joiners
        socket.emit('initial_strokes', room.game.strokeHistory);
        socket.emit('initial_messages', room.messages);

        if (callback) {
          callback({
            success: true,
            roomId: room.id,
            roomCode: room.code,
            player: joinResult.player?.toJSON(),
            settings: room.settings,
            players: Array.from(room.players.values()).map((p) => p.toJSON()),
          });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 3. Quick Play
    socket.on('quick_play', ({ playerName, avatar }, callback) => {
      try {
        const room = roomManager.findQuickPlayRoom();
        const playerId = `p_${Math.random().toString(36).substring(2, 9)}`;
        socket.join(room.id);
        roomManager.registerSocketPlayer(socket.id, room.id, playerId);
        const joinResult = room.addPlayer(playerId, socket.id, playerName, avatar);

        if (!joinResult.success) {
          if (callback) callback({ success: false, error: joinResult.error });
          return;
        }

        socket.emit('initial_strokes', room.game.strokeHistory);
        socket.emit('initial_messages', room.messages);

        if (callback) {
          callback({
            success: true,
            roomId: room.id,
            roomCode: room.code,
            player: joinResult.player?.toJSON(),
            settings: room.settings,
            players: Array.from(room.players.values()).map((p) => p.toJSON()),
          });
        }
      } catch (err: any) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 4. Start Game (Requires at least 2 players)
    socket.on('start_game', (_, callback) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      const result = room.startGame(entry.playerId);
      if (callback) callback(result);
    });

    // 5. Update Room Settings
    socket.on('update_settings', (newSettings, callback) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      const updated = room.updateSettings(newSettings, entry.playerId);
      if (callback) callback({ success: updated });
    });

    // 6. Word Chosen by Drawer
    socket.on('choose_word', ({ word }) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      if (room.game.currentDrawer && room.game.currentDrawer.id === entry.playerId) {
        room.game.chooseWord(word);
      }
    });

    // 7. Drawing Strokes
    socket.on('draw_stroke', (stroke: Stroke) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      room.handleStroke(stroke, entry.playerId);
    });

    // 8. Draw Undo
    socket.on('draw_undo', () => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      room.handleUndo(entry.playerId);
    });

    // 9. Canvas Clear
    socket.on('canvas_clear', () => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      room.handleClear(entry.playerId);
    });

    // 10. Chat & Guess
    socket.on('send_chat', ({ text }) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      room.handleIncomingText(entry.playerId, text);
    });

    // 11. Add Bot Player (Great for testing & solo play)
    socket.on('toggle_bot', (_, callback) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      const hasBot = Array.from(room.players.values()).some((p) => p.isBot);
      if (hasBot) {
        room.removeBotPlayer();
      } else {
        room.addBotPlayer();
      }
      if (callback) callback({ success: true });
    });

    // 12. Kick Player (Host moderation)
    socket.on('kick_player', ({ targetPlayerId }) => {
      const entry = roomManager.getSocketPlayer(socket.id);
      if (!entry) return;
      const room = roomManager.getRoom(entry.roomId);
      if (!room) return;

      const player = room.players.get(entry.playerId);
      if (!player || !player.isHost) return;

      const target = room.players.get(targetPlayerId);
      if (target) {
        room.removePlayer(targetPlayerId);
        io.to(target.socketId).emit('kicked_notification', { reason: 'Kicked by room host.' });
      }
    });

    // 13. Disconnect
    socket.on('disconnect', () => {
      roomManager.handleSocketDisconnect(socket.id);
    });
  });
}
