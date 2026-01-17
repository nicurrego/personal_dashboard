'use client';

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Lib
import { 
  aggregateTrendData, 
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
  filterBudget,
  getBudgetProgress
} from '@/lib/dataTransforms';
import { useExpenseData, TimeRangePreset } from '@/lib/hooks/useExpenseData';
import { CHART_INFO, ChartKey } from '@/lib/constants/chartInfo';

// Components
import KPICards from '@/components/KPICards';
import TransactionTable from '@/components/TransactionTable';
import ExpandedChartOverlay from '@/components/dashboard/ExpandedChartOverlay';
import { FilterAccordion } from '@/components/filters';
import { InfoModal, FloatingFilterButton, EmptyState } from '@/components/ui';
import { Onboarding } from '@/components/onboarding';
import {
  TargetDonutD3,
  CategoryBarD3,
  MonthlyTrendD3,
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
  const searchParams = useSearchParams();
  const skipOnboarding = searchParams.get('skip-onboarding') === 'true';
  const [userName, setUserName] = useState<string>('');

  const {
    expenses, // Raw expenses list (unfiltered)
    filteredExpenses,
    loading,
    filters,
    setFilters,
    resetFilters,
    uniqueValues,
    activeFilterCount,
    timeRangePreset,
    setTimeRangePreset,
    currentYear,
    currentMonth,
    budget,
    saveDefaultView
  } = useExpenseData();

  // Fetch user profile for welcome message
  useEffect(() => {
    async function getUserProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Try to get display name from profiles first, then metadata
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
          // Fallback to email username
          setUserName(user.email?.split('@')[0] || '');
        }
      }
    }
    getUserProfile();
  }, []);

  // UI State
  const [expandedChart, setExpandedChart] = useState<ChartKey | null>(null);
  const [infoChart, setInfoChart] = useState<ChartKey | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOrder, setFilterOrder] = useState(['location', 'category', 'shop', 'target', 'month', 'year']);

  // Derived Data (computed from filtered expenses)
  // These are standard functions, not hooks, but nice to keep together.
  const { data: trendData, granularity } = aggregateTrendData(filteredExpenses);
  const kpiMetrics = calculateKPIs(filteredExpenses);
  const targetDistribution = getTargetDistribution(filteredExpenses);
  const categoryTotals = getTopCategories(filteredExpenses, 10);
  
  // Calculate Budget Progress (useMemo is a Hook!)
  const budgetProgress = useMemo(() => {
    let baseBudget = budget;
    // Apply time range filter to budget 
    if (timeRangePreset === 'month') {
       baseBudget = budget.filter(b => b.year === currentYear && b.month === currentMonth);
    } else if (timeRangePreset === 'year') {
       baseBudget = budget.filter(b => b.year === currentYear);
    }
    const filteredBudget = filterBudget(baseBudget, filters);
    
    return getBudgetProgress(filteredExpenses, filteredBudget);
  }, [budget, filteredExpenses, filters, timeRangePreset, currentYear, currentMonth]);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid-green"></div>
      </div>
    );
  }

  // Onboarding Check: If no expenses (total) and not skipped
  if (expenses.length === 0 && !skipOnboarding) {
    return <Onboarding userName={userName} />;
  }

  return (
    <div className="min-h-screen bg-void-black font-sans text-white pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <header className="mb-6">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide uppercase">Dashboard</h1>
                <p className="text-xs text-secondary-text font-mono">
                  {filteredExpenses.length} records
                  {timeRangePreset === 'month' && ` • ${currentYear}/${String(currentMonth).padStart(2, '0')}`}
                  {timeRangePreset === 'year' && ` • ${currentYear}`}
                </p>
              </div>
            </div>
            
            {/* Time Range Toggle - Removed as per request */}
            <div className="h-4" />
          </div>
        </header>

        {/* Empty State - Show when no data matches filters */}
        {filteredExpenses.length === 0 ? (
          <EmptyState 
            title="No Expenses Found"
            message="No expenses match your current filter selection. Try selecting a different time period or adjusting your filters."
            onReset={resetFilters}
          />
        ) : (
          <>
            {/* KPI Cards */}
            <KPICards metrics={kpiMetrics} />

            {/* Budget Progress Rings */}
            <div className="my-4">
              <BudgetProgressRings progress={budgetProgress} />
            </div>
            
            {/* Charts Grid */}
            <div className="space-y-4">
              
              {/* Spending Trend - Full Width (adaptive: daily for 1 month, monthly for longer) */}
              <SpendingTrendD3 
                data={trendData}
                granularity={granularity}
                onExpand={() => setExpandedChart('monthly')}
                onInfo={() => setInfoChart('monthly')}
              />
              
              {/* Row 1: Burn Rate, Distribution, Categories */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <BurnRateGaugeD3 
                  spent={kpiMetrics.totalSpent}
                  budget={500000}
                  onExpand={() => setExpandedChart('burn')}
                  onInfo={() => setInfoChart('burn')}
                />
                <TargetDonutD3 
                  data={targetDistribution} 
                  onExpand={() => setExpandedChart('donut')}
                  onInfo={() => setInfoChart('donut')}
                />
                <CategoryBarD3 
                  data={categoryTotals} 
                  onExpand={() => setExpandedChart('bar')}
                  onInfo={() => setInfoChart('bar')}
                />
              </div>

              {/* Row 2: Day of Week & Top Shops */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DayOfWeekD3 
                  expenses={filteredExpenses} 
                  onExpand={() => setExpandedChart('dayOfWeek')}
                  onInfo={() => setInfoChart('dayOfWeek')}
                />
                <TopShopsD3 
                  expenses={filteredExpenses} 
                  onExpand={() => setExpandedChart('topShops')}
                  onInfo={() => setInfoChart('topShops')}
                />
              </div>

              {/* Heatmap - Full Width */}
              <SpendingHeatmapD3 
                expenses={filteredExpenses}
                onExpand={() => setExpandedChart('heatmap')}
                onInfo={() => setInfoChart('heatmap')}
              />
            </div>
            
            {/* Transaction Table */}
            {showTransactions && (
              <section className="mt-6">
                <TransactionTable expenses={filteredExpenses} />
              </section>
            )}
          </>
        )}
      </div>

      {/* Floating Filter Button */}
      <FloatingFilterButton 
        onClick={() => setIsFilterOpen(!isFilterOpen)} 
        count={activeFilterCount}
        isOpen={isFilterOpen}
      />
      
      {/* Reset All Button (visible when filters open) */}
      {/* Action Buttons (visible when filters open) */}
      {isFilterOpen && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '96px',
          zIndex: 9998,
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={saveDefaultView}
            className="liquid-button"
            style={{
              padding: '0 20px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(34, 197, 94, 0.2)', // Greenish
              border: '2px solid rgba(34, 197, 94, 0.5)',
              color: '#22c55e',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            Save View
          </button>
          
          <button
            onClick={resetFilters}
            className="liquid-button"
            style={{
              padding: '0 20px',
              height: '56px',
              borderRadius: '16px',
              backgroundColor: 'rgba(217, 70, 239, 0.2)',
              border: '2px solid rgba(217, 70, 239, 0.5)',
              color: '#d946ef',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            }}
          >
            Reset all
          </button>
        </div>
      )}

      {/* Filter Accordion */}
      {isFilterOpen && (
        <FilterAccordion 
          filters={filters}
          setFilters={setFilters}
          uniqueValues={uniqueValues}
          order={filterOrder}
          setOrder={setFilterOrder}
          onClose={() => setIsFilterOpen(false)}
          setTimeRangePreset={setTimeRangePreset}
          timeRangePreset={timeRangePreset}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      )}

      {/* Expanded Chart Overlay */}
      {expandedChart && (
        <ExpandedChartOverlay onClose={() => setExpandedChart(null)}>
          {expandedChart === 'monthly' && <SpendingTrendD3 data={trendData} granularity={granularity} isExpanded onInfo={() => setInfoChart('monthly')} />}
          {expandedChart === 'donut' && <TargetDonutD3 data={targetDistribution} isExpanded onInfo={() => setInfoChart('donut')} />}
          {expandedChart === 'bar' && <CategoryBarD3 data={categoryTotals} isExpanded onInfo={() => setInfoChart('bar')} />}
          {expandedChart === 'burn' && <BurnRateGaugeD3 spent={kpiMetrics.totalSpent} budget={500000} isExpanded onInfo={() => setInfoChart('burn')} />}
          {expandedChart === 'dayOfWeek' && <DayOfWeekD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('dayOfWeek')} />}
          {expandedChart === 'topShops' && <TopShopsD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('topShops')} />}
          {expandedChart === 'heatmap' && <SpendingHeatmapD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('heatmap')} />}
        </ExpandedChartOverlay>
      )}

      {/* Info Modal */}
      <InfoModal 
        isOpen={!!infoChart}
        onClose={() => setInfoChart(null)}
        title={infoChart ? CHART_INFO[infoChart].title : ''}
        description={infoChart ? CHART_INFO[infoChart].description : ''}
      />
    </div>
  );
}
