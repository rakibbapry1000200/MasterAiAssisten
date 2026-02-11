
import React, { useEffect, useRef } from 'react';
import { Message, CreatorInfo } from '../types';
import CreatorCard from './CreatorCard';

interface ChatHistoryProps {
  messages: Message[];
  creatorInfo: CreatorInfo;
  showCreator: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, creatorInfo, showCreator }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showCreator]);

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 max-w-2xl mx-auto w-full scroll-smooth"
      style={{ scrollbarWidth: 'none' }}
    >
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-20">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
             <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
             </svg>
          </div>
          <p className="text-lg">Click the button below to start talking to Master.</p>
        </div>
      )}
      
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1 duration-300`}
        >
          <div 
            className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700'
            }`}
          >
            {msg.text}
          </div>
          <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">
            {msg.role === 'user' ? 'You' : 'Master'}
          </span>
        </div>
      ))}

      {showCreator && <CreatorCard info={creatorInfo} />}
    </div>
  );
};

export default ChatHistory;
