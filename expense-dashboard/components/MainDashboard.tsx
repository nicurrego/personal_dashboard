'use client';

import { useState } from 'react';

// Lib
import { 
  aggregateTrendData, 
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
} from '@/lib/dataTransforms';
import { useExpenseData, TimeRangePreset } from '@/lib/hooks/useExpenseData';
import { CHART_INFO, ChartKey } from '@/lib/constants/chartInfo';

// Components
import KPICards from '@/components/KPICards';
import TransactionTable from '@/components/TransactionTable';
import ExpandedChartOverlay from '@/components/dashboard/ExpandedChartOverlay';
import { FilterAccordion } from '@/components/filters';
import { InfoModal, FloatingFilterButton } from '@/components/ui';
import {
  TargetDonutD3,
  CategoryBarD3,
  BurnRateGaugeD3,
  DayOfWeekD3,
  TopShopsD3,
  SpendingHeatmapD3,
} from '@/components/charts';
import SpendingTrendD3 from '@/components/charts/SpendingTrendD3';

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
  const {
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
    currentMonth
  } = useExpenseData();

  // UI State
  const [expandedChart, setExpandedChart] = useState<ChartKey | null>(null);
  const [infoChart, setInfoChart] = useState<ChartKey | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOrder, setFilterOrder] = useState(['location', 'category', 'shop', 'target', 'month', 'year']);

  // Derived Data (computed from filtered expenses)
  const { data: trendData, granularity } = aggregateTrendData(filteredExpenses);
  const kpiMetrics = calculateKPIs(filteredExpenses);
  const targetDistribution = getTargetDistribution(filteredExpenses);
  const categoryTotals = getTopCategories(filteredExpenses, 10);

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-acid-green"></div>
      </div>
    );
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
            
            {/* Time Range Toggle - Full Width Pill Style */}
            <div className="bg-glass-surface/50 backdrop-blur-sm p-1 rounded-xl border border-white/5">
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setTimeRangePreset('month')}
                  className={`relative py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                    timeRangePreset === 'month'
                      ? 'bg-cyber-cyan text-void-black shadow-[0_0_20px_rgba(0,255,255,0.3)]'
                      : 'text-secondary-text hover:text-white hover:bg-white/5'
                  }`}
                >
                  {timeRangePreset === 'month' && (
                    <span className="absolute inset-0 rounded-lg bg-cyber-cyan/20 animate-pulse" />
                  )}
                  <span className="relative z-10">Month</span>
                </button>
                
                <button
                  onClick={() => setTimeRangePreset('year')}
                  className={`relative py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                    timeRangePreset === 'year'
                      ? 'bg-flux-violet text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                      : 'text-secondary-text hover:text-white hover:bg-white/5'
                  }`}
                >
                  {timeRangePreset === 'year' && (
                    <span className="absolute inset-0 rounded-lg bg-flux-violet/20 animate-pulse" />
                  )}
                  <span className="relative z-10">Year</span>
                </button>
                
                <button
                  onClick={() => setTimeRangePreset('all')}
                  className={`relative py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-300 ${
                    timeRangePreset === 'all'
                      ? 'bg-growth-green text-void-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                      : 'text-secondary-text hover:text-white hover:bg-white/5'
                  }`}
                >
                  {timeRangePreset === 'all' && (
                    <span className="absolute inset-0 rounded-lg bg-growth-green/20 animate-pulse" />
                  )}
                  <span className="relative z-10">All</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* KPI Cards */}
        <KPICards metrics={kpiMetrics} />
        
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
      </div>

      {/* Floating Filter Button */}
      <FloatingFilterButton 
        onClick={() => setIsFilterOpen(!isFilterOpen)} 
        count={activeFilterCount}
        isOpen={isFilterOpen}
      />
      
      {/* Reset All Button (visible when filters open) */}
      {isFilterOpen && (
        <button
          onClick={resetFilters}
          className="liquid-button"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '96px',
            zIndex: 9998,
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
