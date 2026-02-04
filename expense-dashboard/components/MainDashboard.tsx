'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { DashboardView } from '@/components/screens/DashboardView';

// Lib
import {
  aggregateTrendData,
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
  filterBudget,
  getBudgetProgress
} from '@/lib/analytics';
import { useExpenseData } from '@/hooks';
import { CHART_INFO, ChartKey } from '@/lib/constants/chartInfo';

// Components
import KPICards from '@/components/KPICards';
import TransactionTable from '@/components/TransactionTable';
import {
  ExpandedChartOverlay,
  DashboardHeader,
  DashboardActions
} from '@/components/dashboard';
import { FilterAccordion } from '@/components/filters';
import { InfoModal, FloatingFilterButton, EmptyState } from '@/components/ui';
import { Onboarding } from '@/components/onboarding';
import {
  TargetDonutD3,
  CategoryBarD3,
  MonthlyTrendD3, // Keep import even if unused in current view
  SpendingTrendD3,
  BurnRateGaugeD3,
  DayOfWeekD3,
  TopShopsD3,
  SpendingHeatmapD3,
  BudgetProgressRings
} from '@/components/charts';

interface MainDashboardProps {
  showTransactions?: boolean;
}

/**
 * Main Dashboard Component
 * 
 * Displays expense analytics with interactive charts, filters, and data tables.
 * Uses the useExpenseData hook for all data management.
 */
export default function MainDashboard({ showTransactions = true }: MainDashboardProps) {
  const [userName, setUserName] = useState<string>('');

  const hookData = useExpenseData();

  // Fetch user profile for welcome message
  useEffect(() => {
    async function getUserProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single();

        if (profile?.display_name) {
          setUserName(profile.display_name);
        } else if (user.user_metadata?.display_name) {
          setUserName(user.user_metadata.display_name);
        } else {
          setUserName(user.email?.split('@')[0] || '');
        }
      }
    }
    getUserProfile();
  }, []);

  return (
    <DashboardView
      {...hookData}
      userName={userName}
      showTransactions={showTransactions}
    />
  );
}
