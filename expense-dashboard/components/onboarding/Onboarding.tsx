'use client';

import React from 'react';
import Link from 'next/link';
import { useTour } from '@/context/TourContext';

interface OnboardingProps {
  userName?: string;
}

export function Onboarding({ userName }: OnboardingProps) {
  const { startTour } = useTour();
  return (
    <div className="min-h-screen bg-[#1B4034] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-cyber-cyan/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[400px] h-[400px] bg-growth-green/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-lg w-full relative z-10">
        {/* Welcome Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Welcome{userName ? `, ${userName}` : ''}! 👋
          </h1>
          <p className="text-secondary-text text-lg">
            Let&apos;s set up your personal expense tracker
          </p>
        </div>

        {/* App Explanation */}
        <div className="liquid-card p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">What is Kibo?</h2>
          <ul className="space-y-3 text-secondary-text">
            <li className="flex items-start gap-3">
              <span className="text-cyber-cyan text-lg">📊</span>
              <span><strong className="text-white">Track Expenses</strong> - Log every transaction with categories, shops, and context</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-growth-green text-lg">💰</span>
              <span><strong className="text-white">Set Budgets</strong> - Define monthly spending limits by category</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-flux-violet text-lg">📈</span>
              <span><strong className="text-white">Visual Analytics</strong> - See where your money goes with charts and insights</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-alert-amber text-lg">⚡</span>
              <span><strong className="text-white">Quick Entry</strong> - Mobile-first fast expense logging</span>
            </li>
          </ul>
        </div>

        {/* Action Options */}
        <div className="space-y-4">
          <h3 className="text-center text-secondary-text font-medium mb-4">
            Ready to explore?
          </h3>

          <button
            onClick={startTour}
            id="start-tour-btn"
            className="w-full py-4 rounded-xl font-bold text-lg
                       bg-gradient-to-r from-cyber-cyan to-growth-green text-white
                       hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] 
                       hover:scale-[1.01] active:scale-[0.99]
                       transition-all duration-200"
          >
            Start Tour
          </button>
        </div>

        {/* Footer tip */}
        <p className="text-center text-secondary-text/50 text-xs mt-8">
          You can always import data or add transactions later from the menu
        </p>
      </div>
    </div>
  );
}
