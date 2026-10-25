import React, { useEffect, useState } from 'react';
import { LeaderboardRecord } from '../../types/game';
import { AvatarDisplay } from '../Avatar/AvatarDisplay';
import { api } from '../../services/api';
import { Trophy, X, Medal, RefreshCw } from 'lucide-react';

interface LeaderboardModalProps {
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ onClose }) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard();
      if (data.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.warn('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-amber-400 p-6 max-w-md w-full space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-amber-600 font-black text-xl">
            <Trophy size={24} />
            <h2>Sketch Rush Hall of Fame</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close leaderboard"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-slate-500">
          Top players and champions recorded in our MongoDB database.
        </p>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <RefreshCw className="animate-spin text-amber-500" size={24} />
              <span className="text-xs font-semibold">Loading champions...</span>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No champions recorded yet. Play a match to be the first!
            </div>
          ) : (
            leaderboard.map((record, index) => {
              const isTop3 = index < 3;
              const medalColor =
                index === 0
                  ? 'text-amber-500 bg-amber-50 border-amber-300'
                  : index === 1
                  ? 'text-slate-500 bg-slate-100 border-slate-300'
                  : index === 2
                  ? 'text-amber-700 bg-amber-50/50 border-amber-200'
                  : 'text-slate-400';

              return (
                <div
                  key={record._id || index}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isTop3 ? `${medalColor} border shadow-2xs` : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-black text-xs font-mono">
                      #{index + 1}
                    </span>
                    <AvatarDisplay avatar={record.avatar} size={36} showCrown={index === 0} />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800">
                        {record.playerName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {record.roundsWon ? `${record.roundsWon} win(s)` : 'Champion'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-600 font-mono">
                      {record.score} pts
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Refresh / Close footer */}
        <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={fetchLeaderboard}
            className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            <RefreshCw size={13} />
            Refresh
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
