'use client';

import React from 'react';
import { QuickEntryStep } from '@/types';

const STEPS: QuickEntryStep[] = [
  'amount',
  'target',    // Target first
  'category',  // Category second (filtered by target)
  'shop',
  'method',
  'location',
  'item',      // Renamed from 'detail'
  'context',
  'feeling',   // How did you feel?
  'review'
];

interface ProgressIndicatorProps {
  currentStep: QuickEntryStep;
}

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = STEPS.indexOf(currentStep);
  const progress = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="w-full px-4 py-3">
      {/* Progress bar container */}
      <div className="relative h-1 bg-white/10 rounded-full overflow-hidden">
        {/* Animated progress fill */}
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out bg-[#A9D9C7]"
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      {/* Step counter */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs text-secondary-text font-medium">
          Step {currentIndex + 1} of {STEPS.length}
        </span>
        <span className="text-xs text-secondary-text capitalize">
          {currentStep}
        </span>
      </div>
    </div>
  );
}
