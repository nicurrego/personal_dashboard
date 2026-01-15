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
import { FilterState } from '@/lib/types';
import { UniqueFilterValues } from '@/lib/hooks/useExpenseData';

interface FilterAccordionProps {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  uniqueValues: UniqueFilterValues;
  order: string[];
  setOrder: (order: string[]) => void;
  onClose: () => void;
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
  onClose
}: FilterAccordionProps) {
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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
  }, []);

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

  // Shared styles
  const sectionStyle: React.CSSProperties = { backgroundColor: '#000000' };
  const headerBtnStyle: React.CSSProperties = { 
    width: '100%', padding: '16px', display: 'flex', alignItems: 'center', 
    justifyContent: 'space-between', backgroundColor: '#000000', border: 'none', cursor: 'pointer' 
  };
  const labelStyle: React.CSSProperties = { 
    color: '#8E8E93', fontSize: '14px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' 
  };
  const valueStyle: React.CSSProperties = { 
    color: '#8B5CF6', fontSize: '14px', fontWeight: 700, maxWidth: '180px', 
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
  };
  const chipStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 16px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
    border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C',
    backgroundColor: isSelected ? '#8B5CF6' : 'transparent',
    color: isSelected ? '#FFFFFF' : '#8E8E93',
    cursor: 'pointer', transition: 'all 0.2s ease',
  });
  const resetBtnStyle: React.CSSProperties = {
    padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600,
    border: '1px solid rgba(255,159,10,0.5)', backgroundColor: 'transparent',
    color: '#FF9F0A', cursor: 'pointer',
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
            {expandedFilter === 'shop' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.shops.map(shop => (
                  <button key={shop} onClick={() => {
                    const current = filters.shops || [];
                    setFilters({ ...filters, shops: current.includes(shop) ? current.filter(s => s !== shop) : [...current, shop] });
                  }} style={chipStyle(filters.shops?.includes(shop) ?? false)}>{shop}</button>
                ))}
              </div>
            )}
            {expandedFilter === 'shop' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('shop')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Shop</span>
                {expandedFilter === 'shop' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, shops: []}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getShopDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'shop')}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'location':
        return (
          <div style={sectionStyle}>
            {expandedFilter === 'location' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', maxHeight: '250px', overflowY: 'auto' }}>
                {uniqueValues.locations.map(loc => (
                  <button key={loc} onClick={() => {
                    const current = filters.locations;
                    setFilters({ ...filters, locations: current.includes(loc) ? current.filter(l => l !== loc) : [...current, loc] });
                  }} style={chipStyle(filters.locations.includes(loc))}>{loc}</button>
                ))}
              </div>
            )}
            {expandedFilter === 'location' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('location')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Location</span>
                {expandedFilter === 'location' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, locations: []}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getLocationDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'location')}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'category':
        return (
          <div style={sectionStyle}>
            {expandedFilter === 'category' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {uniqueValues.categories.map(cat => (
                  <button key={cat} onClick={() => {
                    const current = filters.categories;
                    setFilters({ ...filters, categories: current.includes(cat) ? current.filter(c => c !== cat) : [...current, cat] });
                  }} style={chipStyle(filters.categories.includes(cat))}>{cat}</button>
                ))}
              </div>
            )}
            {expandedFilter === 'category' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('category')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Category</span>
                {expandedFilter === 'category' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, categories: []}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getCategoryDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'category')}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'target':
        return (
          <div style={sectionStyle}>
            {expandedFilter === 'target' && (
              <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                {['Living', 'Present', 'Future'].map(target => {
                  const isSelected = filters.targets.includes(target);
                  const colors: Record<string, string> = { Living: '#06b6d4', Present: '#f59e0b', Future: '#22c55e' };
                  const color = colors[target];
                  return (
                    <button key={target} onClick={() => {
                      const current = filters.targets;
                      setFilters({ ...filters, targets: current.includes(target) ? current.filter(t => t !== target) : [...current, target] });
                    }} style={{
                      flex: 1, padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600,
                      border: isSelected ? `2px solid ${color}` : '2px solid #3A3A3C',
                      backgroundColor: isSelected ? color : 'transparent',
                      color: isSelected ? (target === 'Future' || target === 'Present' ? '#000' : '#FFF') : '#8E8E93',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}>{target}</button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'target' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('target')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Target</span>
                {expandedFilter === 'target' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, targets: []}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getTargetDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'target')}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'month':
        return (
          <div style={sectionStyle}>
            {expandedFilter === 'month' && (
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  {[1, 2, 3, 4].map(q => (
                    <button key={q} onClick={() => {
                      const start = (q-1)*3+1;
                      setFilters({...filters, months: [start, start+1, start+2]});
                    }} style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid #3A3A3C', backgroundColor: 'transparent', color: '#8E8E93', cursor: 'pointer' }}>Q{q}</button>
                  ))}
                  <button onClick={() => setFilters({...filters, months: []})} style={{ padding: '6px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 600, border: '1px solid rgba(255,159,10,0.3)', backgroundColor: 'transparent', color: '#FF9F0A', cursor: 'pointer' }}>Clear</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {MONTHS.map((m, i) => {
                    const monthNum = i + 1;
                    const isSelected = (filters.months || []).includes(monthNum);
                    return (
                      <button key={m} onClick={() => {
                        const current = filters.months || [];
                        setFilters({ ...filters, months: isSelected ? current.filter(x => x !== monthNum) : [...current, monthNum] });
                      }} style={{ padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, border: isSelected ? '2px solid #8B5CF6' : '2px solid #3A3A3C', backgroundColor: isSelected ? '#8B5CF6' : 'transparent', color: isSelected ? '#FFFFFF' : '#8E8E93', cursor: 'pointer', transition: 'all 0.2s ease' }}>{m}</button>
                    );
                  })}
                </div>
              </div>
            )}
            {expandedFilter === 'month' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('month')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Month</span>
                {expandedFilter === 'month' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, months: []}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getMonthDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'month')}>▼</span>
              </div>
            </button>
            <div style={dividerStyle} />
          </div>
        );

      case 'year':
        return (
          <div style={sectionStyle}>
            {expandedFilter === 'year' && (
              <div style={{ padding: '16px 16px 12px 16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setFilters({...filters, dateRange: { start: null, end: null }})} style={chipStyle(!filters.dateRange.start)}>All</button>
                {uniqueValues.years.sort((a,b) => b-a).map(year => {
                  const isSelected = filters.dateRange.start?.getFullYear() === year;
                  return (
                    <button key={year} onClick={() => setFilters({ ...filters, dateRange: { start: new Date(year, 0, 1), end: new Date(year, 11, 31) } })} style={chipStyle(isSelected)}>{year}</button>
                  );
                })}
              </div>
            )}
            {expandedFilter === 'year' && <div style={{ ...dividerStyle, margin: '0 16px' }} />}
            <button onClick={() => toggleSection('year')} style={headerBtnStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={labelStyle}>Year</span>
                {expandedFilter === 'year' && <button onClick={(e) => { e.stopPropagation(); setFilters({...filters, dateRange: { start: null, end: null }}); }} style={resetBtnStyle}>Reset</button>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={valueStyle}>{getYearDisplay()}</span>
                <span style={arrowStyle(expandedFilter === 'year')}>▼</span>
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', zIndex: 9996 }} />
      <div className="text-white liquid-card" style={{ 
        position: 'fixed', left: 0, right: 0, bottom: '100px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(20px)',
        zIndex: 9997, maxHeight: '70vh', overflowY: 'auto',
        borderTopLeftRadius: '20px', borderTopRightRadius: '20px',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)',
      }}>
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
    </>
  );

  return createPortal(content, document.body);
}
