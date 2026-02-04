'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Monitor } from 'lucide-react';
import CreateBudgetWizard from "@/components/budget/create-budget-wizard";

export default function BudgetBuilderPage() {
  const router = useRouter();
  const [showScreenWarning, setShowScreenWarning] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the warning before
    const dismissed = localStorage.getItem('pro_builder_warning_dismissed');
    if (!dismissed) {
      // Check if screen is small (mobile-ish)
      const isSmallScreen = window.innerWidth < 1024;
      if (isSmallScreen) {
        setShowScreenWarning(true);
      }
    }
  }, []);

  const handleDontShowAgain = () => {
    localStorage.setItem('pro_builder_warning_dismissed', 'true');
    setShowScreenWarning(false);
  };

  const handleGotIt = () => {
    setShowScreenWarning(false);
  };

  const handleBackToQuick = () => {
    router.push('/budget/quick');
  };

  return (
    <div className="min-h-screen bg-void-black text-white overflow-x-hidden">
      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto">
        <CreateBudgetWizard
          headerActions={
            <div className="flex items-center gap-4">
              <Link
                href="/budget/quick"
                className="flex items-center gap-2 text-secondary-text hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <span className="text-lg font-semibold text-white">Pro Builder</span>
            </div>
          }
        />
      </div>

      {/* Screen Size Warning Modal */}
      {showScreenWarning && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#1B4034]/80 backdrop-blur-sm">
          <div className="bg-[#1B4034] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-alert-amber/20 flex items-center justify-center">
              <Monitor className="w-8 h-8 text-alert-amber" />
            </div>

            {/* Content */}
            <h2 className="text-xl font-bold text-white text-center mb-2">
              Best on Larger Screens
            </h2>
            <p className="text-[#A9D9C7] text-sm text-center mb-6 leading-relaxed">
              The Pro Budget Builder works best on tablets, laptops, or desktop computers.
              For the best experience, consider using a larger screen or try the Quick Budget Builder for mobile.
            </p>

            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={handleGotIt}
                className="w-full py-3 rounded-xl font-semibold bg-[#A9D9C7] text-[#1B4034] hover:brightness-110 transition-all"
              >
                Got it, continue anyway
              </button>
              <button
                onClick={handleBackToQuick}
                className="w-full py-3 rounded-xl font-semibold bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all"
              >
                Back to Quick Builder
              </button>
              <button
                onClick={handleDontShowAgain}
                className="w-full py-2 text-xs text-secondary-text hover:text-white transition-colors"
              >
                Don't show this again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
