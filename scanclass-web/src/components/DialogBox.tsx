import React from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'alert' | 'confirm' | 'success' | 'error';
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const DialogBox: React.FC<DialogProps> = ({
  isOpen, title, message, type = 'alert', onConfirm, onCancel, confirmText = 'Acknowledge', cancelText = 'Abort'
}) => {
  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case 'success': return { icon: <CheckCircle size={36} />, color: 'text-cyan-400', glow: 'shadow-cyan-500/20', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
      case 'error': return { icon: <XCircle size={36} />, color: 'text-rose-500', glow: 'shadow-rose-500/20', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
      case 'confirm': return { icon: <AlertTriangle size={36} />, color: 'text-amber-400', glow: 'shadow-amber-500/20', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      default: return { icon: <Info size={36} />, color: 'text-purple-400', glow: 'shadow-purple-500/20', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
    }
  };

  const theme = getTheme();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030509]/80 backdrop-blur-md animate-fade-in">
      {/* 3D Floating Glass Panel */}
      <div className={`w-full max-w-sm rounded-3xl p-1 bg-gradient-to-b from-white/10 to-white/5 shadow-2xl ${theme.glow} transform transition-all animate-fade-in-up`}>
        <div className="bg-[#0A0F1C]/90 backdrop-blur-2xl rounded-[23px] p-8 border border-white/5 flex flex-col items-center text-center relative overflow-hidden">
          
          {/* Subtle background flare inside the modal */}
          <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[50px] ${theme.bg}`}></div>

          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border ${theme.border} ${theme.bg} ${theme.color} shadow-lg backdrop-blur-md`}>
            {theme.icon}
          </div>
          
          <h3 className="text-2xl font-black mb-3 tracking-wide text-white">{title}</h3>
          <p className="text-sm mb-8 text-slate-400 leading-relaxed font-medium">{message}</p>
          
          <div className="flex gap-4 w-full">
            {type === 'confirm' && onCancel && (
              <button onClick={onCancel} className="flex-1 py-4 rounded-xl font-bold tracking-wider text-xs uppercase border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                {cancelText}
              </button>
            )}
            <button onClick={onConfirm} className={`flex-1 py-4 rounded-xl font-bold tracking-wider text-xs uppercase transition-all shadow-lg text-black bg-gradient-to-r hover:scale-[1.02] active:scale-95 ${
              type === 'error' ? 'from-rose-500 to-rose-400 hover:shadow-rose-500/25' : 
              type === 'confirm' ? 'from-amber-400 to-amber-300 hover:shadow-amber-500/25' : 
              'from-cyan-400 to-cyan-300 hover:shadow-cyan-500/25'
            }`}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};