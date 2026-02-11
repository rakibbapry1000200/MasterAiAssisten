
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import { Message, CreatorInfo, SessionState } from './types';
import { encode, decode, decodeAudioData } from './utils/audio-helpers';
import VoiceVisualizer from './components/VoiceVisualizer';
import ChatHistory from './components/ChatHistory';

const CREATOR_INFO: CreatorInfo = {
  name: "Robiul Islam Rakib",
  image: "https://i.ibb.co.com/sp0gj7cQ/1752748265749.jpg",
  facebook: "https://www.facebook.com/share/1ZG7nwcH2X/",
  whatsapp: "+8801776781995",
  email: "robiulislamrakib591@gmail.com",
  youtube: "https://youtube.com/@robiulislamrakib591-b7t?si=OP8PhPeCn89ZST5p"
};

const SYSTEM_INSTRUCTION = `Name: Master (মাস্টার).
Role: Smart, professional AI Voice Assistant.
Creator: Robiul Islam Rakib (রবীউল ইসলাম রাকিব).
Response Style: Polite, concise, professional, sophisticated.
Rules:
1. All interactions are via voice (displayed in chat).
2. Respond in the same language the user uses (Bengali, English, etc.).
3. If user mentions typing, remind them you are a voice-driven assistant.
4. If asked about creator or origin, say: "I was created by Robiul Islam Rakib (রবীউল ইসলাম রাকিব)."`;

const App: React.FC = () => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showCreator, setShowCreator] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  
  const currentInputTranscriptionRef = useRef('');
  const currentOutputTranscriptionRef = useRef('');

  const stopAllAudio = useCallback(() => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch(e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsSpeaking(false);
  }, []);

  const handleSessionMessage = useCallback(async (message: LiveServerMessage) => {
    // Transcriptions
    if (message.serverContent?.inputTranscription) {
      currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
    }
    if (message.serverContent?.outputTranscription) {
      currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
    }

    if (message.serverContent?.turnComplete) {
      const input = currentInputTranscriptionRef.current.trim();
      const output = currentOutputTranscriptionRef.current.trim();
      
      if (input) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'user',
          text: input,
          timestamp: new Date()
        }]);
      }
      if (output) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          role: 'assistant',
          text: output,
          timestamp: new Date()
        }]);

        // Check for creator mentions in output to trigger the card
        const lowerOutput = output.toLowerCase();
        if (lowerOutput.includes('robiul islam rakib') || lowerOutput.includes('রবীউল ইসলাম রাকিব') || lowerOutput.includes('creator')) {
          setShowCreator(true);
        }
      }

      currentInputTranscriptionRef.current = '';
      currentOutputTranscriptionRef.current = '';
    }

    // Audio Output
    const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (base64Audio && outputAudioContextRef.current) {
      setIsSpeaking(true);
      const ctx = outputAudioContextRef.current;
      nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
      
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        ctx,
        24000,
        1
      );

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      source.onended = () => {
        activeSourcesRef.current.delete(source);
        if (activeSourcesRef.current.size === 0) {
          setIsSpeaking(false);
        }
      };

      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      activeSourcesRef.current.add(source);
    }

    // Interruption
    if (message.serverContent?.interrupted) {
      stopAllAudio();
    }
  }, [stopAllAudio]);

  const startSession = async () => {
    if (sessionState !== SessionState.IDLE) return;

    try {
      setSessionState(SessionState.CONNECTING);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Setup Audio Contexts
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        },
        callbacks: {
          onopen: () => {
            setSessionState(SessionState.ACTIVE);
            setIsListening(true);
            
            // Microphone streaming
            if (audioContextRef.current) {
              const ctx = audioContextRef.current;
              const source = ctx.createMediaStreamSource(stream);
              const scriptProcessor = ctx.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                const pcmBlob = {
                  data: encode(new Uint8Array(int16.buffer)),
                  mimeType: 'audio/pcm;rate=16000'
                };
                
                sessionPromiseRef.current?.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(ctx.destination);
            }
          },
          onmessage: handleSessionMessage,
          onerror: (e) => {
            console.error('Session error:', e);
            setSessionState(SessionState.ERROR);
          },
          onclose: () => {
            setSessionState(SessionState.IDLE);
            setIsListening(false);
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (err) {
      console.error('Failed to start session:', err);
      setSessionState(SessionState.ERROR);
    }
  };

  const endSession = async () => {
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }
    stopAllAudio();
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setSessionState(SessionState.IDLE);
    setIsListening(false);
  };

  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-gray-800 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <span className="font-bold text-white text-xl">M</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Master</h1>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${sessionState === SessionState.ACTIVE ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`}></span>
              <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                {sessionState === SessionState.ACTIVE ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        {sessionState === SessionState.ACTIVE && (
          <button 
            onClick={endSession}
            className="px-4 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-semibold rounded-full border border-red-500/20 transition-all"
          >
            Disconnect
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <ChatHistory messages={messages} creatorInfo={CREATOR_INFO} showCreator={showCreator} />

      {/* Footer Controls */}
      <footer className="p-8 pb-10 flex flex-col items-center gap-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <VoiceVisualizer isListening={isListening} isSpeaking={isSpeaking} />
        
        <div className="relative group">
          {sessionState === SessionState.ACTIVE ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 relative">
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20"></div>
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2">Listening...</p>
            </div>
          ) : (
            <button 
              onClick={startSession}
              disabled={sessionState === SessionState.CONNECTING}
              className="px-10 py-4 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all transform active:scale-95 disabled:opacity-50 shadow-xl shadow-white/10"
            >
              {sessionState === SessionState.CONNECTING ? 'Initializing Master...' : 'Wake Master'}
            </button>
          )}
        </div>
        
        <p className="text-[10px] text-gray-600 font-medium">
          MASTER IS A VOICE-ONLY ASSISTANT. TYPING IS NOT SUPPORTED.
        </p>
      </footer>
    </div>
  );
};

export default App;
