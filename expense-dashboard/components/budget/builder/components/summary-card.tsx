'use client';

import type { BudgetTotals } from '../types';
import type { ChartType } from './charts/types';
import { formatMoney, triggerHaptic } from '../utils/formatters';
import { CATEGORY_COLORS } from '@/lib/category-colors';
import { DonutChart } from './charts/donut-chart';
import { SankeyChart } from './charts/sankey-chart';
import { SavingsProjection } from './charts/savings-projection';
import { CategoryTreemap } from './charts/category-treemap';
import { IncomeVsExpenses } from './charts/income-vs-expenses';

export interface BudgetPercentages {
  future: number;
  living: number;
  present: number;
}

interface SummaryCardProps {
  totals: BudgetTotals;
  onExplanationOpen: (percentages: BudgetPercentages) => void;
  onGraphOpen: () => void;
  selectedChartType: ChartType;
}

export function SummaryCard({ totals, onExplanationOpen, onGraphOpen, selectedChartType }: SummaryCardProps) {
  const cashFlowVal = totals.income - (totals.future + totals.living + totals.present);
  const cashFlowStr = formatMoney(cashFlowVal);
  const isPositive = cashFlowVal >= 0;

  const total = Math.max(totals.future + totals.living + totals.present, 1);
  const futurePercent = Math.round((totals.future / total) * 100);
  const livingPercent = Math.round((totals.living / total) * 100);
  const presentPercent = Math.round((totals.present / total) * 100);

  const getSummaryFontSize = () => {
    const len = cashFlowStr.length;
    if (len <= 9) return 'text-3xl sm:text-4xl lg:text-5xl';
    if (len <= 12) return 'text-2xl sm:text-3xl lg:text-4xl';
    return 'text-xl sm:text-2xl lg:text-3xl';
  };

  const handleExplanationOpen = () => {
    triggerHaptic();
    onExplanationOpen({ future: futurePercent, living: livingPercent, present: presentPercent });
  };

  const handleGraphOpen = () => {
    triggerHaptic();
    onGraphOpen();
  };

  const renderMiniChart = () => {
    const props = { 
      totals, 
      size: 'small' as const, 
      monthlyNetCashFlow: cashFlowVal 
    };

    switch (selectedChartType) {
      case 'DONUT':
        return <DonutChart {...props} />;
      case 'SANKEY':
        return <SankeyChart {...props} />;
      case 'PROJECTION':
        return <SavingsProjection {...props} />;
      case 'TREEMAP':
        return <CategoryTreemap {...props} />;
      case 'COMPARISON':
        return <IncomeVsExpenses {...props} />;
      default:
        return <DonutChart {...props} />;
    }
  };

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 sm:-mt-6 lg:-mt-8 px-6 sm:px-10 pt-8 pb-8 rounded-b-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] sticky top-[64px] z-40 relative overflow-hidden">
      {/* Ambient Background Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2 opacity-100" />

      <div className="relative z-10 flex flex-row items-center justify-between gap-4 h-full">
        {/* LEFT SIDE: Cash Flow & Percentages - Opens Explanation Modal */}
        <div 
          className="flex flex-col gap-2 w-1/2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleExplanationOpen(); }}
        >
          <span className="text-slate-400 font-medium text-sm uppercase tracking-wider">
            Net Cash Flow
          </span>

          <span className={`font-bold font-mono tracking-tighter text-white hover:opacity-80 block truncate ${getSummaryFontSize()}`}>
            <span className={isPositive ? "text-white" : "text-red-500"}>
              {cashFlowVal === 0 ? "$0" : cashFlowStr}
            </span>
          </span>

          {/* Percentages row */}
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono font-bold text-base sm:text-lg" style={{ color: CATEGORY_COLORS.FUTURE }}>{futurePercent}%</span>
            <span className="font-mono font-bold text-base sm:text-lg" style={{ color: CATEGORY_COLORS.LIVING }}>{livingPercent}%</span>
            <span className="font-mono font-bold text-base sm:text-lg" style={{ color: CATEGORY_COLORS.PRESENT }}>{presentPercent}%</span>
          </div>
        </div>

        {/* RIGHT SIDE: Dynamic Chart - Opens Graph Modal */}
        <div 
          className="flex items-center justify-center cursor-pointer w-1/2"
          onClick={(e) => { e.stopPropagation(); handleGraphOpen(); }}
        >
          <div>
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2 w-full">
              {/* Chart 1: Allocation Donut */}
              <div className="h-24">
                 <DonutChart totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
              {/* Chart 2: Income vs Expenses (Bar) */}
              <div className="h-24 hidden lg:block">
                 <IncomeVsExpenses totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
              {/* Chart 3: Projection (Area) - Visible on XL screens */}
              <div className="h-24 hidden xl:block">
                 <SavingsProjection totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
