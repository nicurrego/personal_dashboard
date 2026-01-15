'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-void-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-cyber-cyan/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-flux-violet/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="text-center mb-12 relative z-10">
        <h2 className="text-label mb-2 text-cyber-cyan">Finance Control Center</h2>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter shadow-lg">
          EXPENSE<span className="text-gray-500">.OS</span>
        </h1>
        <p className="mt-4 text-secondary-text font-mono text-sm tracking-wide">
          SYSTEM V2.0 // BUDGET + EXPENSES + ANALYTICS
        </p>
      </div>

      {/* Main Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Module 1: Dashboard */}
        <Link href="/dashboard" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-growth-green">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-growth-green">MODULE 01</span>
                <div className="w-2 h-2 rounded-full bg-growth-green animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Dashboard</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Visual analytics, KPIs, charts and spending insights.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-growth-green text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all">
                Launch
              </span>
            </div>
          </div>
        </Link>
        
        {/* Module 2: Budget */}
        <Link href="/budget" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-flux-violet">
            <div>
              <div className="flex justify-between items-start mb-4">
                 <span className="text-label text-flux-violet">MODULE 02</span>
                 <div className="w-2 h-2 rounded-full bg-flux-violet animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Budget</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Monthly budget allocations by category. 3 years of data.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-flux-violet text-white px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all">
                View
              </span>
            </div>
          </div>
        </Link>

        {/* Module 3: Expenses Data */}
        <Link href="/expenses" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-cyber-cyan">
            <div>
              <div className="flex justify-between items-start mb-4">
                 <span className="text-label text-cyber-cyan">MODULE 03</span>
                 <div className="w-2 h-2 rounded-full bg-cyber-cyan opacity-70" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Expenses</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Full transaction list with search and pagination.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-glass-surface text-white border border-neutral-700 px-6 py-2 text-sm uppercase tracking-wider group-hover:bg-neutral-800 transition-all">
                Browse
              </span>
            </div>
          </div>
        </Link>

        {/* Module 4: Upload */}
        <Link href="/upload" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-alert-amber">
            <div>
              <div className="flex justify-between items-start mb-4">
                 <span className="text-label text-alert-amber">MODULE 04</span>
                 <div className="w-2 h-2 rounded-full bg-alert-amber opacity-70" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Upload CSV</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Import your own data. Auto-cleaned and validated.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-alert-amber text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all">
                Upload
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Links */}
      <div className="mt-10 relative z-10 flex items-center gap-6">
        <Link href="/basic" className="text-secondary-text hover:text-white text-sm transition-colors">
          Legacy Grid View →
        </Link>
      </div>

      {/* Footer Status */}
      <div className="mt-12 relative z-10 font-mono text-xs text-secondary-text flex items-center gap-4">
         <span>STATUS: <span className="text-growth-green">OPERATIONAL</span></span>
         <span className="opacity-30">|</span>
         <span>4 MODULES ACTIVE</span>
      </div>
    </div>
  );
}
