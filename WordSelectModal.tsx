import React from 'react';
import { Sparkles, Clock } from 'lucide-react';

interface WordSelectModalProps {
  words: string[];
  timeLeft: number;
  onSelectWord: (word: string) => void;
}

export const WordSelectModal: React.FC<WordSelectModalProps> = ({
  words,
  timeLeft,
  onSelectWord,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border-4 border-sky-400 p-6 max-w-md w-full text-center space-y-5">
        <div className="flex items-center justify-center gap-2 text-sky-600 font-extrabold text-xl">
          <Sparkles className="animate-spin" size={24} />
          <h2>Choose a Word to Draw!</h2>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-amber-600 bg-amber-50 py-1 px-3 rounded-full w-fit mx-auto border border-amber-200">
          <Clock size={16} />
          <span>{timeLeft}s remaining</span>
        </div>

        <p className="text-xs text-slate-500">
          Pick one of the words below. If the timer runs out, a word will be chosen automatically.
        </p>

        <div className="grid grid-cols-1 gap-3 pt-2">
          {words.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onSelectWord(word)}
              className="py-3 px-4 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-black text-lg rounded-xl shadow-md border-2 border-sky-600 transition-all uppercase tracking-wider hover:shadow-lg"
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
