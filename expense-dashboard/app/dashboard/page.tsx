'use client';

import { Suspense } from 'react';
import MainDashboard from '@/components/MainDashboard';

// Force dynamic rendering for pages that use client-side hooks
export const dynamic = 'force-dynamic';

function DashboardLoading() {
  return (
    <div className="min-h-screen bg-void-black flex items-center justify-center">
      <div className="loading-spinner loading-spinner--lg border-growth-green"></div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <MainDashboard showTransactions={false} />
    </Suspense>
  );
}
