'use client';

import { useState } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '../../utils/formatters';

const TIPS = [
  { title: "Edit Categories", desc: "Tap the pencil icon in the header to unlock category editing. Then tap any category name to rename it." },
  { title: "Quick Edits", desc: "Tap any budget cell to open the quick-edit panel. It auto-formats your numbers as you type!" },
  { title: "Hide Columns", desc: "Long-press any month header to hide that column and focus on what matters." },
  { title: "Swipe Navigation", desc: "On mobile, the sidebar auto-closes after you navigate, keeping your view clean." }
];

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TipsModal({ isOpen, onClose }: TipsModalProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentTip < TIPS.length - 1) {
      setCurrentTip(prev => prev + 1);
    }
    if (isRightSwipe && currentTip > 0) {
      setCurrentTip(prev => prev - 1);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div
        className="relative w-full max-w-sm bg-zinc-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-2"
        >
          <X className="w-5 h-5 ml-auto" />
        </button>
        
        <div className="flex flex-col items-center text-center mt-4 mb-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-6 text-white">
            <Lightbulb className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-xl font-bold text-white mb-2">{TIPS[currentTip].title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed min-h-[60px]">
            {TIPS[currentTip].desc}
          </p>
        </div>
        
        {/* Dots & Nav */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-center gap-2">
            {TIPS.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentTip ? 'bg-white w-4' : 'bg-white/10'}`}
              />
            ))}
          </div>
          
          <div className="flex justify-between items-center px-2">
            <div /> {/* Spacer */}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                if (currentTip < TIPS.length - 1) {
                  setCurrentTip(prev => prev + 1);
                } else {
                  onClose();
                }
                triggerHaptic();
              }}
              className="bg-white text-black hover:bg-slate-200 rounded-full px-6"
            >
              {currentTip === TIPS.length - 1 ? 'Got it' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
