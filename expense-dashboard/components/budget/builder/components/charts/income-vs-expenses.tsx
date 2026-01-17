'use client';

import type { ChartProps } from './types';

export function IncomeVsExpenses({ totals, size }: ChartProps) {
  const isSmall = size === 'small';
  const containerClass = isSmall ? 'w-28 h-20' : 'w-full h-48';
  
  const income = totals.income || 1;
  const expenses = totals.future + totals.living + totals.present;
  const maxVal = Math.max(income, expenses, 1);
  
  const incomeHeight = (income / maxVal) * 100;
  const expenseHeight = (expenses / maxVal) * 100;
  
  const netPositive = income >= expenses;

  if (isSmall) {
    // Mini bar comparison
    return (
      <div className={`${containerClass} flex items-end justify-center gap-3 p-2`}>
        {/* Income bar */}
        <div className="flex flex-col items-center gap-1">
          <div 
            className="w-6 bg-gradient-to-t from-flux-violet to-purple-400 rounded-t transition-all"
            style={{ height: `${Math.max(incomeHeight * 0.5, 8)}px` }}
          />
          <span className="text-[8px] text-slate-500">In</span>
        </div>
        
        {/* Expenses stacked bar */}
        <div className="flex flex-col items-center gap-1">
          <div 
            className="w-6 flex flex-col-reverse rounded-t overflow-hidden transition-all"
            style={{ height: `${Math.max(expenseHeight * 0.5, 8)}px` }}
          >
            <div className="bg-[#f59e0b] flex-1" style={{ flex: totals.present }} />
            <div className="bg-[#06b6d4] flex-1" style={{ flex: totals.living }} />
            <div className="bg-[#22c55e] flex-1" style={{ flex: totals.future }} />
          </div>
          <span className="text-[8px] text-slate-500">Out</span>
        </div>
        
        {/* Net indicator */}
        <div className={`text-[10px] font-bold ${netPositive ? 'text-green-500' : 'text-red-500'}`}>
          {netPositive ? '+' : '-'}
        </div>
      </div>
    );
  }

  // Full size version
  return (
    <div className={`${containerClass} flex items-end justify-center gap-8 p-4 pb-8`}>
      {/* Income Bar */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-16 bg-gradient-to-t from-flux-violet via-purple-500 to-purple-400 rounded-t-lg shadow-lg shadow-purple-500/20 transition-all relative overflow-hidden"
          style={{ height: `${Math.max(incomeHeight * 1.2, 20)}px` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
        </div>
        <span className="text-xs text-slate-400 font-medium">Income</span>
      </div>
      
      {/* VS indicator */}
      <div className="flex flex-col items-center justify-center h-full pb-6">
        <div className={`text-sm font-bold px-3 py-1 rounded-full border ${netPositive ? 'text-green-400 border-green-500/30 bg-green-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'}`}>
          {netPositive ? '✓' : '!'}
        </div>
      </div>
      
      {/* Expenses Stacked Bar */}
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-16 flex flex-col-reverse rounded-t-lg overflow-hidden shadow-lg transition-all"
          style={{ height: `${Math.max(expenseHeight * 1.2, 20)}px` }}
        >
          {/* Present (bottom) */}
          {totals.present > 0 && (
            <div 
              className="bg-gradient-to-t from-[#f59e0b] to-[#fbbf24] relative"
              style={{ flex: totals.present }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            </div>
          )}
          {/* Living (middle) */}
          {totals.living > 0 && (
            <div 
              className="bg-gradient-to-t from-[#06b6d4] to-[#22d3ee] relative"
              style={{ flex: totals.living }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            </div>
          )}
          {/* Future (top) */}
          {totals.future > 0 && (
            <div 
              className="bg-gradient-to-t from-[#22c55e] to-[#4ade80] relative"
              style={{ flex: totals.future }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
            </div>
          )}
        </div>
        <span className="text-xs text-slate-400 font-medium">Expenses</span>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#22c55e]" />
          <span className="text-slate-500">Future</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#06b6d4]" />
          <span className="text-slate-500">Living</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-sm bg-[#f59e0b]" />
          <span className="text-slate-500">Present</span>
        </div>
      </div>
    </div>
  );
}
