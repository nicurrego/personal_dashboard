'use client';

import type { BudgetTotals } from '../types';
import type { ChartType } from './charts/types';
import { formatMoney, triggerHaptic } from '../utils/formatters';
import { CATEGORY_COLORS } from '@/lib/category-colors';
// Use new D3-powered charts
import { BudgetDonutD3 } from './charts/BudgetDonutD3';
import { BudgetBarD3 } from './charts/BudgetBarD3';
import { BudgetProjectionD3 } from './charts/BudgetProjectionD3';

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

  return (
    <div className="bg-card border border-border px-6 sm:px-10 pt-8 pb-8 rounded-[1.5rem] shadow-sm overflow-hidden">
      {/* Ambient Background Glow - Removed for minimalist solid style */}

      <div className="relative z-10 flex flex-row items-center justify-between gap-4 h-full">
        {/* LEFT SIDE: Cash Flow & Percentages - Opens Explanation Modal */}
        <div
          className="flex flex-col gap-2 w-1/2 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); handleExplanationOpen(); }}
        >
          <span className="text-muted-foreground font-medium text-sm uppercase tracking-wider">
            Net Cash Flow
          </span>

          <span className={`font-bold font-mono tracking-tighter text-foreground hover:opacity-80 block truncate ${getSummaryFontSize()}`}>
            <span className={isPositive ? "text-foreground" : "text-destructive"}>
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
              {/* Chart 1: D3 Allocation Donut */}
              <div className="h-24">
                <BudgetDonutD3 totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
              {/* Chart 2: D3 Income vs Expenses (Bar) */}
              <div className="h-24 hidden lg:block">
                <BudgetBarD3 totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
              {/* Chart 3: D3 Projection (Area) - Visible on XL screens */}
              <div className="h-24 hidden xl:block">
                <BudgetProjectionD3 totals={totals} size="small" monthlyNetCashFlow={cashFlowVal} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
