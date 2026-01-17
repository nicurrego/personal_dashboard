'use client';

import React from 'react';
import Link from 'next/link';

interface OnboardingProps {
  userName?: string;
}

export function Onboarding({ userName }: OnboardingProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
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
          <h2 className="text-xl font-semibold text-white mb-4">What is Expense.OS?</h2>
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
            How would you like to start?
          </h3>

          {/* Option 1: Add First Transaction */}
          <Link href="/quick-entry" className="block">
            <div className="liquid-card p-6 border-l-4 border-l-growth-green hover:bg-white/5 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-1">Add First Transaction</h4>
                  <p className="text-secondary-text text-sm">Start fresh with a single expense entry</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-growth-green/20 flex items-center justify-center group-hover:bg-growth-green/30 transition-colors">
                  <span className="text-2xl">+</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Option 2: Upload CSV */}
          <Link href="/upload" className="block">
            <div className="liquid-card p-6 border-l-4 border-l-cyber-cyan hover:bg-white/5 transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-semibold text-white mb-1">Import Existing Data</h4>
                  <p className="text-secondary-text text-sm">Upload a CSV file with your expense history</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-cyber-cyan/20 flex items-center justify-center group-hover:bg-cyber-cyan/30 transition-colors">
                  <svg className="w-6 h-6 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          {/* Option 3: Explore Empty Dashboard */}
          <Link href="/dashboard?skip-onboarding=true" className="block">
            <div className="liquid-card p-6 border-l-4 border-l-white/30 hover:bg-white/5 transition-all group opacity-70 hover:opacity-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-white mb-1">Skip for Now</h4>
                  <p className="text-secondary-text text-sm">Explore the dashboard first</p>
                </div>
                <span className="text-secondary-text group-hover:text-white transition-colors">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer tip */}
        <p className="text-center text-secondary-text/50 text-xs mt-8">
          You can always import data or add transactions later from the menu
        </p>
      </div>
    </div>
  );
}
