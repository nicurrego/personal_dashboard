'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_CATEGORIES, TargetType } from '@/lib/constants/defaultCategories';

interface BudgetRow {
  Year: number;
  Month: number;
  Target: string;
  Category: string;
  Budget: number;
}

const TARGET_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Future: { bg: 'bg-growth-green/10', text: 'text-growth-green', border: 'border-growth-green' },
  Living: { bg: 'bg-cyber-cyan/10', text: 'text-cyber-cyan', border: 'border-cyber-cyan' },
  Present: { bg: 'bg-alert-amber/10', text: 'text-alert-amber', border: 'border-alert-amber' },
};

const TARGET_ORDER: TargetType[] = ['Future', 'Living', 'Present'];

export default function BudgetPage() {
  const [data, setData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  // Default to current year
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({
    Future: true,
    Living: true,
    Present: true,
  });

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/budgets');
        if (!response.ok) throw new Error('Failed to load budget');
        
        const rawData = await response.json();
        
        const parsed: BudgetRow[] = rawData.map((b: any) => ({
          Year: Number(b.year),
          Month: Number(b.month),
          Target: b.target,
          Category: b.category,
          Budget: Number(b.amount)
        }));
        
        setData(parsed);
        // If we have data, we might want to switch year, but defaulting to current is safer for empty state
        if (parsed.length > 0) {
          const years = [...new Set(parsed.map(d => d.Year))].sort();
          if (years.includes(new Date().getFullYear())) {
             setSelectedYear(new Date().getFullYear());
          } else {
             setSelectedYear(years[years.length - 1]);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error loading budget:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Use available years from data OR just current year if empty
  const dataYears = [...new Set(data.map(d => d.Year))].sort();
  const years = dataYears.length > 0 ? dataYears : [new Date().getFullYear()];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Filter data for selected year
  const filteredData = data.filter(d => d.Year === selectedYear);
  
  const getCategoryRowData = (category: string) => {
    const row: Record<string, number> = {};
    months.forEach((_, idx) => {
      const monthNum = idx + 1;
      const entry = filteredData.find(d => d.Category === category && d.Month === monthNum);
      row[months[idx]] = entry?.Budget || 0;
    });
    row.Total = months.reduce((sum, m) => sum + (row[m] || 0), 0);
    return row;
  };

  // Calculate totals based on DEFAULT categories + actual data
  // Logic: Iterate default categories, find their values.
  const getTargetTotal = (target: TargetType) => {
    const categories = DEFAULT_CATEGORIES[target];
    return categories.reduce((total, category) => {
        const rowData = getCategoryRowData(category);
        return total + rowData.Total;
    }, 0);
  };

  const formatCurrency = (val: number) => `¥${val.toLocaleString()}`;

  const toggleTarget = (target: string) => {
    setExpandedTargets(prev => ({ ...prev, [target]: !prev[target] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="text-secondary-text text-sm hover:text-white transition-colors mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Monthly Budget</h1>
            <p className="text-secondary-text text-sm font-mono">{selectedYear} Plan</p>
          </div>
          
          {/* Year Selector */}
          <div className="flex gap-2">
            {years.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedYear === year
                    ? 'bg-cyber-cyan text-black'
                    : 'bg-glass-surface text-secondary-text hover:bg-neutral-800'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {TARGET_ORDER.map(target => {
            const colors = TARGET_COLORS[target];
            const total = getTargetTotal(target);
            return (
              <div key={target} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
                <p className={`text-sm font-bold ${colors.text} mb-1`}>{target}</p>
                <p className="text-2xl font-bold text-white">{formatCurrency(total)}</p>
                <p className="text-secondary-text text-xs">/year</p>
              </div>
            );
          })}
        </div>

        {/* Budget Tables by Target */}
        <div className="space-y-6">
          {TARGET_ORDER.map((target) => {
            const categories = DEFAULT_CATEGORIES[target];
            const colors = TARGET_COLORS[target];
            const isExpanded = expandedTargets[target];
            
            return (
              <div key={target} className={`liquid-card overflow-hidden border-l-4 ${colors.border}`}>
                {/* Target Header */}
                <button
                  onClick={() => toggleTarget(target)}
                  className={`w-full p-4 flex justify-between items-center ${colors.bg} hover:bg-opacity-80 transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${colors.text}`}>{target}</span>
                    <span className="text-secondary-text text-sm">({categories.length} categories)</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-mono font-bold ${colors.text}`}>
                      {formatCurrency(getTargetTotal(target))}
                    </span>
                    <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </div>
                </button>

                {/* Table */}
                {isExpanded && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left p-3 text-secondary-text font-medium sticky left-0 bg-glass-surface z-10 min-w-[200px]">
                            Category
                          </th>
                          {months.map(m => (
                            <th key={m} className="text-right p-3 text-secondary-text font-medium min-w-[80px]">{m}</th>
                          ))}
                          <th className={`text-right p-3 font-bold ${colors.text} min-w-[100px]`}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((category, i) => {
                          const rowData = getCategoryRowData(category);
                          const isZeroRow = rowData.Total === 0;
                          
                          return (
                            <tr key={i} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isZeroRow ? 'opacity-60 hover:opacity-100' : ''}`}>
                              <td className="p-3 font-medium sticky left-0 bg-card-surface/80 backdrop-blur-sm">
                                {category}
                              </td>
                              {months.map(m => {
                                const val = rowData[m];
                                return (
                                  <td key={m} className={`text-right p-3 font-mono text-xs ${val === 0 ? 'text-secondary-text/30' : 'text-secondary-text'}`}>
                                    {val === 0 ? '-' : formatCurrency(val)}
                                  </td>
                                );
                              })}
                              <td className={`text-right p-3 font-mono font-bold ${colors.text} ${rowData.Total === 0 ? 'opacity-50' : ''}`}>
                                {formatCurrency(rowData.Total)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grand Total */}
        <div className="mt-8 liquid-card p-6">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Annual Total Budget</span>
            <span className="text-3xl font-mono font-bold text-flux-violet">
              {formatCurrency(TARGET_ORDER.reduce((sum, t) => sum + getTargetTotal(t), 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
