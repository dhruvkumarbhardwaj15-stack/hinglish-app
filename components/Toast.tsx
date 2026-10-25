
import React from 'react';

interface ToastProps {
  message: string;
}

const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
      <div className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center space-x-3">
        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-sm font-bold tracking-tight">{message}</span>
      </div>
    </div>
  );
};

export default Toast;
