'use client';

import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { triggerHaptic } from '../../utils/formatters';
import type { BudgetTotals } from '../../types';
import type { ChartType } from '../charts/types';
import { CHART_DEFINITIONS } from '../charts/types';
// Use new D3-powered charts for better visual quality
import { BudgetDonutD3 } from '../charts/BudgetDonutD3';
import { BudgetFlowD3 } from '../charts/BudgetFlowD3';
import { BudgetProjectionD3 } from '../charts/BudgetProjectionD3';
import { BudgetBarD3 } from '../charts/BudgetBarD3';
// Keep original charts for treemap (no D3 version yet)
import { CategoryTreemap } from '../charts/category-treemap';

interface GraphModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedChartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  totals: BudgetTotals;
}

export function GraphModal({ isOpen, onClose, selectedChartType, onChartTypeChange, totals }: GraphModalProps) {
  const [currentIndex, setCurrentIndex] = useState(() => 
    CHART_DEFINITIONS.findIndex(c => c.id === selectedChartType) || 0
  );
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  if (!isOpen) return null;

  const currentChart = CHART_DEFINITIONS[currentIndex];
  const isStarred = selectedChartType === currentChart.id;

  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < CHART_DEFINITIONS.length - 1) {
      setCurrentIndex(prev => prev + 1);
      triggerHaptic();
    }
    if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      triggerHaptic();
    }
  };

  const renderChart = (chartId: ChartType, size: 'small' | 'large') => {
    const props = { totals, size, monthlyNetCashFlow: totals.income - (totals.future + totals.living + totals.present) };
    
    switch (chartId) {
      case 'DONUT':
        return <BudgetDonutD3 {...props} />;
      case 'SANKEY':
        return <BudgetFlowD3 {...props} />;
      case 'PROJECTION':
        return <BudgetProjectionD3 {...props} />;
      case 'TREEMAP':
        return <CategoryTreemap {...props} />;
      case 'COMPARISON':
        return <BudgetBarD3 {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-200 pointer-events-auto">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-300 max-h-[85vh] overflow-y-auto"
        onTouchStart={(e) => {
          setTouchEnd(null);
          setTouchStart(e.targetTouches[0].clientX);
        }}
        onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
        onTouchEnd={handleSwipe}
      >
        {/* Header Row: Star Button + Close Button */}
        <div className="flex items-center justify-between mb-4">
          {/* Star Button - Top Left */}
          <button
            onClick={() => {
              onChartTypeChange(currentChart.id);
              triggerHaptic();
            }}
            className={`p-2 rounded-full transition-all active:scale-90 ${
              isStarred 
                ? 'bg-yellow-500/20 text-yellow-400' 
                : 'bg-white/5 text-slate-500 hover:text-yellow-400 hover:bg-yellow-500/10'
            }`}
            title={isStarred ? 'Shown on Summary' : 'Set as Summary Chart'}
          >
            <Star className={`w-5 h-5 ${isStarred ? 'fill-current' : ''}`} />
          </button>

          {/* Close Button - Top Right */}
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Title & Description */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-white mb-1">{currentChart.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{currentChart.description}</p>
          {isStarred && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
              <Star className="w-3 h-3 fill-current" /> Shown on Summary
            </span>
          )}
        </div>

        {/* Large Chart */}
        <div className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 flex items-center justify-center min-h-[200px] relative">
          {renderChart(currentChart.id, 'large')}
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {CHART_DEFINITIONS.map((chart, i) => (
            <button
              key={chart.id}
              onClick={() => { setCurrentIndex(i); triggerHaptic(); }}
              className={`transition-all duration-300 rounded-full ${
                i === currentIndex 
                  ? 'w-6 h-2 bg-white' 
                  : 'w-2 h-2 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>

        {/* Chart Selector Thumbnails */}
        <div className="grid grid-cols-5 gap-2">
          {CHART_DEFINITIONS.map((chart, i) => (
            <button
              key={chart.id}
              onClick={() => { setCurrentIndex(i); triggerHaptic(); }}
              className={`relative p-2 rounded-xl border transition-all ${
                i === currentIndex
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/5 bg-white/[0.02] hover:bg-white/5'
              }`}
            >
              <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
                {renderChart(chart.id, 'small')}
              </div>
              {selectedChartType === chart.id && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-black fill-current" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Swipe Hint */}
        <p className="text-center text-slate-600 text-xs mt-4">Swipe or tap to explore charts</p>
      </div>
    </div>
  );
}
