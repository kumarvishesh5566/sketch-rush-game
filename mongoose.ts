import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) return;

  if (!MONGO_URI) {
    console.warn('[MongoDB] MONGODB_URI not set - running with in-memory fallback');
    return;
  }

  try {
    console.log('[MongoDB] Connecting to MongoDB Cluster...');
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000,
    });
    isConnected = true;
    console.log('[MongoDB] Successfully connected to MongoDB database!');
  } catch (err: any) {
    console.warn('[MongoDB] Connection warning (running with in-memory fallback enabled):', err?.message || err);
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

// Mongoose Schemas
const LeaderboardSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  avatar: {
    color: { type: String, default: '#3b82f6' },
    eyes: { type: Number, default: 0 },
    mouth: { type: Number, default: 0 },
  },
  score: { type: Number, required: true },
  roundsWon: { type: Number, default: 0 },
  roomId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const GameHistorySchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  roomCode: { type: String, required: true },
  winnerName: { type: String },
  winnerScore: { type: Number },
  totalRounds: { type: Number },
  playerCount: { type: Number },
  players: [{
    name: String,
    score: Number,
    avatar: Object,
  }],
  category: { type: String, default: 'mixed' },
  playedAt: { type: Date, default: Date.now },
});

const CustomWordPackSchema = new mongoose.Schema({
  packName: { type: String, required: true },
  authorName: { type: String, default: 'Community' },
  category: { type: String, default: 'custom' },
  words: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export const LeaderboardModel = mongoose.models.Leaderboard || mongoose.model('Leaderboard', LeaderboardSchema);
export const GameHistoryModel = mongoose.models.GameHistory || mongoose.model('GameHistory', GameHistorySchema);
export const CustomWordPackModel = mongoose.models.CustomWordPack || mongoose.model('CustomWordPack', CustomWordPackSchema);
