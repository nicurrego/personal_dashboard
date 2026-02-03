'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { triggerHaptic } from '../../utils/formatters';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import type { BudgetPercentages } from '../summary-card';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  percentages: BudgetPercentages;
}

export function ExplanationModal({ isOpen, onClose, percentages }: ExplanationModalProps) {
  const [modalPage, setModalPage] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && modalPage === 1) {
      setModalPage(2);
      triggerHaptic();
    }
    if (isRightSwipe && modalPage === 2) {
      setModalPage(1);
      triggerHaptic();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300 pointer-events-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative bg-card border border-border rounded-[2rem] max-w-lg w-full p-8 shadow-xl animate-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
        onTouchStart={(e) => {
          setTouchEnd(null);
          setTouchStart(e.targetTouches[0].clientX);
        }}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={handleSwipe}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-2"
        >
          <X className="w-5 h-5 ml-auto" />
        </button>

        <div className="flex flex-col items-center text-center">
          {modalPage === 1 ? (
            <div className="animate-in slide-in-from-right-4 duration-300 w-full">
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">Budget Strategy</h2>
              <p className="text-muted-foreground text-sm mb-8">Your current allocation across the Three Buckets.</p>

              <div className="space-y-6 text-left w-full">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-lg" style={{ color: CATEGORY_COLORS.FUTURE }}>{percentages.future}%</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-bold uppercase text-[10px] tracking-widest mb-1" style={{ color: CATEGORY_COLORS.FUTURE }}>Future (Savings)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Safety, investments, and retirement. This buys your freedom.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-lg" style={{ color: CATEGORY_COLORS.LIVING }}>{percentages.living}%</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-bold uppercase text-[10px] tracking-widest mb-1" style={{ color: CATEGORY_COLORS.LIVING }}>Living (Needs)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Rent, health, and utilities. Your baseline for stability.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center flex-shrink-0">
                    <span className="font-mono font-bold text-lg" style={{ color: CATEGORY_COLORS.PRESENT }}>{percentages.present}%</span>
                  </div>
                  <div className="flex flex-col justify-center">
                    <h4 className="font-bold uppercase text-[10px] tracking-widest mb-1" style={{ color: CATEGORY_COLORS.PRESENT }}>Present (Wants)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">Entertainment and lifestyle. For today's enjoyment.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right-4 duration-300 w-full">
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">How the Math Works</h2>
              <p className="text-muted-foreground text-sm mb-8">Understanding the numbers behind your plan.</p>

              <div className="space-y-6 text-left w-full">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Allocation Distribution</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Total Calculation sum up every dollar in <span className="text-foreground font-medium">Future + Living + Present</span>.
                    Percentages reveal how you distribute your spending/saving power across these buckets.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Net Cash Flow</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-medium">Income - All Allocations</span>.
                    Positive (White) means unallocated cash. Negative (<span className="text-destructive">Red</span>) means you're planning more than you earn.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-8 w-full">
            <div className="flex justify-center gap-1.5 mb-6">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${modalPage === 1 ? 'bg-foreground' : 'bg-muted-foreground/30'}`} />
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${modalPage === 2 ? 'bg-foreground' : 'bg-muted-foreground/30'}`} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted font-bold"
                onClick={() => {
                  if (modalPage === 1) onClose();
                  else setModalPage(1);
                }}
              >
                {modalPage === 1 ? 'Close' : 'Back'}
              </Button>
              <Button
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
                onClick={() => {
                  if (modalPage === 2) onClose();
                  else setModalPage(2);
                }}
              >
                {modalPage === 1 ? 'Math Logic' : 'Got it!'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
