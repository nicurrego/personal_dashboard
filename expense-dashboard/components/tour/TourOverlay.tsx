'use client';

import React, { useState } from 'react';
import { useTour } from '@/context/TourContext';
import { Maximize2, Minimize2 } from 'lucide-react';

export function TourOverlay() {
    const { isTourActive, currentStep, nextStep, prevStep, endTour, currentStepIndex } = useTour();
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (!isTourActive || !currentStep) return null;

    const isLastStep = currentStep.label === 'Finished!';

    // Collapsed State: Small floating pill
    if (isCollapsed) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999] animate-in fade-in slide-in-from-bottom-5">
                <button
                    onClick={() => setIsCollapsed(false)}
                    className="flex items-center gap-3 pl-4 pr-3 py-3 rounded-full 
                     bg-[#1B4034] border border-[#A9D9C7] shadow-xl 
                     text-white hover:bg-[#1B4034]/90 transition-all hover:scale-105"
                >
                    <span className="font-semibold text-sm">Tour: {currentStep.label}</span>
                    <div className="p-1.5 rounded-full bg-[#A9D9C7]/20">
                        <Maximize2 className="w-4 h-4 text-[#A9D9C7]" />
                    </div>
                </button>
            </div>
        );
    }

    // Expanded State: Full Card
    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex flex-col items-center justify-end pb-24 sm:justify-end sm:pb-12 md:justify-end">
            <div className="pointer-events-auto bg-[#1B4034] border-2 border-[#A9D9C7] rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-4 animate-in slide-in-from-bottom-10 fade-in duration-300 relative">

                {/* Header Row */}
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{currentStep.label}</h3>
                        <p className="text-secondary-text text-sm leading-relaxed">{currentStep.description}</p>
                    </div>

                    {/* Actions: Minimize & Close */}
                    <div className="flex items-center gap-1 -mr-2 -mt-2">
                        <button
                            onClick={() => setIsCollapsed(true)}
                            className="p-2 text-[#A9D9C7]/50 hover:text-[#A9D9C7] hover:bg-[#A9D9C7]/10 rounded-lg transition-colors"
                            aria-label="Minimize"
                        >
                            <Minimize2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={endTour}
                            className="p-2 text-[#A9D9C7]/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close Tour"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={prevStep}
                        disabled={currentStepIndex === 0}
                        className={`flex-1 py-3 rounded-xl font-medium border border-[#A9D9C7]/30 text-[#A9D9C7] transition-all
                            ${currentStepIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#A9D9C7]/10 active:scale-95'}`}
                    >
                        Back
                    </button>

                    <button
                        onClick={nextStep}
                        className="flex-1 py-3 rounded-xl font-bold bg-[#A9D9C7] text-[#1B4034] hover:bg-white transition-all shadow-lg shadow-[#A9D9C7]/20 active:scale-95"
                    >
                        {isLastStep ? 'Finish' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    );
}
