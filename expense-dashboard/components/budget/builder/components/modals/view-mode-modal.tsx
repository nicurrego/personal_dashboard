'use client';

import { X } from 'lucide-react';
import type { ViewMode } from '../../types';
import { triggerHaptic } from '../../utils/formatters';

interface ViewModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  startYear: number;
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'MONTHLY', label: 'Monthly' },
  { id: 'QUARTERLY', label: 'Quarterly' },
  { id: 'SEMESTRAL', label: 'Semestral' },
  { id: 'YEARLY', label: 'Annual' },
];

export function ViewModeModal({ isOpen, onClose, viewMode, onViewModeChange, startYear }: ViewModeModalProps) {
  if (!isOpen) return null;
  
  const allModes = [
    ...VIEW_MODES,
    { id: '5_YEARS' as ViewMode, label: `${startYear}-${startYear + 4}` }
  ];
  
  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] p-4 animate-in slide-in-from-bottom-full duration-300 pointer-events-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-zinc-950 border-t border-white/10 rounded-t-[2.5rem] p-8 pb-10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2"
        >
          <X className="w-5 h-5 ml-auto" />
        </button>
        
        <h3 className="text-center text-lg font-bold text-white mb-6 pt-4">Select View Mode</h3>
        <div className="grid grid-cols-1 gap-3">
          {allModes.map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                onViewModeChange(mode.id);
                onClose();
                triggerHaptic();
              }}
              className={`p-4 rounded-xl font-medium transition-all ${viewMode === mode.id ? 'bg-white text-black font-bold' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
