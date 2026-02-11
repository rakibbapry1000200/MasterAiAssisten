
import React, { useMemo } from 'react';

interface VoiceVisualizerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ isListening, isSpeaking }) => {
  const bars = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <div className="flex items-center justify-center gap-1.5 h-16">
      {bars.map((i) => (
        <div
          key={i}
          className={`w-1.5 bg-blue-500 rounded-full transition-all duration-300 ease-in-out ${
            isListening || isSpeaking
              ? 'animate-pulse'
              : 'h-2 opacity-30'
          }`}
          style={{
            height: isListening || isSpeaking ? `${Math.random() * 40 + 10}px` : '8px',
            animationDelay: `${i * 0.1}s`,
            backgroundColor: isSpeaking ? '#3b82f6' : '#10b981'
          }}
        />
      ))}
    </div>
  );
};

export default VoiceVisualizer;
