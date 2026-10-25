import React, { useState } from 'react';
import { HindiResult, WordMetadata } from '../types';
import CopyButtonDemo from './CopyButton';

interface ResultDisplayProps {
  results: HindiResult[];
  words: WordMetadata[];
  onUpdateWordSelection: (wordIdx: number, hindiSpelling: string) => void;
  onCopy: (text: string) => void;
  isLoading: boolean;
  onOpenGoogleDocs?: () => void;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  results, 
  words, 
  onUpdateWordSelection, 
  onCopy, 
  isLoading,
  onOpenGoogleDocs
}) => {
  const [activeWordIdx, setActiveWordIdx] = useState<number | null>(null);

  if (isLoading && words.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-md w-1/4 animate-pulse"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-1/5 animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-xl w-24 animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
        <p className="text-slate-400 dark:text-slate-500 font-medium">Devanagari output will appear here...</p>
        <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Type something and press Enter ↵ or click Translate</p>
      </div>
    );
  }

  const countWAlternatives = words.filter(w => w.alternatives && w.alternatives.length > 1).length;
  const sentenceText = words.map(w => w.selectedHindi || '').join(' ').trim();

  return (
    <div className="space-y-6">
      {/* Absolute transparent helper backdrop to close popovers when clicking outside */}
      {activeWordIdx !== null && (
        <div 
          className="fixed inset-0 z-15 bg-transparent cursor-default" 
          onClick={() => setActiveWordIdx(null)}
        />
      )}

      {/* Primary Devanagari Output Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm relative z-20">
        {/* On top only output box text is visible */}
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-lg">Output Box</h3>
        </div>

        {/* Below output box text: copy button in the right side */}
        <div className="flex justify-end items-center my-2">
          <CopyButtonDemo
            content={sentenceText}
            onCopy={onCopy}
            variant="default"
            size="default"
          />
        </div>

        {/* All translated text shown minimally - no SVG, only text, double-click for variants */}
        <div className="min-h-[4rem] p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-2 gap-y-2">
          {words.map((word, wordIdx) => {
            const hasAlternatives = word.alternatives && word.alternatives.length > 0;
            const isWordActive = activeWordIdx === wordIdx;
            
            return (
              <div key={wordIdx} className="relative inline-block">
                <button
                  type="button"
                  onDoubleClick={() => {
                    if (hasAlternatives) {
                      setActiveWordIdx(isWordActive ? null : wordIdx);
                    }
                  }}
                  title={hasAlternatives ? "Double-click to view variants" : undefined}
                  className={`cursor-pointer transition-colors focus:outline-none rounded-md px-1.5 py-0.5 font-hindi text-lg sm:text-xl select-none leading-relaxed text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                    isWordActive ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-400' : ''
                  }`}
                >
                  <span>{word.selectedHindi}</span>
                </button>

                {/* Only Variant Words Popover on double-click */}
                {isWordActive && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl p-3.5 z-40 min-w-[200px] max-w-[300px]">
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Variants ({word.original})
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWordIdx(null);
                        }}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    {/* Clean list of variant words only - no explanation text */}
                    <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto">
                      {word.alternatives && word.alternatives.length > 0 ? (
                        word.alternatives.map((alt, altIdx) => {
                          const isCurrentSelection = word.selectedHindi === alt.hindi;
                          return (
                            <button
                              key={altIdx}
                              type="button"
                              onClick={() => {
                                onUpdateWordSelection(wordIdx, alt.hindi);
                                setActiveWordIdx(null);
                              }}
                              className={`w-full rounded-lg py-1.5 px-3 flex items-center justify-between transition-colors text-left
                                ${isCurrentSelection 
                                  ? 'bg-indigo-600 text-white font-bold' 
                                  : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100'}`}
                            >
                              <span className="hindi-font text-xl leading-none">
                                {alt.hindi}
                              </span>

                              {isCurrentSelection && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-2 text-center text-xs text-slate-400 font-hindi text-base font-bold">
                          {word.selectedHindi}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;
