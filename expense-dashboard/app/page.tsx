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
        <h2 className="text-label mb-2 text-cyber-cyan">Restricted Area</h2>
        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tighter shadow-lg">
          EXPENSE<span className="text-gray-500">.OS</span>
        </h1>
        <p className="mt-4 text-secondary-text font-mono text-sm tracking-wide">
          SYSTEM V1.2 // READY FOR ANALYSIS
        </p>
      </div>

      {/* Navigation Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl relative z-10">
        {/* Module 1: Dashboard */}
        <Link href="/dashboard" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-acid-green">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-label text-acid-green">MODULE 01</span>
                <div className="w-2 h-2 rounded-full bg-acid-green animate-pulse" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Dashboard</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Visual analytics and high-level KPI monitoring. Transaction list hidden for clarity.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-acid-green text-black px-6 py-2 text-sm uppercase tracking-wider group-hover:shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all">
                Launch
              </span>
            </div>
          </div>
        </Link>
        
        {/* Module 2: Basic View */}
        <Link href="/basic" className="group">
          <div className="liquid-card p-8 h-64 flex flex-col justify-between hover:bg-[rgba(255,255,255,0.03)] transition-all duration-300 border-l-4 border-l-cobalt-blue">
            <div>
              <div className="flex justify-between items-start mb-4">
                 <span className="text-label text-cobalt-blue">MODULE 02</span>
                 <div className="w-2 h-2 rounded-full bg-cobalt-blue opacity-50" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">Data Grid</h3>
              <p className="text-secondary-text text-sm max-w-[80%]">
                Full data access with responsive transaction tables and raw records.
              </p>
            </div>
            <div className="flex justify-end">
              <span className="liquid-button bg-glass-surface text-white border border-neutral-700 px-6 py-2 text-sm uppercase tracking-wider group-hover:bg-neutral-800 transition-all">
                Access
              </span>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer Status */}
      <div className="mt-16 relative z-10 font-mono text-xs text-secondary-text flex items-center gap-4">
         <span>STATUS: <span className="text-acid-green">OPERATIONAL</span></span>
         <span className="opacity-30">|</span>
         <span>SECURE CONNECTION</span>
      </div>
    </div>
  );
}
