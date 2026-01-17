'use client';

import { Button } from '@/components/ui/button';
import type { AlertModalState } from '../../types';

interface AlertModalProps {
  modal: AlertModalState;
}

export function AlertModal({ modal }: AlertModalProps) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={modal.onCancel} 
      />
      <div className="relative w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
        <h3 className="text-xl font-bold text-white mb-2">{modal.title}</h3>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
          {modal.description}
        </p>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={modal.onCancel}
            className="flex-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10"
          >
            {modal.cancelText || 'Cancel'}
          </Button>
          <Button
            onClick={modal.onConfirm}
            className="flex-1 rounded-full bg-white text-black hover:bg-slate-200"
          >
            {modal.confirmText || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
