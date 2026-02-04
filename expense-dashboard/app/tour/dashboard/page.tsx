'use client';

import { Suspense } from 'react';
import { useMockExpenseData } from '@/hooks/use-mock-expense-data';
import { DashboardView } from '@/components/screens/DashboardView';

function TourDashboardContent() {
    const hookData = useMockExpenseData();

    return (
        <DashboardView
            {...hookData}
            userName="Guest"
            showTransactions={false}
        />
    );
}

export default function TourDashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#1B4034] flex items-center justify-center">
                <div className="loading-spinner loading-spinner--lg border-growth-green"></div>
            </div>
        }>
            <TourDashboardContent />
        </Suspense>
    );
}
