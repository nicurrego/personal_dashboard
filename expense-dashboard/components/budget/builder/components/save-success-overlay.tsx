'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface SaveSuccessOverlayProps {
  isVisible: boolean;
  message?: string;
  onComplete?: () => void;
}

export function SaveSuccessOverlay({
  isVisible,
  message = "Budget Saved!",
  onComplete
}: SaveSuccessOverlayProps) {
  const [phase, setPhase] = useState<'hidden' | 'appearing' | 'visible' | 'disappearing'>('hidden');

  // Use ref to keep callback stable and prevent effect re-runs
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isVisible) {
      setPhase('appearing');

      // Transition to visible
      const appearTimer = setTimeout(() => {
        setPhase('visible');
      }, 100);

      // Start disappearing after 1.8s
      const disappearTimer = setTimeout(() => {
        setPhase('disappearing');
      }, 1800);

      // Complete and callback after full animation (2.5s total)
      const completeTimer = setTimeout(() => {
        setPhase('hidden');
        onCompleteRef.current?.();
      }, 2500);

      return () => {
        clearTimeout(appearTimer);
        clearTimeout(disappearTimer);
        clearTimeout(completeTimer);
      };
    }
  }, [isVisible]); // Only depend on isVisible, not onComplete

  if (phase === 'hidden') return null;

  return (
    <div
      className={`fixed inset-0 z-[200] flex items-center justify-center pointer-events-none transition-all duration-500 ${phase === 'appearing' || phase === 'visible'
          ? 'opacity-100'
          : 'opacity-0'
        }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/90" />

      {/* Content Container */}
      <div
        className={`relative flex flex-col items-center gap-6 transition-all duration-700 ease-out ${phase === 'visible'
            ? 'scale-100 translate-y-0'
            : phase === 'appearing'
              ? 'scale-90 translate-y-4'
              : 'scale-110 -translate-y-4'
          }`}
      >
        {/* Glow ring animation */}
        <div className="relative">
          {/* Outer glow rings */}
          {/* Outer glow rings - minimalist: remove blur and ping, keep simple pulse */}
          <div className="absolute inset-0 -m-8 rounded-full bg-[var(--color-total)]/10 animate-pulse" />

          {/* Success icon container */}
          <div className="relative w-24 h-24 rounded-full bg-[var(--color-total)]/20 border-2 border-[var(--color-total)] flex items-center justify-center shadow-lg">
            <CheckCircle
              className={`w-12 h-12 text-[var(--color-total)] transition-all duration-500 ${phase === 'visible' ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
                }`}
              strokeWidth={2.5}
            />
          </div>

          {/* Sparkle decorations */}
          <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-[var(--color-present)] animate-pulse" />
          <Sparkles className="absolute -bottom-1 -left-3 w-5 h-5 text-[var(--color-living)] animate-pulse" style={{ animationDelay: '0.3s' }} />
          <Sparkles className="absolute top-1/2 -right-6 w-4 h-4 text-[var(--color-future)] animate-pulse" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Message */}
        <div
          className={`text-center transition-all duration-500 delay-200 ${phase === 'visible' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
        >
          <h2 className="text-2xl font-bold text-foreground mb-2">{message}</h2>
          <p className="text-muted-foreground text-sm">Redirecting to budget overview...</p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r from-[var(--color-total)] to-[var(--color-living)] rounded-full transition-all ease-linear ${phase === 'visible' || phase === 'disappearing' ? 'w-full' : 'w-0'
              }`}
            style={{ transitionDuration: '1.5s' }}
          />
        </div>
      </div>
    </div>
  );
}
