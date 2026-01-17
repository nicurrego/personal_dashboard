'use client';

import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FullEditModalState } from '../../types';
import { formatNumberWithCommas, triggerHaptic } from '../../utils/formatters';

interface FullEditModalProps {
  modal: FullEditModalState;
  onClose: () => void;
  onSave: (categoryId: string, type: 'cell' | 'category', value: string, colIndex?: number, span?: number) => void;
  onDelete?: (categoryId: string, name: string) => void;
}

export function FullEditModal({ modal, onClose, onSave, onDelete }: FullEditModalProps) {
  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (modal.type === 'cell') {
      val = formatNumberWithCommas(val);
    }
    // We need to update the modal state - this is handled by the parent
    // For now, we emit the change via a custom approach
  };
  
  return (
    <div className="fixed inset-0 z-[110] flex flex-col justify-end pointer-events-auto">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm pointer-events-auto animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative w-full bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] p-6 pb-[45vh] shadow-2xl animate-in slide-in-from-bottom-full duration-300 pointer-events-auto h-auto max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2 z-10"
        >
          <X className="w-5 h-5 ml-auto" />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2 mt-4">
            {modal.title}
          </h3>
          <div className="w-full relative mb-6">
            {modal.type === 'cell' && (
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-light text-slate-500">$</span>
            )}
            <input
              autoFocus
              type="text"
              defaultValue={modal.value}
              className={`
                w-full bg-transparent text-center font-mono text-white focus:outline-none 
                ${modal.type === 'cell' ? 'text-5xl py-3 pl-10 pr-4' : 'text-3xl py-2'}
              `}
              placeholder="0"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  triggerHaptic();
                  onSave(modal.categoryId, modal.type, input.value, modal.colIndex, modal.span);
                }
              }}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="col-span-2 flex justify-center gap-4 mb-2">
              {modal.type === 'category' && onDelete && (
                <Button
                  variant="ghost"
                  className="rounded-full text-red-500 hover:text-white hover:bg-red-500/20 px-8 font-bold h-10"
                  onClick={() => {
                    onDelete(modal.categoryId, modal.value);
                    onClose();
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              )}
            </div>
            
            <Button
              variant="ghost"
              className="rounded-full h-12 text-slate-400 hover:text-white hover:bg-white/5 text-base font-bold"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full h-12 bg-white text-black hover:bg-slate-200 text-base font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              onClick={() => {
                const input = document.querySelector('input[autofocus]') as HTMLInputElement;
                triggerHaptic();
                onSave(modal.categoryId, modal.type, input?.value || modal.value, modal.colIndex, modal.span);
              }}
            >
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
