'use client';

import type { ChartProps } from './types';

export function SankeyChart({ totals, size }: ChartProps) {
  const total = Math.max(totals.future + totals.living + totals.present, 1);
  const income = totals.income;
  
  // Calculate proportions
  const futureHeight = (totals.future / total) * 100;
  const livingHeight = (totals.living / total) * 100;
  const presentHeight = (totals.present / total) * 100;

  const isSmall = size === 'small';
  const containerClass = isSmall ? 'w-28 h-20' : 'w-full h-48';

  if (isSmall) {
    // Simplified mini version
    return (
      <div className={`${containerClass} flex items-center justify-center gap-1`}>
        {/* Income bar */}
        <div className="w-3 h-16 bg-gradient-to-b from-flux-violet to-purple-600 rounded-full opacity-80" />
        
        {/* Flow lines */}
        <div className="flex flex-col gap-0.5 h-16 justify-center">
          <div className="w-4 h-[2px] bg-gradient-to-r from-purple-500 to-[#22c55e]" />
          <div className="w-4 h-[2px] bg-gradient-to-r from-purple-500 to-[#06b6d4]" />
          <div className="w-4 h-[2px] bg-gradient-to-r from-purple-500 to-[#f59e0b]" />
        </div>
        
        {/* Bucket bars */}
        <div className="flex flex-col gap-0.5 h-16 justify-center">
          <div 
            className="w-2 bg-[#22c55e] rounded-full transition-all" 
            style={{ height: `${Math.max(futureHeight * 0.6, 4)}%` }} 
          />
          <div 
            className="w-2 bg-[#06b6d4] rounded-full transition-all" 
            style={{ height: `${Math.max(livingHeight * 0.6, 4)}%` }} 
          />
          <div 
            className="w-2 bg-[#f59e0b] rounded-full transition-all" 
            style={{ height: `${Math.max(presentHeight * 0.6, 4)}%` }} 
          />
        </div>
      </div>
    );
  }

  // Full size Sankey
  return (
    <div className={`${containerClass} relative`}>
      <svg viewBox="0 0 200 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Income Source */}
        <rect x="5" y="10" width="20" height="80" rx="4" fill="url(#incomeGradient)" opacity="0.9" />
        <text x="15" y="95" textAnchor="middle" className="fill-slate-400 text-[6px] font-medium">Income</text>

        {/* Flow Paths */}
        <path
          d={`M 25 30 C 60 30, 80 ${15}, 120 ${15}`}
          stroke="#22c55e"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        <path
          d={`M 25 50 C 60 50, 80 50, 120 50`}
          stroke="#06b6d4"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />
        <path
          d={`M 25 70 C 60 70, 80 ${85}, 120 ${85}`}
          stroke="#f59e0b"
          strokeWidth="3"
          fill="none"
          opacity="0.6"
        />

        {/* Bucket Bars */}
        <rect 
          x="120" y="5" 
          width="18" 
          height={Math.max(futureHeight * 0.3, 8)} 
          rx="3" 
          fill="#22c55e" 
          opacity="0.9" 
        />
        <text x="150" y={15} className="fill-[#22c55e] text-[5px] font-bold">Future</text>
        
        <rect 
          x="120" y="40" 
          width="18" 
          height={Math.max(livingHeight * 0.3, 8)} 
          rx="3" 
          fill="#06b6d4" 
          opacity="0.9" 
        />
        <text x="150" y={50} className="fill-[#06b6d4] text-[5px] font-bold">Living</text>
        
        <rect 
          x="120" y="75" 
          width="18" 
          height={Math.max(presentHeight * 0.3, 8)} 
          rx="3" 
          fill="#f59e0b" 
          opacity="0.9" 
        />
        <text x="150" y={85} className="fill-[#f59e0b] text-[5px] font-bold">Present</text>

        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
