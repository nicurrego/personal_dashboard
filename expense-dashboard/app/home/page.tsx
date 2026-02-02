'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import {
    WelcomeHeader,
    MascotSection,
    InvestmentSummary,
    InvestmentChart
} from '@/components/home';
import { BottomNav } from '@/components/layout';

interface InvestmentData {
    totalInvested: number;
    pendingToInvest: number;
    totalBudget: number;
}

export default function HomePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [investmentData, setInvestmentData] = useState<InvestmentData>({
        totalInvested: 0,
        pendingToInvest: 0,
        totalBudget: 0
    });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUser(user);
            await fetchInvestmentData(user.id);
            setLoading(false);
        };

        checkAuth();

        // Auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                router.push('/login');
            } else {
                setUser(session.user);
            }
        });

        return () => subscription.unsubscribe();
    }, [router, supabase]);

    const fetchInvestmentData = async (userId: string) => {
        try {
            // Fetch expenses for the current month - this represents "invested"
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

            const { data: expenses, error: expensesError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('user_id', userId)
                .gte('date', startOfMonth.toISOString().split('T')[0])
                .lte('date', endOfMonth.toISOString().split('T')[0]);

            if (expensesError) {
                console.error('Error fetching expenses:', expensesError);
            }

            // Calculate total spent this month
            const totalSpent = expenses?.reduce((sum, exp) => sum + (exp.amount || 0), 0) || 0;

            // Fetch budget for the current month
            const { data: budgets, error: budgetsError } = await supabase
                .from('budgets')
                .select('*')
                .eq('user_id', userId)
                .eq('year', now.getFullYear())
                .lte('start_month', now.getMonth())
                .gte('end_month', now.getMonth());

            if (budgetsError) {
                console.error('Error fetching budgets:', budgetsError);
            }

            // Calculate total budget for this month
            let totalBudget = 0;
            if (budgets && budgets.length > 0) {
                budgets.forEach((budget) => {
                    const monthKey = `month_${now.getMonth()}`;
                    if (budget.data && budget.data[monthKey]) {
                        totalBudget += budget.data[monthKey].amount || 0;
                    }
                });
            }

            // If no budget set, use a default or estimated monthly budget
            if (totalBudget === 0) {
                // Estimate based on average spending or use a placeholder
                totalBudget = totalSpent > 0 ? totalSpent * 1.5 : 100000; // 150% of spent or default
            }

            const pendingToInvest = Math.max(0, totalBudget - totalSpent);

            setInvestmentData({
                totalInvested: totalSpent,
                pendingToInvest: pendingToInvest,
                totalBudget: totalBudget
            });

        } catch (error) {
            console.error('Error fetching investment data:', error);
            // Set fallback data
            setInvestmentData({
                totalInvested: 45000,
                pendingToInvest: 55000,
                totalBudget: 100000
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-void-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-2 border-cyber-cyan/30 border-t-cyber-cyan rounded-full animate-spin" />
                    <p className="text-secondary-text text-sm">Cargando...</p>
                </div>
            </div>
        );
    }

    const { totalInvested, pendingToInvest, totalBudget } = investmentData;
    const investedPercentage = totalBudget > 0 ? (totalInvested / totalBudget) * 100 : 0;
    const pendingPercentage = totalBudget > 0 ? (pendingToInvest / totalBudget) * 100 : 0;

    return (
        <div className="min-h-screen bg-void-black page-ambient page-with-nav">
            {/* Main Content */}
            <main className="relative z-10 px-4 pt-6 pb-8 max-w-lg mx-auto">
                {/* Welcome Header */}
                <WelcomeHeader userName={user?.email?.split('@')[0]} />

                {/* Mascot Section */}
                <div className="my-8 flex justify-center">
                    <MascotSection
                        investmentPercentage={investedPercentage}
                        pendingPercentage={pendingPercentage}
                        userName={user?.email?.split('@')[0]}
                    />
                </div>

                {/* Investment Summary Cards */}
                <section className="mb-6">
                    <InvestmentSummary
                        totalInvested={totalInvested}
                        pendingToInvest={pendingToInvest}
                        currency="JPY"
                    />
                </section>

                {/* Investment Chart */}
                <section className="mb-8">
                    <InvestmentChart
                        totalInvested={totalInvested}
                        pendingToInvest={pendingToInvest}
                    />
                </section>

                {/* Quick Actions */}
                <section className="grid grid-cols-2 gap-3">
                    <Link
                        href="/dashboard"
                        className="liquid-card p-4 flex flex-col items-center gap-2
                       hover:bg-white/5 transition-all duration-300
                       border-l-2 border-l-growth-green"
                    >
                        <div className="w-10 h-10 rounded-xl bg-growth-green/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-growth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <span className="text-xs text-white font-medium">Ver Dashboard</span>
                    </Link>

                    <Link
                        href="/quick-entry"
                        className="liquid-card p-4 flex flex-col items-center gap-2
                       hover:bg-white/5 transition-all duration-300
                       border-l-2 border-l-alert-amber"
                    >
                        <div className="w-10 h-10 rounded-xl bg-alert-amber/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-alert-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M12 4v16m8-8H4" />
                            </svg>
                        </div>
                        <span className="text-xs text-white font-medium">Añadir Gasto</span>
                    </Link>
                </section>
            </main>

            {/* Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
