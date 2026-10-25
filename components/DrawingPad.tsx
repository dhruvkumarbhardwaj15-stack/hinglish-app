import React, { useRef, useState, useEffect, useCallback } from 'react';
import { recognizeDrawing } from '../services/geminiService.ts';
import { DrawingCandidate, DrawingRecognitionResult } from '../types.ts';

interface DrawingPadProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
  onTranslateWord: (text: string) => void;
  onShowToast: (msg: string) => void;
}

export const DrawingPad: React.FC<DrawingPadProps> = ({
  isOpen,
  onClose,
  onInsertText,
  onTranslateWord,
  onShowToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeHistory, setStrokeHistory] = useState<ImageData[]>([]);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<DrawingRecognitionResult | null>(null);
  const [strokeColor, setStrokeColor] = useState<string>('#4f46e5');
  const [strokeWidth, setStrokeWidth] = useState<number>(4);

  // Initialize and size canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(initCanvas, 50);
      setRecognitionResult(null);
      setHasStrokes(false);
      setStrokeHistory([]);
    }
  }, [isOpen, initCanvas]);

  const saveStrokeState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const current = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setStrokeHistory(prev => [...prev.slice(-15), current]);
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveStrokeState();
    setIsDrawing(true);
    setHasStrokes(true);

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.closePath();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasStrokes(false);
    setStrokeHistory([]);
    setRecognitionResult(null);
  };

  const handleUndo = () => {
    if (strokeHistory.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = strokeHistory[strokeHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setStrokeHistory(prev => prev.slice(0, -1));
    if (strokeHistory.length <= 1) {
      setHasStrokes(false);
    }
  };

  const handleRecognize = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) {
      onShowToast("Please draw or write something on the pad first.");
      return;
    }

    setIsRecognizing(true);
    try {
      // Export canvas as image data
      const dataUrl = canvas.toDataURL('image/png');
      const result = await recognizeDrawing(dataUrl);
      
      if (result.candidates && result.candidates.length > 0) {
        setRecognitionResult(result);
      } else if (result.primaryHinglish || result.primaryHindi) {
        setRecognitionResult(result);
      } else {
        onShowToast("Could not recognize drawing. Try drawing more clearly.");
      }
    } catch (err) {
      console.error(err);
      onShowToast("Recognition error. Please try again.");
    } finally {
      setIsRecognizing(false);
    }
  };

  const handleSelectCandidate = (candidate: DrawingCandidate) => {
    // Insert into input text box
    onInsertText(candidate.hinglish || candidate.hindi);
    onShowToast(`Inserted "${candidate.hinglish || candidate.hindi}" (${candidate.english || candidate.hindi})`);
  };

  const handleTranslateDirectly = (candidate: DrawingCandidate) => {
    onTranslateWord(candidate.hinglish || candidate.hindi);
    onShowToast(`Translating "${candidate.hinglish || candidate.hindi}"...`);
  };

  if (!isOpen) return null;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-2 border-indigo-200 dark:border-indigo-900/60 rounded-2xl shadow-lg p-4 sm:p-5 transition-all mb-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">
                Draw or Write to Translate
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Optional
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Draw an object (cat 🐱, house 🏠, car 🚗) or write letters/words by hand
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close drawing pad"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Canvas Area */}
      <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white touch-none">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 sm:h-56 cursor-crosshair block"
        />

        {!hasStrokes && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-300 dark:text-slate-400/60 p-4 select-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-1.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-sm font-medium">Draw an object or write words here</span>
          </div>
        )}
      </div>

      {/* Toolbar & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5">
        {/* Stroke controls */}
        <div className="flex items-center space-x-2">
          {/* Colors */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {[
              { color: '#4f46e5', label: 'Indigo' },
              { color: '#0f172a', label: 'Black' },
              { color: '#dc2626', label: 'Red' },
              { color: '#059669', label: 'Green' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => setStrokeColor(c.color)}
                style={{ backgroundColor: c.color }}
                className={`w-5 h-5 rounded-full transition-transform ${strokeColor === c.color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'opacity-70 hover:opacity-100'}`}
                title={c.label}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300">
            <button
              type="button"
              onClick={() => setStrokeWidth(3)}
              className={`px-1.5 py-0.5 rounded ${strokeWidth === 3 ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
            >
              Thin
            </button>
            <button
              type="button"
              onClick={() => setStrokeWidth(5)}
              className={`px-1.5 py-0.5 rounded ${strokeWidth === 5 ? 'bg-white dark:bg-slate-700 shadow-xs' : ''}`}
            >
              Thick
            </button>
          </div>

          {/* Undo & Clear */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={strokeHistory.length === 0}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            title="Undo stroke"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleClear}
            disabled={!hasStrokes}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Clear
          </button>
        </div>

        {/* Recognize Button */}
        <button
          type="button"
          onClick={handleRecognize}
          disabled={!hasStrokes || isRecognizing}
          className={`px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center space-x-2
            ${!hasStrokes || isRecognizing
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-95'}`}
        >
          {isRecognizing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Recognizing...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Recognize Drawing</span>
            </>
          )}
        </button>
      </div>

      {/* Google Translate Style Recognition Suggestion Strip */}
      {recognitionResult && (
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>✨ Recognized as:</span>
              <strong className="text-indigo-600 dark:text-indigo-400 normal-case">
                {recognitionResult.description || recognitionResult.primaryHinglish}
              </strong>
            </span>
            <span className="text-[11px] text-slate-400">Click word to insert or translate</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {recognitionResult.candidates && recognitionResult.candidates.map((cand, idx) => (
              <div
                key={idx}
                className="group relative flex items-center bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-xl p-1.5 transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => handleSelectCandidate(cand)}
                  className="flex flex-col text-left px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  title="Insert into text input"
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {cand.hinglish}
                    </span>
                    <span className="font-hindi text-base font-bold text-indigo-600 dark:text-indigo-400 leading-none">
                      {cand.hindi}
                    </span>
                  </div>
                  {cand.english && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 capitalize">
                      {cand.english}
                    </span>
                  )}
                </button>

                <div className="border-l border-slate-200 dark:border-slate-700 pl-1 ml-0.5 flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => handleSelectCandidate(cand)}
                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    title="Insert word"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTranslateDirectly(cand)}
                    className="p-1 rounded text-slate-400 hover:text-emerald-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    title="Translate now"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
