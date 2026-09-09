import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => {
        let bg = 'bg-slate-900 text-white';
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-emerald-800 text-emerald-50 border border-emerald-700 shadow-emerald-950/20';
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-rose-900 text-rose-50 border border-rose-800 shadow-rose-950/20';
          icon = <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-amber-900 text-amber-50 border border-amber-800 shadow-amber-950/20';
          icon = <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />;
        } else if (toast.type === 'info') {
          bg = 'bg-blue-900 text-blue-50 border border-blue-800 shadow-blue-950/20';
          icon = <Info className="w-5 h-5 text-blue-300 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bg}`}
          >
            {icon}
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              id={`btn-dismiss-${toast.id}`}
              onClick={() => onDismiss(toast.id)}
              className="text-white/70 hover:text-white p-1 rounded-md transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
