'use client';

import { useState } from 'react';

// Lib
import { 
  aggregateByMonth, 
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
} from '@/lib/dataTransforms';
import { useExpenseData } from '@/lib/hooks/useExpenseData';
import { CHART_INFO, ChartKey } from '@/lib/constants/chartInfo';

// Components
import KPICards from '@/components/KPICards';
import TransactionTable from '@/components/TransactionTable';
import ExpandedChartOverlay from '@/components/dashboard/ExpandedChartOverlay';
import { FilterAccordion } from '@/components/filters';
import { InfoModal, FloatingFilterButton } from '@/components/ui';
import {
  MonthlyTrendD3,
  TargetDonutD3,
  CategoryBarD3,
  BurnRateGaugeD3,
  DayOfWeekD3,
  TopShopsD3,
  SpendingHeatmapD3,
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
  // Data & Filters from custom hook
  const {
    filteredExpenses,
    loading,
    filters,
    setFilters,
    resetFilters,
    uniqueValues,
    activeFilterCount
  } = useExpenseData();

  // UI State
  const [expandedChart, setExpandedChart] = useState<ChartKey | null>(null);
  const [infoChart, setInfoChart] = useState<ChartKey | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterOrder, setFilterOrder] = useState(['location', 'category', 'shop', 'target', 'month', 'year']);

  // Derived Data (computed from filtered expenses)
  const monthlyData = aggregateByMonth(filteredExpenses);
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
        <header className="mb-4">
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">Dashboard</h1>
          <p className="text-xs text-secondary-text font-mono">
            {filteredExpenses.length} records
          </p>
        </header>

        {/* KPI Cards */}
        <KPICards metrics={kpiMetrics} />
        
        {/* Charts Grid */}
        <div className="space-y-4">
          
          {/* Monthly Trend - Full Width */}
          <MonthlyTrendD3 
            data={monthlyData} 
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
          {expandedChart === 'monthly' && <MonthlyTrendD3 data={monthlyData} isExpanded onInfo={() => setInfoChart('monthly')} />}
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
