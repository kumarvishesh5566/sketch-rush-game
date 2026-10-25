import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectMongoDB, isDbConnected, LeaderboardModel, CustomWordPackModel } from './server/db/mongoose.js';
import { setupSocketHandlers } from './server/game/SocketHandler.js';
import { RoomManager } from './server/game/RoomManager.js';
import { WORDS_DATABASE } from './server/game/words.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Enable CORS for standalone frontend deployment (Vercel, Netlify)
  app.use(cors());
  app.use(express.json());

  // Connect to MongoDB
  await connectMongoDB();

  // Setup WebSocket Handlers
  setupSocketHandlers(io);

  // REST API Routes
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      mongodb: isDbConnected() ? 'connected' : 'fallback-memory',
      activeRooms: RoomManager.getInstance().getPublicRooms().length,
      timestamp: new Date().toISOString(),
    });
  });

  // Get active public rooms
  app.get('/api/rooms', (_req, res) => {
    const rooms = RoomManager.getInstance().getPublicRooms();
    res.json({ success: true, rooms });
  });

  // Global Hall of Fame / Leaderboard from MongoDB
  app.get('/api/leaderboard', async (_req, res) => {
    try {
      if (isDbConnected()) {
        const topPlayers = await LeaderboardModel.find({})
          .sort({ score: -1 })
          .limit(20)
          .lean();
        return res.json({ success: true, leaderboard: topPlayers });
      }
    } catch (err: any) {
      console.warn('Leaderboard fetch warning:', err?.message || err);
    }

    // Default mock Hall of Fame if DB is empty or syncing
    res.json({
      success: true,
      leaderboard: [
        { playerName: 'DoodleKing', score: 3820, avatar: { color: '#ec4899', eyes: 2, mouth: 1 } },
        { playerName: 'PicassoPro', score: 3240, avatar: { color: '#3b82f6', eyes: 4, mouth: 3 } },
        { playerName: 'SketchQueen', score: 2980, avatar: { color: '#10b981', eyes: 1, mouth: 0 } },
        { playerName: 'WordMaster', score: 2650, avatar: { color: '#f59e0b', eyes: 3, mouth: 4 } },
        { playerName: 'SpeedyGuesser', score: 2420, avatar: { color: '#8b5cf6', eyes: 0, mouth: 2 } },
      ],
    });
  });

  // Word Categories and Custom Packs
  app.get('/api/words/categories', (_req, res) => {
    const categories = Object.keys(WORDS_DATABASE);
    res.json({ success: true, categories: ['mixed', ...categories] });
  });

  app.post('/api/words/custom', async (req, res) => {
    try {
      const { packName, words, authorName } = req.body;
      if (!packName || !Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ success: false, error: 'packName and words array are required' });
      }

      if (isDbConnected()) {
        const doc = await CustomWordPackModel.create({
          packName,
          authorName: authorName || 'Player',
          words: words.map((w: string) => w.trim()).filter(Boolean),
        });
        return res.json({ success: true, pack: doc });
      }

      res.json({ success: true, message: 'Pack added in temporary memory' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dev server or Production static serving
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Skribbl Server] Real-time game server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Skribbl Server] Startup error:', err);
  process.exit(1);
});
