'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useExpenseData } from '@/hooks/use-expense-data';
import { MascotSection } from '@/components/home/MascotSection';
import BudgetRingsD3 from '@/components/charts/BudgetRingsD3';
import { formatCurrency } from '@/lib/d3-utils';
import { ExpenseTarget } from '@/types';

export default function HomePage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const { expenses, budget, loading } = useExpenseData();

    // -- Authentication Check --
    useEffect(() => {
        const supabase = createClient();
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
            } else {
                setUser(user);
            }
        };
        checkUser();
    }, [router]);

    // -- Data Processing --
    const { ringData, availableBudget, metrics, refDate } = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        // 1. Filter for Current Month
        // Note: Safely handle if year/month are strings or numbers in raw data
        const monthlyExpenses = expenses.filter(e =>
            Number(e.year) === currentYear && Number(e.month) === currentMonth
        );
        const monthlyBudgets = budget.filter(b =>
            Number(b.year) === currentYear && Number(b.month) === currentMonth
        );

        // 2. Helpers
        const sumExpenses = (target?: ExpenseTarget) => {
            return monthlyExpenses
                .filter(e => !target || e.target === target)
                .reduce((sum, e) => sum + e.value, 0);
        };

        const sumBudget = (target?: ExpenseTarget) => {
            return monthlyBudgets
                .filter(b => !target || b.target === target)
                .reduce((sum, b) => sum + b.amount, 0);
        };

        // 3. Calculate Totals
        const totalSpent = sumExpenses();
        const totalBudget = sumBudget();

        const futureSpent = sumExpenses('Future');
        const futureBudget = sumBudget('Future');

        const livingSpent = sumExpenses('Living');
        const livingBudget = sumBudget('Living');

        const presentSpent = sumExpenses('Present');
        const presentBudget = sumBudget('Present');

        // 4. Ring Data (Outer to Inner: Total -> Future -> Living -> Present)
        const ringData = [
            {
                label: 'Total',
                spent: totalSpent,
                budget: totalBudget,
                color: '#A9D9C7' // Total (Teal)
            },
            {
                label: 'Future',
                spent: futureSpent,
                budget: futureBudget,
                color: '#614FBB' // Future (Purple)
            },
            {
                label: 'Living',
                spent: livingSpent,
                budget: livingBudget,
                color: '#65A1C9' // Living (Blue)
            },
            {
                label: 'Present',
                spent: presentSpent,
                budget: presentBudget,
                color: '#C24656' // Present (Red)
            }
        ];

        // 5. Available (Total Budget - Total Spent)
        const availableBudget = Math.max(0, totalBudget - totalSpent);

        // Metrics for Mascot (Investment Health)
        // If Budget is 0, avoid NaN
        const investmentPercentage = totalBudget > 0 ? (futureSpent / totalBudget) * 100 : 0;
        const pendingPercentage = totalBudget > 0 ? (availableBudget / totalBudget) * 100 : 0;

        return {
            ringData,
            availableBudget,
            metrics: { investmentPercentage, pendingPercentage },
            refDate: now
        };
    }, [expenses, budget]);


    if (!user || loading) {
        return (
            <div className="min-h-screen bg-[#1B4034] flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-[100dvh] bg-[#1B4034] flex flex-col items-center justify-end pb-28 px-6 page-ambient gap-6">

            {/* Top: Available Info */}
            <div className="w-full max-w-[350px] z-20 transition-all duration-300">
                <div className="liquid-card p-6 flex flex-col items-center text-center border border-[#A9D9C7]/30 bg-[#1B4034] rounded-3xl relative overflow-hidden shadow-lg shadow-black/20">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-[#A9D9C7]/5 rounded-bl-[100px] pointer-events-none" />

                    <span className="text-xs font-semibold uppercase tracking-widest text-[#A9D9C7] mb-2 opacity-80">Available Budget</span>
                    <span className="text-4xl font-bold text-white font-sans tracking-tight mb-4">
                        {formatCurrency(availableBudget)}
                    </span>

                    {/* Category Breakdown */}
                    <div className="w-full grid grid-cols-3 gap-2 border-t border-[#A9D9C7]/10 pt-4 mt-1">
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

                    <div className="mt-4 pt-1 w-full border-t border-[#A9D9C7]/10">
                        <span className="text-[10px] text-[#A9D9C7]/40 uppercase tracking-widest">
                            {refDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Middle: Ring Graph */}
            <div className="w-full max-w-[350px] relative z-20 transition-all duration-300">
                <div className="liquid-card p-5 flex items-center justify-between bg-[#1B4034] border border-[#A9D9C7]/20 rounded-3xl gap-4 shadow-lg shadow-black/20">

                    {/* Left: Legend */}
                    <div className="flex flex-col gap-4 pl-2">
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
                    <div className="w-[180px] h-[180px] shrink-0">
                        <BudgetRingsD3 data={ringData} />
                    </div>
                </div>
            </div>

            {/* Bottom: Kibo Text & Mascot */}
            <div className="w-full max-w-[350px] flex flex-col items-center z-10 transition-all duration-300">
                <MascotSection
                    investmentPercentage={metrics.investmentPercentage}
                    pendingPercentage={metrics.pendingPercentage}
                    userName={user.user_metadata?.name || 'Friend'}
                />
            </div>
        </main>
    );
}
