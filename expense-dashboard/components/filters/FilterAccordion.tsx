'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  TouchSensor,
  MouseSensor,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FilterState, UniqueFilterValues } from '@/types';

interface FilterAccordionProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  uniqueValues: UniqueFilterValues;
  order: string[];
  setOrder: (order: string[]) => void;
  onClose: () => void;
  onSave: () => void;
  onReset: () => void;
  setTimeRangePreset: (preset: 'month' | 'year' | 'all') => void;
  timeRangePreset: 'month' | 'year' | 'all';
  currentMonth: number;
  currentYear: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Sortable wrapper for drag-and-drop filter reordering
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
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/**
 * Accordion-style filter panel with drag-and-drop reordering.
 * Displays as a bottom sheet on mobile.
 */
export default function FilterAccordion({
  filters,
  setFilters,
  uniqueValues,
  order,
  setOrder,
  onClose,
  onSave,
  onReset,
  setTimeRangePreset,
  timeRangePreset,
  currentMonth,
  currentYear
}: FilterAccordionProps) {
  const [expandedFilters, setExpandedFilters] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    })
  );

  useEffect(() => {
    setMounted(true);
    // Small delay to ensure initial state is rendered before animation
    const timer = setTimeout(() => {
      setVisible(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    // Animate out first
    setVisible(false);
    // Then call actual close after animation completes
    setTimeout(() => {
      onClose();
    }, 350); // Match animation duration
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = order.indexOf(active.id as string);
      const newIndex = order.indexOf(over!.id as string);
      setOrder(arrayMove(order, oldIndex, newIndex));
    }
  };

  // Display helpers
  const getYearDisplay = () => {
    // If explicit date range is set, show that year
    if (filters.dateRange.start) {
      return filters.dateRange.start.getFullYear().toString();
    }
    // If timeRangePreset is 'month' or 'year', we're filtering by current year
    if (timeRangePreset === 'month' || timeRangePreset === 'year') {
      return currentYear.toString();
    }
    // Otherwise, showing all years
    return 'All';
  };

  const getMonthDisplay = () => {
    // If explicit months are selected, show them
    if (filters.months && filters.months.length > 0) {
      if (filters.months.length > 4) return `${filters.months.length} selected`;
      return filters.months.map(m => MONTHS[m - 1]).join(', ');
    }
    // If timeRangePreset is 'month', we're filtering by current month
    if (timeRangePreset === 'month') {
      return MONTHS[currentMonth - 1];
    }
    // Otherwise, showing all months
    return 'All';
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
    setExpandedFilters(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (!mounted) return null;

  // Shared styles
  const sectionStyle: React.CSSProperties = { backgroundColor: '#1B4034' };
  const headerBtnStyle: React.CSSProperties = {
    width: '100%', padding: '16px', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', backgroundColor: '#1B4034', border: 'none', cursor: 'pointer'
  };
  const labelStyle: React.CSSProperties = {
    color: '#A9D9C7', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em'
  };
  const valueStyle: React.CSSProperties = {
    color: '#F2F2F2', fontSize: '14px', fontWeight: 700, maxWidth: '180px',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
  };
  const chipStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    border: isSelected ? '2px solid #614FBB' : '2px solid #1B4032',
    backgroundColor: isSelected ? '#614FBB' : 'transparent',
    color: isSelected ? '#F2F2F2' : '#A9D9C7',
    cursor: 'pointer', transition: 'all 0.2s ease',
  });
  const resetBtnStyle: React.CSSProperties = {
    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
    border: '1px solid #C24656', backgroundColor: 'transparent',
    color: '#C24656', cursor: 'pointer',
  };
  const dividerStyle: React.CSSProperties = { height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' };
  const arrowStyle = (isExpanded: boolean): React.CSSProperties => ({
    color: '#8E8E93', fontSize: '12px',
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s'
  });

  const renderFilter = (id: string) => {
    switch (id) {
      case 'shop':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('shop') && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.shops.map(shop => (
                  <button key={shop} onClick={() => {
                    const current = filters.shops || [];
                    setFilters({ ...filters, shops: current.includes(shop) ? current.filter(s => s !== shop) : [...current, shop] });
                  }} style={chipStyle(filters.shops?.includes(shop) ?? false)}>{shop}</button>
                ))}
              </div>
            )}
            {expandedFilters.has('shop') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('shop')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Shop</span>
                {expandedFilters.has('shop') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, shops: [] }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getShopDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('shop'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'location':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('location') && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.locations.map(loc => (
                  <button key={loc} onClick={() => {
                    const current = filters.locations;
                    setFilters({ ...filters, locations: current.includes(loc) ? current.filter(l => l !== loc) : [...current, loc] });
                  }} style={chipStyle(filters.locations.includes(loc))}>{loc}</button>
                ))}
              </div>
            )}
            {expandedFilters.has('location') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('location')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Location</span>
                {expandedFilters.has('location') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, locations: [] }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getLocationDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('location'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'category':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('category') && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {uniqueValues.categories.map(cat => (
                  <button key={cat} onClick={() => {
                    const current = filters.categories;
                    setFilters({ ...filters, categories: current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat] });
                  }} style={chipStyle(filters.categories.includes(cat))}>{cat}</button>
                ))}
              </div>
            )}
            {expandedFilters.has('category') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('category')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Category</span>
                {expandedFilters.has('category') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, categories: [] }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getCategoryDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('category'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'target':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('target') && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                {['Living', 'Present', 'Future'].map(target => {
                  const isSelected = filters.targets.includes(target);
                  const colors: Record<string, string> = {
                    Living: 'var(--color-living)',
                    Present: 'var(--color-present)',
                    Future: 'var(--color-future)'
                  };
                  const color = colors[target];
                  return (
                    <button key={target} onClick={() => {
                      const current = filters.targets;
                      setFilters({ ...filters, targets: current.includes(target) ? current.filter(t => t !== target) : [...current, target] });
                    }} style={{
                      flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                      border: isSelected ? `2px solid ${color}` : '2px solid #1B4032',
                      backgroundColor: isSelected ? color : 'transparent',
                      color: isSelected ? '#F2F2F2' : '#A9D9C7',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}>{target}</button>
                  );
                })}
              </div>
            )}
            {expandedFilters.has('target') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('target')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Target</span>
                {expandedFilters.has('target') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, targets: [] }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getTargetDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('target'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'month':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('month') && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map(q => (
                    <button key={q} onClick={() => {
                      const start = (q - 1) * 3 + 1;
                      setFilters({ ...filters, months: [start, start + 1, start + 2] });
                      setTimeRangePreset('all');
                    }} style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid #1B4032', backgroundColor: 'transparent', color: '#A9D9C7', cursor: 'pointer' }}>Q{q}</button>
                  ))}
                  <button onClick={() => setFilters({ ...filters, months: [] })} style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid #C24656', backgroundColor: 'transparent', color: '#C24656', cursor: 'pointer' }}>Clear</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {MONTHS.map((m, i) => {
                    const monthNum = i + 1;
                    // Highlight if in explicit filters.months, OR if timeRangePreset is 'month' and it's the current month
                    const isSelected = (filters.months || []).includes(monthNum) ||
                      (timeRangePreset === 'month' && (!filters.months || filters.months.length === 0) && monthNum === currentMonth);
                    return (
                      <button key={m} onClick={() => {
                        const current = filters.months || [];
                        setFilters({ ...filters, months: isSelected ? current.filter(x => x !== monthNum) : [...current, monthNum] });
                        setTimeRangePreset('all');
                      }} style={{ padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: isSelected ? '2px solid #614FBB' : '2px solid #1B4032', backgroundColor: isSelected ? '#614FBB' : 'transparent', color: isSelected ? '#F2F2F2' : '#A9D9C7', cursor: 'pointer', transition: 'all 0.2s ease' }}>{m}</button>
                    );
                  })}
                </div>
              </div>
            )}
            {expandedFilters.has('month') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('month')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Month</span>
                {expandedFilters.has('month') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, months: [] }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getMonthDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('month'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'year':
        return (
          <div style={sectionStyle}>
            {expandedFilters.has('year') && (
              <div style={{ padding: '16px 16px 12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => {
                  setFilters({ ...filters, dateRange: { start: null, end: null } });
                  setTimeRangePreset('all');
                }} style={chipStyle(timeRangePreset === 'all' && !filters.dateRange.start)}>All</button>
                {uniqueValues.years.sort((a, b) => b - a).map(year => {
                  // Highlight if explicit dateRange matches, OR if timeRangePreset is active and year matches currentYear
                  const isSelected = filters.dateRange.start?.getFullYear() === year ||
                    ((timeRangePreset === 'month' || timeRangePreset === 'year') && year === currentYear);
                  return (
                    <button key={year} onClick={() => {
                      setFilters({ ...filters, dateRange: { start: new Date(year, 0, 1), end: new Date(year, 11, 31) } });
                      setTimeRangePreset('all');
                    }} style={chipStyle(isSelected)}>{year}</button>
                  );
                })}
              </div>
            )}
            {expandedFilters.has('year') && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('year')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Year</span>
                {expandedFilters.has('year') && <button onClick={(e) => { e.stopPropagation(); setFilters({ ...filters, dateRange: { start: null, end: null } }); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getYearDisplay()}</span>
                <span style={arrowStyle(expandedFilters.has('year'))}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      default:
        return null;
    }
  };

  const content = (
    <>
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: '64px',
          backgroundColor: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(8px)',
          zIndex: 50,
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease-out',
        }}
      />
      <div className="text-white liquid-card" style={{
        position: 'fixed', left: 0, right: 0, bottom: '64px',
        backgroundColor: '#1B4034', backdropFilter: 'none',
        zIndex: 51, maxHeight: '65vh',
        borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)', border: '1px solid #A9D9C7',
        display: 'flex', flexDirection: 'column',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 350ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Scrollable Filter List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '8px' }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={order} strategy={verticalListSortingStrategy}>
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

        {/* Action Buttons Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid rgba(169, 217, 199, 0.2)',
          display: 'flex',
          gap: '12px',
          backgroundColor: '#1B4034',
        }}>
          <button
            onClick={onSave}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '2px solid #614FBB',
              backgroundColor: 'transparent',
              color: '#614FBB',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            Save View
          </button>
          <button
            onClick={onReset}
            style={{
              flex: 1,
              padding: '14px',
              borderRadius: '12px',
              border: '2px solid #C24656',
              backgroundColor: 'transparent',
              color: '#C24656',
              fontSize: '13px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
            }}
          >
            Reset All
          </button>
          <button
            onClick={handleClose}
            style={{
              width: '52px',
              padding: '14px',
              borderRadius: '12px',
              backgroundColor: '#1B4032',
              border: '2px solid #A9D9C7',
              color: '#A9D9C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Close Filters"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
