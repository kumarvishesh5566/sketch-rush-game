import axios from 'axios';
import { LeaderboardRecord, RoomSummary } from '../types/game';

// If VITE_BACKEND_URL is set (e.g. for Vercel/Netlify frontend pointing to Render backend),
// axios will use it as baseURL. If not set, it uses relative paths for fullstack/local setup.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').trim();

export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const api = {
  // Server and DB Health
  async checkHealth() {
    const response = await apiClient.get('/api/health');
    return response.data;
  },

  // Public Rooms
  async getRooms(): Promise<{ success: boolean; rooms: RoomSummary[] }> {
    const response = await apiClient.get<{ success: boolean; rooms: RoomSummary[] }>('/api/rooms');
    return response.data;
  },

  // Hall of Fame Leaderboard
  async getLeaderboard(): Promise<{ success: boolean; leaderboard: LeaderboardRecord[] }> {
    const response = await apiClient.get<{ success: boolean; leaderboard: LeaderboardRecord[] }>(
      '/api/leaderboard'
    );
    return response.data;
  },

  // Word Categories
  async getCategories(): Promise<{ success: boolean; categories: string[] }> {
    const response = await apiClient.get<{ success: boolean; categories: string[] }>(
      '/api/words/categories'
    );
    return response.data;
  },

  // Add Custom Word Pack
  async addCustomWordPack(packName: string, words: string[], authorName?: string) {
    const response = await apiClient.post('/api/words/custom', {
      packName,
      words,
      authorName,
    });
    return response.data;
  },
};
