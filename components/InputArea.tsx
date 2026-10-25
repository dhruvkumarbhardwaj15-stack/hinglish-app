
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

interface InputAreaProps {
  value: string;
  onChange: (val: string | ((prev: string) => string)) => void;
  onSubmit: () => void;
  isLoading: boolean;
  finalHindiText?: string;
  onCopy?: (text: string) => void;
  isDrawingOpen?: boolean;
  onToggleDrawing?: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({ 
  value, 
  onChange, 
  onSubmit, 
  isLoading,
  finalHindiText = "",
  onCopy,
  isDrawingOpen = false,
  onToggleDrawing
}) => {
  const [isListening, setIsListening] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Helper functions for audio encoding/decoding as required by Gemini Live API
  function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function createBlob(data: Float32Array): { data: string; mimeType: string } {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Clamping to avoid overflow and internal server errors
      const s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: encode(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  const stopListening = () => {
    setIsListening(false);
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    sessionPromiseRef.current = null;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => stopListening();
  }, []);

  const startListening = async () => {
    try {
      setIsListening(true);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            if (!audioContextRef.current || !streamRef.current) return;
            const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            processorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
              if (sessionPromiseRef.current) {
                const inputData = e.inputBuffer.getChannelData(0);
                const pcmBlob = createBlob(inputData);
                sessionPromiseRef.current.then((session) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                }).catch(() => {});
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              if (text) {
                onChange(prev => {
                  const currentStr = typeof prev === 'string' ? prev : '';
                  const space = currentStr && !currentStr.endsWith(' ') ? ' ' : '';
                  return currentStr + space + text;
                });
              }
            }
          },
          onerror: (e) => {
            console.error('Gemini Live API Error:', e);
            stopListening();
          },
          onclose: () => {
            stopListening();
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          thinkingConfig: { thinkingBudget: 0 }, // Minimize delay for transcription
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'Only transcribe user speech into Romanized Hindi. No conversational output.',
        },
      });

      sessionPromiseRef.current = sessionPromise;
    } catch (err) {
      console.error('Connection failed:', err);
      stopListening();
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5 uppercase tracking-wide">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Hinglish Input
        </label>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded-md">
            Press <kbd className="font-mono bg-white dark:bg-slate-700 px-1 rounded shadow-xs text-[10px] text-slate-600 dark:text-slate-300">Enter ↵</kbd> to translate
          </span>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-semibold bg-slate-100/80 dark:bg-slate-800/80 px-2.5 py-1 rounded-md">
            <span>{wordCount} words</span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span>{value.length} characters</span>
          </div>
        </div>
      </div>
      
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type Hinglish text (e.g. 'namaste aap kaise ho')... Press Enter ↵ or click Translate"
          className="w-full h-44 p-5 text-lg leading-relaxed border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-0 transition-all resize-none bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-slate-100 overflow-y-auto"
          style={{ fontSize: '1.125rem', minHeight: '11rem' }}
          disabled={isLoading}
        />
        
        {isListening && (
          <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500/10 text-red-500 px-3 py-1 rounded-full animate-pulse border border-red-500/20">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Live Voice</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 border-t border-slate-50 dark:border-slate-850 pt-3">
        {/* Left Actions: Clear & Copy Hindi */}
        <div className="flex items-center space-x-2.5 w-full sm:w-auto">
          {value && !isLoading && !isListening && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-500 hover:text-red-500 transition-all flex items-center justify-center space-x-2 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear</span>
            </button>
          )}

          {finalHindiText && onCopy && !isLoading && (
            <button
              onClick={() => onCopy(finalHindiText)}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm border border-indigo-100 dark:border-indigo-900/40 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy Output</span>
            </button>
          )}
        </div>

        {/* Right Actions: Draw Pad (Optional) + Voice & Convert / Enter Button */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {/* Drawing / Handwriting Toggle (Optional feature) */}
          {onToggleDrawing && (
            <button
              type="button"
              onClick={onToggleDrawing}
              disabled={isLoading}
              className={`px-3.5 py-3 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold cursor-pointer shadow-xs border
                ${isDrawingOpen 
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-indigo-400'}`}
              title="Draw or write handwriting to describe words (Google Translate style)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="hidden sm:inline">Draw</span>
            </button>
          )}

          {/* Voice Input */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={isLoading}
            className={`p-3 rounded-xl transition-all flex items-center justify-center shadow-xs cursor-pointer
              ${isListening 
                ? 'bg-red-500 text-white shadow-red-200 dark:shadow-none animate-pulse ring-4 ring-red-500/20' 
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'}`}
            title={isListening ? "Stop Listening" : "Start Voice Input"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          {/* Translate Button */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={isLoading || !value.trim() || isListening}
            className={`px-6 py-3 rounded-xl font-bold text-sm sm:text-base shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer 
              ${isLoading || !value.trim() || isListening
                ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700 active:transform active:scale-95'}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Translating...</span>
              </>
            ) : (
              <>
                <span>Translate</span>
                <kbd className="hidden sm:inline font-mono bg-indigo-500/40 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded">↵</kbd>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
