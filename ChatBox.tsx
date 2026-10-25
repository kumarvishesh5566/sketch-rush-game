import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/game';
import { Send, Sparkles, AlertCircle } from 'lucide-react';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
  hasGuessed?: boolean;
  isDrawer?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  disabled = false,
  placeholder = 'Type your guess or chat here...',
  hasGuessed = false,
  isDrawer = false,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || disabled) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const dynamicPlaceholder = isDrawer
    ? "You're drawing! Chat is disabled for drawer."
    : hasGuessed
    ? "You've guessed the word! Chat with other winners..."
    : placeholder;

  return (
    <div className="w-64 sm:w-80 bg-white rounded-xl shadow-md border-2 border-slate-200 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-sky-600 px-3 py-2 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
        <span>Chat & Guesses</span>
        <span className="text-[10px] text-sky-200">Live</span>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 text-xs bg-slate-50/50 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 py-6 italic text-[11px]">
            No messages yet. Type a guess to score points!
          </div>
        )}

        {messages.map((msg) => {
          if (msg.type === 'correct') {
            return (
              <div
                key={msg.id}
                className="bg-emerald-100/90 text-emerald-900 border border-emerald-300 px-2 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-2xs"
              >
                <Sparkles size={13} className="text-emerald-600 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'close') {
            return (
              <div
                key={msg.id}
                className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-md font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <AlertCircle size={13} className="text-amber-600 shrink-0" />
                <span>{msg.text}</span>
              </div>
            );
          }

          if (msg.type === 'system') {
            return (
              <div
                key={msg.id}
                className="text-center text-slate-500 font-medium text-[11px] py-0.5 bg-slate-200/50 rounded"
              >
                {msg.text}
              </div>
            );
          }

          return (
            <div key={msg.id} className="text-slate-800 break-words leading-tight py-0.5">
              <span className="font-bold text-sky-800 mr-1.5">
                {msg.senderName}:
              </span>
              <span>{msg.text}</span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-2 bg-white border-t border-slate-200 flex items-center gap-1.5"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={disabled || isDrawer}
          placeholder={dynamicPlaceholder}
          aria-label="Guess or chat input"
          maxLength={60}
          className="flex-1 px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled || isDrawer || !inputText.trim()}
          aria-label="Send message"
          className="p-2 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 text-white rounded-lg transition-colors shadow-xs active:scale-95"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
