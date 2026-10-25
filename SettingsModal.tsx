import React, { useState } from 'react';
import { RoomSettings, WordCategory, WordMode } from '../../types/game';
import { X, Save, Sliders, BookOpen } from 'lucide-react';

interface SettingsModalProps {
  settings: RoomSettings;
  onSave: (settings: RoomSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [rounds, setRounds] = useState(settings.rounds);
  const [drawTime, setDrawTime] = useState(settings.drawTime);
  const [maxPlayers, setMaxPlayers] = useState(settings.maxPlayers);
  const [wordChoicesCount, setWordChoicesCount] = useState(settings.wordChoicesCount);
  const [hintsCount, setHintsCount] = useState(settings.hintsCount);
  const [category, setCategory] = useState<WordCategory>(settings.category);
  const [wordMode, setWordMode] = useState<WordMode>(settings.wordMode);
  const [customWordsText, setCustomWordsText] = useState(
    settings.customWords ? settings.customWords.join(', ') : ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCustom = customWordsText
      .split(/[\n,]+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1);

    onSave({
      ...settings,
      rounds,
      drawTime,
      maxPlayers,
      wordChoicesCount,
      hintsCount,
      category,
      wordMode,
      customWords: parsedCustom,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-sky-400 p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2 text-sky-700 font-black text-lg">
            <Sliders size={20} />
            <h2>Room & Game Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
          {/* Max Players & Rounds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="max-players-select" className="block text-slate-600 mb-1">Max Players (2 - 20)</label>
              <select
                id="max-players-select"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                {[2, 4, 6, 8, 10, 12, 16, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} Players
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="rounds-select" className="block text-slate-600 mb-1">Rounds (2 - 10)</label>
              <select
                id="rounds-select"
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>
                    {n} Rounds
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Draw Time & Word Choices */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="draw-time-select" className="block text-slate-600 mb-1">Draw Time (seconds)</label>
              <select
                id="draw-time-select"
                value={drawTime}
                onChange={(e) => setDrawTime(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value={30}>30 Seconds (Fast)</option>
                <option value={45}>45 Seconds</option>
                <option value={60}>60 Seconds (Default)</option>
                <option value={80}>80 Seconds</option>
                <option value={120}>120 Seconds</option>
              </select>
            </div>

            <div>
              <label htmlFor="word-count-select" className="block text-slate-600 mb-1">Word Choices</label>
              <select
                id="word-count-select"
                value={wordChoicesCount}
                onChange={(e) => setWordChoicesCount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} Words
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Hints & Word Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="hints-select" className="block text-slate-600 mb-1">Hints (Letter reveals)</label>
              <select
                id="hints-select"
                value={hintsCount}
                onChange={(e) => setHintsCount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value={0}>Disabled</option>
                <option value={1}>1 Hint</option>
                <option value={2}>2 Hints (Default)</option>
                <option value={3}>3 Hints</option>
              </select>
            </div>

            <div>
              <label htmlFor="category-select" className="block text-slate-600 mb-1">Word Category</label>
              <select
                id="category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as WordCategory)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-bold"
              >
                <option value="mixed">Mixed (All Categories)</option>
                <option value="animals">Animals 🦁</option>
                <option value="food">Food & Drinks 🍕</option>
                <option value="objects">Objects & Tools 🎸</option>
                <option value="places">Places & Monuments 🏰</option>
                <option value="verbs">Actions & Verbs 🏃</option>
              </select>
            </div>
          </div>

          {/* Custom Words */}
          <div>
            <div className="flex items-center gap-1.5 text-slate-600 mb-1">
              <BookOpen size={14} />
              <label htmlFor="custom-words-input">Custom Words (Optional, comma separated)</label>
            </div>
            <textarea
              id="custom-words-input"
              value={customWordsText}
              onChange={(e) => setCustomWordsText(e.target.value)}
              placeholder="e.g. superhero, telescope, spiderman, matrix, espresso"
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 text-xs font-normal"
            />
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-sky-600 hover:bg-sky-700 active:scale-98 text-white font-bold rounded-xl shadow-md border-2 border-sky-700 transition-all"
            >
              <Save size={16} />
              Save Room Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
