
import React, { useState, useEffect, useCallback } from 'react';
import { transliterateHinglish } from './services/geminiService.ts';
import { clearCorruptedCache, fastLocalTransliterate } from './services/fastDictionary.ts';
import { HindiResult, HistoryItem, WordMetadata } from './types.ts';
import Header from './components/Header.tsx';
import InputArea from './components/InputArea.tsx';
import ResultDisplay from './components/ResultDisplay.tsx';
import HistoryPanel from './components/HistoryPanel.tsx';
import Toast from './components/Toast.tsx';
import { GoogleDocsModal } from './components/GoogleDocsModal.tsx';
import { DrawingPad } from './components/DrawingPad.tsx';

const App: React.FC = () => {
  const [input, setInput] = useState('');
  const [results, setResults] = useState<HindiResult[]>([]);
  const [words, setWords] = useState<WordMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isGoogleDocsOpen, setIsGoogleDocsOpen] = useState(false);
  const [isDrawingOpen, setIsDrawingOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('hinglish_history');
    clearCorruptedCache();
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Error loading history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('hinglish_history', JSON.stringify(history.slice(0, 10)));
  }, [history]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const executeTransliteration = useCallback(async (textToConvert: string, recordHistory: boolean = true) => {
    const trimmed = textToConvert.trim();
    if (!trimmed) {
      setResults([]);
      setWords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Instant preview: every word converted locally (dictionary + phonetic), refined by AI below
    const instantData = fastLocalTransliterate(trimmed);
    if (instantData.words.length > 0) {
      setResults(instantData.results);
      setWords(instantData.words);
    }

    try {
      // Complete, pure Devanagari transliteration via Gemini AI (one output word per input word)
      const data = await transliterateHinglish(trimmed);
      if (data && data.words && data.words.length > 0) {
        setResults(data.results);
        setWords(data.words);

        if (recordHistory) {
          const newItem: HistoryItem = {
            id: Date.now().toString(),
            input: trimmed,
            results: data.results,
            words: data.words,
            timestamp: Date.now()
          };
          setHistory(prev => [newItem, ...prev.filter(h => h.input !== trimmed)].slice(0, 10));
        }
      }
    } catch (error) {
      console.error("Transliteration failed:", error);
      showToast("Translation failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Submit translation on Enter or button click
  const handleSubmit = () => {
    executeTransliteration(input, true);
  };

  const handleInsertDrawnWord = (wordText: string) => {
    setInput(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${wordText}` : wordText;
    });
  };

  const handleTranslateDrawnWord = (wordText: string) => {
    const trimmed = input.trim();
    const updated = trimmed ? `${trimmed} ${wordText}` : wordText;
    setInput(updated);
    executeTransliteration(updated, true);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setInput(item.input);
    setResults(item.results);
    setWords(item.words || []);
  };

  const handleUpdateWordSelection = (wordIndex: number, hindiSpelling: string) => {
    setWords(prev => {
      const updated = [...prev];
      if (updated[wordIndex]) {
        updated[wordIndex] = {
          ...updated[wordIndex],
          selectedHindi: hindiSpelling
        };
      }
      return updated;
    });
  };

  const finalHindiText = words.map(w => w.selectedHindi).join(' ');

  return (
    <div className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="max-w-5xl mx-auto px-4 mt-8 space-y-8">
        <section className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 md:p-8">
          <InputArea 
            value={input}
            onChange={(val) => {
              const newVal = typeof val === 'function' ? val(input) : val;
              setInput(newVal);
            }}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            finalHindiText={finalHindiText}
            onCopy={handleCopy}
            isDrawingOpen={isDrawingOpen}
            onToggleDrawing={() => setIsDrawingOpen(prev => !prev)}
          />

          {/* Optional Drawing / Handwriting Pad (Google Translate Style) */}
          <div className="mt-4">
            <DrawingPad
              isOpen={isDrawingOpen}
              onClose={() => setIsDrawingOpen(false)}
              onInsertText={handleInsertDrawnWord}
              onTranslateWord={handleTranslateDrawnWord}
              onShowToast={showToast}
            />
          </div>
        </section>

        {/* Full-width Devanagari Output & History stacked vertically */}
        <section className="space-y-8">
          <ResultDisplay 
            results={results} 
            words={words}
            onUpdateWordSelection={handleUpdateWordSelection}
            onCopy={handleCopy} 
            isLoading={isLoading} 
            onOpenGoogleDocs={() => setIsGoogleDocsOpen(true)}
          />
          
          <HistoryPanel 
            history={history} 
            onSelect={handleSelectHistory} 
            onClear={() => {
              setHistory([]);
              localStorage.removeItem('hinglish_history');
            }}
          />
        </section>
      </main>

      {toastMessage && <Toast message={toastMessage} />}
      
      <GoogleDocsModal
        isOpen={isGoogleDocsOpen}
        onClose={() => setIsGoogleDocsOpen(false)}
        textToExport={finalHindiText}
        alternatives={results.map(r => r.hindi)}
        onShowToast={showToast}
      />
    </div>
  );
};

export default App;
