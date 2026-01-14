'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  TouchSensor, 
  MouseSensor,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { 
  Expense, 
  FilterState, 
} from '@/lib/types';
import { 
  parseCSV, 
  getUniqueValues 
} from '@/lib/csvParser';
import { 
  filterExpenses, 
  aggregateByMonth, 
  calculateKPIs,
  getTargetDistribution,
  getTopCategories,
} from '@/lib/dataTransforms';

// Components
import KPICards from '@/components/KPICards';
import MonthlyTrendD3 from '@/components/charts/MonthlyTrendD3';
import TargetDonutD3 from '@/components/charts/TargetDonutD3';
import CategoryBarD3 from '@/components/charts/CategoryBarD3';
import BurnRateGaugeD3 from '@/components/charts/BurnRateGaugeD3';
import DayOfWeekD3 from '@/components/charts/DayOfWeekD3';
import TopShopsD3 from '@/components/charts/TopShopsD3';
import TransactionTable from '@/components/TransactionTable';
import FloatingFilterButton from '@/components/FloatingFilterButton';
import InfoModal from '@/components/InfoModal';
import SpendingHeatmapD3 from '@/components/charts/SpendingHeatmapD3';

const CHART_INFO = {
  monthly: {
    title: 'Monthly Spending Trend',
    description: 'Tracks your total spending over time compared to previous months.\n\nThe colored lines break down spending to help you visualize your balance:\n• Living (Cyan): Essential needs.\n• Present (Amber): Wants and short-term enjoyment.\n• Future (Green): Savings and investments.'
  },
  burn: {
    title: 'Burn Rate Gauge',
    description: 'A speedometer for your budget.\n\n• Blue Arc: How much of the month has passed.\n• Colored Arc: How much budget you have used.\n\nIf the colored arc is longer than the blue one, you are "Burning Fast" (spending faster than time is passing).'
  },
  donut: {
    title: 'Target Distribution',
    description: 'See the balance of your financial life. Ideally, you might aim for a 50/30/20 split:\n\n• 50% Living (Needs)\n• 30% Present (Wants)\n• 20% Future (Savings)\n\nThis donut chart shows your actual current split.'
  },
  bar: {
    title: 'Top Categories',
    description: 'Your biggest money sinks.\n\nThis bar chart ranks your expenses by category so you can instantly spot what is eating up your budget—whether it is Housing, Food, or Entertainment.'
  },
  dayOfWeek: {
    title: 'Day of Week Analysis',
    description: 'Discover your weekly spending rhythm.\n\n• Bars show total spending for each day (Sun-Sat).\n• Use this to identify if you tend to overspend on weekends or specific weekdays.'
  },
  topShops: {
    title: 'Top Shops',
    description: 'Your most frequented merchants.\n\n• Bars represent total spending at each shop.\n• Identifies where your money goes most often (e.g., specific supermarkets, cafes, or subscriptions).'
  },
  heatmap: {
    title: 'Spending Heatmap (Daily)',
    description: 'A calendar view of your spending habits.\n\n• Rows: Days of the week (Sun to Sat).\n• Columns: Weeks of the year.\n• Intensity: Brighter/Pinker cells mean higher spending on that specific day.\n\n💡 Ways to use this chart:\n1. Single Month: See exactly which days you splurged.\n2. One Category: Track habits (e.g., "Do I buy coffee every Tuesday?").\n3. Current Year: Get a bird\'s-eye view of your entire year\'s density.\n4. Location: See if specific places trigger spending streaks.\n5. Living vs. Wants: Filter by Target to see if "Needs" are consistent vs. erratic "Wants".'
  }
};

interface MainDashboardProps {
  showTransactions?: boolean;
}

