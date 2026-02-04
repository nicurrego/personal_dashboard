'use client';

import React from 'react';
import { MascotSection } from '@/components/home/MascotSection';
import BudgetRingsD3 from '@/components/charts/BudgetRingsD3';
import { formatCurrency } from '@/lib/d3-utils';
import { ExpenseTarget } from '@/types';

// Define the shape of data this view expects
export interface HomeViewProps {
    user: { name?: string };
    ringData: Array<{ label: string; spent: number; budget: number; color: string }>;
    availableBudget: number;
    metrics: { investmentPercentage: number; pendingPercentage: number };
    refDate: Date;
    loading?: boolean;
    mascotTypeOverride?: string;
}

export function HomeView({
    user,
    ringData,
    availableBudget,
    metrics,
    refDate,
    loading = false,
    mascotTypeOverride,
}: HomeViewProps) {

    if (loading) {
        return (
            <div className="min-h-screen bg-[#1B4034] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#1B4034] flex flex-col items-center gap-6 pt-8 pb-24 px-6 page-ambient relative overflow-y-auto">

            {/* Top Section: Financial Data */}
            <div className="flex flex-col gap-6 w-full items-center">

                {/* Available Info */}
                <div className="w-full max-w-[350px] z-20 transition-all duration-300">
                    <div className="liquid-card p-5 flex flex-col items-center text-center border border-[#A9D9C7]/30 bg-[#1B4034] rounded-3xl relative overflow-hidden shadow-lg shadow-black/20">

                        <span className="text-xs font-semibold uppercase tracking-widest text-[#A9D9C7] mb-1 opacity-80">Available Budget</span>
                        <span className="text-4xl font-bold text-white font-sans tracking-tight mb-2">
                            {formatCurrency(availableBudget)}
                        </span>

                        {/* Category Breakdown */}
                        <div className="w-full grid grid-cols-3 gap-2 border-t border-[#A9D9C7]/10 pt-3 mt-1">
                            {ringData.filter(d => d.label !== 'Total').map(d => {
                                const remaining = Math.max(0, d.budget - d.spent);
                                return (
                                    <div key={d.label} className="flex flex-col items-center">
                                        <span className="text-[9px] uppercase tracking-wider text-[#A9D9C7] opacity-60 mb-0.5">{d.label}</span>
                                        <span className="text-sm font-semibold text-white">
                                            {formatCurrency(remaining)}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-3 pt-1 w-full border-t border-[#A9D9C7]/10">
                            <span className="text-[10px] text-[#A9D9C7]/40 uppercase tracking-widest">
                                {refDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ring Graph */}
                <div className="w-full max-w-[350px] relative z-20 transition-all duration-300">
                    <div className="liquid-card p-4 flex items-center justify-between bg-[#1B4034] border border-[#A9D9C7]/20 rounded-3xl gap-2 shadow-lg shadow-black/20">

                        {/* Left: Legend */}
                        <div className="flex flex-col gap-3 pl-2">
                            {ringData.map(d => (
                                <div key={d.label} className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)]" style={{ backgroundColor: d.color }} />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-[#A9D9C7] opacity-70 leading-none mb-1">{d.label}</span>
                                        <span className="text-sm font-mono text-white font-bold leading-none">
                                            {d.budget > 0 ? Math.round((d.spent / d.budget) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Right: Rings */}
                        <div className="w-[160px] h-[160px] shrink-0">
                            <BudgetRingsD3 data={ringData} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Kibo Mascot */}
            <div className="w-full max-w-[350px] flex flex-col items-center z-10 transition-all duration-300 pb-0">
                <MascotSection
                    investmentPercentage={metrics.investmentPercentage}
                    pendingPercentage={metrics.pendingPercentage}
                    userName={user.name || 'Friend'} // Simplified
                    mascotTypeOverride={mascotTypeOverride}
                />
            </div>
        </main>
    );
}
