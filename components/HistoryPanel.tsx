
import React from 'react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  history: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onClear: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Recent</h3>
        {history.length > 0 && (
          <button 
            onClick={onClear}
            className="text-[10px] font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 uppercase hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-300 dark:text-slate-600 text-sm font-medium italic">
            No history yet
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
              >
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {item.input}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="hindi-font text-xs text-slate-400 dark:text-slate-500">
                    {item.results[0]?.hindi}
                  </span>
                  <span className="text-[10px] text-slate-300 dark:text-slate-600">
                    • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;