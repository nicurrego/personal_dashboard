'use client';

import React from 'react';

interface InvestmentSummaryProps {
    totalInvested: number;
    pendingToInvest: number;
    currency?: string;
}

const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
    return new Intl.NumberFormat('ja-JP', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

export function InvestmentSummary({ totalInvested, pendingToInvest, currency = 'JPY' }: InvestmentSummaryProps) {
    const total = totalInvested + pendingToInvest;
    const investedPercentage = total > 0 ? (totalInvested / total) * 100 : 0;
    const pendingPercentage = total > 0 ? (pendingToInvest / total) * 100 : 0;

    return (
        <div className="space-y-4">
            {/* Total Invested Card */}
            <div
                className="liquid-card-premium p-5 relative overflow-hidden
                   transition-all duration-300 hover:scale-[1.02]
                   card-glow-future"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-growth-green/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-label text-growth-green mb-1">Total Invertido</p>
                            <p className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
                                {formatCurrency(totalInvested, currency)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-growth-green/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-growth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-growth-green to-cyber-cyan rounded-full
                         transition-all duration-700 ease-out"
                            style={{ width: `${investedPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-secondary-text mt-2 font-mono">
                        {investedPercentage.toFixed(1)}% del total
                    </p>
                </div>
            </div>

            {/* Pending to Invest Card */}
            <div
                className="liquid-card-premium p-5 relative overflow-hidden
                   transition-all duration-300 hover:scale-[1.02]
                   card-glow-present"
            >
                {/* Background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-alert-amber/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <p className="text-label text-alert-amber mb-1">Pendiente por Invertir</p>
                            <p className="text-2xl md:text-3xl font-bold text-white font-mono tracking-tight">
                                {formatCurrency(pendingToInvest, currency)}
                            </p>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-alert-amber/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-alert-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-alert-amber to-laser-magenta rounded-full
                         transition-all duration-700 ease-out"
                            style={{ width: `${pendingPercentage}%` }}
                        />
                    </div>
                    <p className="text-xs text-secondary-text mt-2 font-mono">
                        {pendingPercentage.toFixed(1)}% disponible
                    </p>
                </div>
            </div>
        </div>
    );
}