export default function MainDashboard({ showTransactions = true }: MainDashboardProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [infoChart, setInfoChart] = useState<string | null>(null);
  
  const [filterOrder, setFilterOrder] = useState(['location', 'category', 'shop', 'target', 'month', 'year']);

  const [filters, setFilters] = useState<FilterState>({
    dateRange: { start: null, end: null },
    targets: [],
    categories: [],
    locations: [],
    methods: [],
    shops: []
  });

  const [uniqueValues, setUniqueValues] = useState({
    years: [] as number[],
    targets: [] as string[],
    categories: [] as string[],
    locations: [] as string[],
    methods: [] as string[],
    shops: [] as string[]
  });

  // Load Data

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/expenses_combined_english.csv');
        const csvText = await response.text();
        const parsedData = parseCSV(csvText);
        
        setExpenses(parsedData);
        setFilteredExpenses(parsedData);
        
        // Extract unique values for filters
        setUniqueValues({
          years: Array.from(new Set(parsedData.map(e => e.year))).sort(),
          targets: getUniqueValues(parsedData, 'target'),
          categories: getUniqueValues(parsedData, 'category'),
          locations: getUniqueValues(parsedData, 'location'),
          methods: getUniqueValues(parsedData, 'method'),
          shops: getUniqueValues(parsedData, 'shop')
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Filter Data
  useEffect(() => {
    if (expenses.length > 0) {
      const filtered = filterExpenses(expenses, filters);
      setFilteredExpenses(filtered);
    }
  }, [filters, expenses]);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Derived Unique Values (Cascading Filters)
  useEffect(() => {
    if (expenses.length === 0) return;

    // Filter by Date (Year/Month) only to determine available options for other fields
    const dateFiltered = expenses.filter(expense => {
      // Date Range
      if (filters.dateRange.start || filters.dateRange.end) {
        const expenseDate = new Date(expense.date);
        if (filters.dateRange.start && expenseDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && expenseDate > filters.dateRange.end) return false;
      }
      // Month
      if (filters.months && filters.months.length > 0) {
        const expenseMonth = new Date(expense.date).getMonth() + 1;
        if (!filters.months.includes(expenseMonth)) return false;
      }
      return true;
    });

    setUniqueValues(prev => ({
      ...prev,
      categories: getUniqueValues(dateFiltered, 'category'),
      locations: getUniqueValues(dateFiltered, 'location'),
      targets: getUniqueValues(dateFiltered, 'target'),
      methods: getUniqueValues(dateFiltered, 'method'),
      shops: getUniqueValues(dateFiltered, 'shop')
    }));
  }, [filters.dateRange, filters.months, expenses]);

  // Derived Data
  const monthlyData = aggregateByMonth(filteredExpenses);
  const kpiMetrics = calculateKPIs(filteredExpenses);
  const targetDistribution = getTargetDistribution(filteredExpenses);
  const categoryTotals = getTopCategories(filteredExpenses, 10);

  // Count active filters
  const activeFilterCount = 
    (filters.dateRange.start ? 1 : 0) + 
    (filters.months?.length || 0) + 
    filters.categories.length + 
    filters.locations.length + 
    filters.shops.length + 
    filters.targets.length;

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
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white tracking-wide uppercase">Dashboard</h1>
          <p className="text-xs text-secondary-text font-mono">
            {filteredExpenses.length} records
          </p>
        </div>

        {/* KPI Cards */}
        <KPICards metrics={kpiMetrics} />
        
        {/* Charts Grid - Mobile Optimized */}
        <div className="space-y-4">
            {/* Monthly Trend - Full Width */}
            <MonthlyTrendD3 
              data={monthlyData} 
              onExpand={() => setExpandedChart('monthly')}
              onInfo={() => setInfoChart('monthly')}
            />
          
          
          {/* Distribution, Burn Rate, & Categories - Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <BurnRateGaugeD3 
              spent={kpiMetrics.totalSpent}
              budget={500000} // TODO: Make this dynamic/setting
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

          {/* New Grid: Day of Week & Top Shops */}
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
            expenses={filteredExpenses} // Use filtered expenses for dynamic updates
            onExpand={() => setExpandedChart('heatmap')}
            onInfo={() => setInfoChart('heatmap')}
          />
        </div>
        
        {/* Detailed Table (Conditional) */}
        {showTransactions && (
          <div className="mt-6">
            <TransactionTable expenses={filteredExpenses} />
          </div>
        )}
      </div>

      {/* Floating Filter Button - Toggle open/close */}
      <FloatingFilterButton 
        onClick={() => setIsFilterOpen(!isFilterOpen)} 
        count={activeFilterCount}
        isOpen={isFilterOpen}
      />
      
      {/* Search/Reset Floating Actions */}
      {isFilterOpen && (
        <button
          onClick={() => setFilters({
            dateRange: { start: null, end: null },
            categories: [],
            locations: [],
            targets: [],
            months: [],
            shops: []
          })}
          className="liquid-button"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '96px', // Next to FAB (24px + 56px + ~16px gap)
            zIndex: 9998,
            padding: '0 20px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: 'rgba(217, 70, 239, 0.2)', // Laser Magenta tint
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

      {/* Filter Popup - Accordion Style */}
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
          {expandedChart === 'monthly' && (
            <MonthlyTrendD3 data={monthlyData} isExpanded onInfo={() => setInfoChart('monthly')} />
          )}
          {expandedChart === 'donut' && (
            <TargetDonutD3 data={targetDistribution} isExpanded onInfo={() => setInfoChart('donut')} />
          )}
          {expandedChart === 'bar' && (
            <CategoryBarD3 data={categoryTotals} isExpanded onInfo={() => setInfoChart('bar')} />
          )}
          {expandedChart === 'burn' && (
            <BurnRateGaugeD3 spent={kpiMetrics.totalSpent} budget={500000} isExpanded onInfo={() => setInfoChart('burn')} />
          )}
          {expandedChart === 'dayOfWeek' && (
            <DayOfWeekD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('dayOfWeek')} />
          )}
          {expandedChart === 'topShops' && (
            <TopShopsD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('topShops')} />
          )}
          {expandedChart === 'heatmap' && (
            <SpendingHeatmapD3 expenses={filteredExpenses} isExpanded onInfo={() => setInfoChart('heatmap')} />
          )}
        </ExpandedChartOverlay>
      )}

      {/* Info Modal */}
      <InfoModal 
        isOpen={!!infoChart}
        onClose={() => setInfoChart(null)}
        title={infoChart ? CHART_INFO[infoChart as keyof typeof CHART_INFO].title : ''}
        description={infoChart ? CHART_INFO[infoChart as keyof typeof CHART_INFO].description : ''}
      />
    </div>
  );
}

function ExpandedChartOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [showControls, setShowControls] = useState(true);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return createPortal(
    <div 
      onClick={() => setShowControls(prev => !prev)}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Close Button - Toggleable */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: 'fixed',
          top: '32px',
          right: '32px',
          zIndex: 100001,
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'opacity 0.3s ease, transform 0.2s ease',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {/* Rotated Container for Landscape View on Mobile */}
      <div
        onClick={(e) => {
          // Allow clicks on chart to also toggle
        }}
        style={{
          // Width becomes vertical height on screen (100vh minus safety margins)
          width: 'calc(100vh - 160px)', 
          // Height becomes horizontal width on screen
          height: '100vw',
          // Center and Rotate
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%) rotate(90deg)',
          
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ width: '100%', height: '100%' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}

// Accordion Filter Component
function SortableFilterItem({ id, children }: { id: string; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
    position: 'relative',
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none', // Critical for preventing scroll while dragging
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

// Accordion Filter Component
function FilterAccordion({ 
  filters, 
  setFilters, 
  uniqueValues,
  order,
  setOrder,
  onClose
}: { 
  filters: FilterState; 
  setFilters: (f: FilterState) => void;
  uniqueValues: { years: number[]; categories: string[]; locations: string[]; targets: string[]; methods: string[]; shops: string[] };
  order: string[];
  setOrder: (order: string[]) => void;
  onClose: () => void;
}) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setOrder((items: string[]) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over!.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getYearDisplay = () => {
    if (!filters.dateRange.start) return 'All';
    return filters.dateRange.start.getFullYear().toString();
  };

  const getMonthDisplay = () => {
    if (!filters.months || filters.months.length === 0) return 'All';
    if (filters.months.length > 4) return `${filters.months.length} selected`;
    return filters.months.map(m => MONTHS[m - 1]).join(', ');
  };

  const getTargetDisplay = () => {
    if (filters.targets.length === 0) return 'All';
    return filters.targets.join(', ');
  };

  const getCategoryDisplay = () => {
    if (filters.categories.length === 0) return 'All';
    if (filters.categories.length > 2) return `${filters.categories.length} selected`;
    return filters.categories.join(', ');
  };

  const getLocationDisplay = () => {
    if (filters.locations.length === 0) return 'All';
    if (filters.locations.length > 2) return `${filters.locations.length} selected`;
    return filters.locations.join(', ');
  };

  const getShopDisplay = () => {
    if (!filters.shops || filters.shops.length === 0) return 'All';
    if (filters.shops.length > 2) return `${filters.shops.length} selected`;
    return filters.shops.join(', ');
  };

  const toggleSection = (section: string) => {
    setExpandedFilter(expandedFilter === section ? null : section);
  };

  if (!mounted) return null;

  const renderFilter = (id: string) => {
    switch (id) {
      case 'shop':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'shop' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.shops.map(shop => {
                  const isSelected = filters.shops?.includes(shop);
                  return (
                    <button
                      key={shop}
                      onClick={() => {
                        const current = filters.shops || [];
                        setFilters({
                          ...filters,
                          shops: current.includes(shop) ? current.filter(s => s !== shop) : [...current, shop]
                        });
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                        backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#8E8E93',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {shop}
                    </button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'shop' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('shop')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shop</span>
                {expandedFilter === 'shop' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, shops: []});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getShopDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'shop' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );

      case 'location':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'location' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.locations.map(loc => {
                  const isSelected = filters.locations.includes(loc);
                  return (
                    <button
                      key={loc}
                      onClick={() => {
                        const current = filters.locations;
                        setFilters({
                          ...filters,
                          locations: current.includes(loc) ? current.filter(l => l !== loc) : [...current, loc]
                        });
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                        backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#8E8E93',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'location' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('location')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Location</span>
                {expandedFilter === 'location' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, locations: []});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getLocationDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'location' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );

      case 'category':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'category' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {uniqueValues.categories.map(cat => {
                  const isSelected = filters.categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      onClick={() => {
                        const current = filters.categories;
                        setFilters({
                          ...filters,
                          categories: current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat]
                        });
                      }}
                      style={{
                        padding: '10px 16px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                        backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#8E8E93',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'category' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('category')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                {expandedFilter === 'category' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, categories: []});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getCategoryDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'category' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );

      case 'target':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'target' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                {['Living', 'Present', 'Future'].map(target => {
                  const isSelected = filters.targets.includes(target);
                  const targetColors: { [key: string]: string } = {
                    'Living': '#06b6d4',   // Cyber Cyan
                    'Present': '#f59e0b',  // Alert Amber
                    'Future': '#22c55e'    // Growth Green
                  };
                  const color = targetColors[target];
                  return (
                    <button
                      key={target}
                      onClick={() => {
                        const current = filters.targets;
                        setFilters({
                          ...filters,
                          targets: current.includes(target) ? current.filter(t => t !== target) : [...current, target]
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: isSelected ? `2px solid ${color}` : '2px solid #3A3A3C',
                        backgroundColor: isSelected ? color : 'transparent',
                        color: isSelected ? (target === 'Future' || target === 'Present' ? '#000000' : '#FFFFFF') : '#8E8E93',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {target}
                    </button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'target' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('target')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</span>
                {expandedFilter === 'target' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, targets: []});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700 }}>{getTargetDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'target' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );

      case 'month':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'month' && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map(q => (
                    <button 
                      key={q}
                      onClick={() => {
                        const start = (q-1)*3+1;
                        setFilters({...filters, months: [start, start+1, start+2]});
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        border: '1px solid #3A3A3C',
                        backgroundColor: 'transparent',
                        color: '#8E8E93',
                        cursor: 'pointer',
                      }}
                    >
                      Q{q}
                    </button>
                  ))}
                  <button 
                    onClick={() => setFilters({...filters, months: []})}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.3)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {MONTHS.map((m, i) => {
                    const monthNum = i + 1;
                    const isSelected = (filters.months || []).includes(monthNum);
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          const current = filters.months || [];
                          setFilters({
                            ...filters,
                            months: isSelected ? current.filter(x => x !== monthNum) : [...current, monthNum]
                          });
                        }}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                          backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#8E8E93',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {expandedFilter === 'month' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('month')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Month</span>
                {expandedFilter === 'month' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, months: []});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700 }}>{getMonthDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'month' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );

      case 'year':
        return (
          <div style={{ backgroundColor: '#000000' }}>
            {expandedFilter === 'year' && (
              <div style={{ padding: '16px 16px 12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setFilters({...filters, dateRange: { start: null, end: null }})}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: 600,
                    border: !filters.dateRange.start ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                    backgroundColor: !filters.dateRange.start ? '#8B5CF6' : 'transparent',
                    color: !filters.dateRange.start ? '#FFFFFF' : '#8E8E93',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  All
                </button>
                {uniqueValues.years.sort((a,b) => b-a).map(year => {
                  const isSelected = filters.dateRange.start?.getFullYear() === year;
                  return (
                    <button 
                      key={year}
                      onClick={() => setFilters({
                        ...filters,
                        dateRange: { start: new Date(year, 0, 1), end: new Date(year, 11, 31) }
                      })}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: 600,
                        border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
                        backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#8E8E93',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {year}
                    </button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'year' && (
              <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 16px' }} />
            )}
            <button 
              onClick={() => toggleSection('year')}
              style={{ 
                width: '100%', 
                padding: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                backgroundColor: '#000000',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Year</span>
                {expandedFilter === 'year' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFilters({...filters, dateRange: { start: null, end: null }});
                    }}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      border: '1px solid rgba(255,159,10,0.5)',
                      backgroundColor: 'transparent',
                      color: '#FF9F0A',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#8B5CF6', fontSize: '14px', fontWeight: 700 }}>{getYearDisplay()}</span>
                <span style={{ color: '#8E8E93', fontSize: '12px', transform: expandedFilter === 'year' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
              </div>
            </button>
            <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          </div>
        );
      
      default:
        return null;
    }
  };

  const content = (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 9996,
        }}
      />
      <div 
        className="text-white liquid-card"
        style={{ 
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: '100px', // Position above FAB button
          backgroundColor: 'rgba(0, 0, 0, 0.85)', // Slightly transparent black
          backdropFilter: 'blur(20px)', // Glass effect on the panel itself
          zIndex: 9997,
          maxHeight: '70vh',
          overflowY: 'auto',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter} 
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={order} 
          strategy={verticalListSortingStrategy}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {order.map(id => (
              <SortableFilterItem key={id} id={id}>
                {renderFilter(id)}
              </SortableFilterItem>
            ))}
          </div>
        </SortableContext>
      </DndContext>
      </div>
    </>
  );

  return createPortal(content, document.body);
}

