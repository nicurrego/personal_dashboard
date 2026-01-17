'use client';

import type { ChartProps } from './types';

export function CategoryTreemap({ totals, size }: ChartProps) {
  const isSmall = size === 'small';
  const containerClass = isSmall ? 'w-28 h-20' : 'w-full h-48';
  
  const total = totals.future + totals.living + totals.present;
  if (total === 0) {
    return (
      <div className={`${containerClass} flex items-center justify-center`}>
        <span className="text-slate-500 text-xs">No data</span>
      </div>
    );
  }
  
  // Calculate proportions
  const futureRatio = totals.future / total;
  const livingRatio = totals.living / total;
  const presentRatio = totals.present / total;

  if (isSmall) {
    // Mini treemap - simplified rectangles
    return (
      <div className={`${containerClass} p-1`}>
        <div className="w-full h-full flex gap-0.5 rounded overflow-hidden">
          {futureRatio > 0 && (
            <div 
              className="bg-[#22c55e] rounded-sm transition-all" 
              style={{ width: `${futureRatio * 100}%` }}
            />
          )}
          {livingRatio > 0 && (
            <div 
              className="bg-[#06b6d4] rounded-sm transition-all" 
              style={{ width: `${livingRatio * 100}%` }}
            />
          )}
          {presentRatio > 0 && (
            <div 
              className="bg-[#f59e0b] rounded-sm transition-all" 
              style={{ width: `${presentRatio * 100}%` }}
            />
          )}
        </div>
      </div>
    );
  }

  // Full treemap with nested layout
  // Main row splits: Living (largest typically) vs Future+Present
  const mainSplit = livingRatio;
  const secondarySplit = futureRatio / (futureRatio + presentRatio + 0.001);

  return (
    <div className={`${containerClass} p-2`}>
      <div className="w-full h-full flex gap-1 rounded-xl overflow-hidden">
        {/* Living - usually largest */}
        <div 
          className="bg-gradient-to-br from-[#06b6d4] to-[#0891b2] rounded-lg flex items-end justify-start p-3 transition-all relative overflow-hidden group"
          style={{ width: `${Math.max(mainSplit * 100, 20)}%` }}
        >
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative z-10">
            <span className="text-white/80 text-xs font-medium block">Living</span>
            <span className="text-white text-lg font-bold">{Math.round(livingRatio * 100)}%</span>
          </div>
        </div>
        
        {/* Right column: Future + Present stacked */}
        <div className="flex-1 flex flex-col gap-1">
          <div 
            className="bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-lg flex items-end justify-start p-3 transition-all relative overflow-hidden group"
            style={{ height: `${Math.max(secondarySplit * 100, 25)}%` }}
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-white/80 text-[10px] font-medium block">Future</span>
              <span className="text-white text-sm font-bold">{Math.round(futureRatio * 100)}%</span>
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-lg flex items-end justify-start p-3 transition-all relative overflow-hidden group flex-1"
          >
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <span className="text-white/80 text-[10px] font-medium block">Present</span>
              <span className="text-white text-sm font-bold">{Math.round(presentRatio * 100)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
