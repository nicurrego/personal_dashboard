'use client';

import { FilterState } from '@/types';

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  uniqueValues: {
    years: number[];
    targets: string[];
    categories: string[];
    locations: string[];
    methods: string[];
  };
}

export default function FilterPanel({ filters, onChange, uniqueValues }: FilterPanelProps) {

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value);
    // Simple year filtering logic for now - sets start/end date to Jan 1 - Dec 31 of selected year
    if (isNaN(year)) {
      onChange({
        ...filters,
        dateRange: { start: null, end: null }
      });
    } else {
      onChange({
        ...filters,
        dateRange: {
          start: new Date(year, 0, 1),
          end: new Date(year, 11, 31, 23, 59, 59)
        }
      });
    }
  };

  const handleMultiSelect = (field: keyof Omit<FilterState, 'dateRange' | 'months'>, value: string) => {
    const current = filters[field] as string[];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];

    onChange({
      ...filters,
      [field]: newValues
    });
  };

  const toggleMonth = (month: number) => {
    const current = filters.months || [];
    const newMonths = current.includes(month)
      ? current.filter(m => m !== month)
      : [...current, month];
    onChange({ ...filters, months: newMonths });
  };

  const applyQuarter = (quarter: number) => {
    // Q1: 1,2,3 - Q2: 4,5,6 etc.
    const start = (quarter - 1) * 3 + 1;
    const qMonths = [start, start + 1, start + 2];
    onChange({ ...filters, months: qMonths });
  };

  const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  return (
    <div className="liquid-card p-6 mb-8 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-label text-secondary-text">Data Filters</h2>
        <button
          onClick={() => onChange({
            dateRange: { start: null, end: null },
            months: [],
            targets: [],
            categories: [],
            locations: [],
            methods: [],
            shops: []
          })}
          className="text-xs font-bold text-[#CC8257] hover:text-white uppercase tracking-wider transition-colors"
        >
          Reset All
        </button>
      </div>

      <div className="space-y-6">
        {/* Year Filter */}
        <div>
          <label className="block text-label mb-3">Year</label>
          <select
            className="w-full bg-glass-surface text-white border border-white/10 rounded-xl shadow-inner focus:ring-cobalt-blue focus:border-cobalt-blue p-3 appearance-none font-mono"
            onChange={handleYearChange}
          >
            <option value="">ALL TIME</option>
            {uniqueValues.years.sort((a, b) => b - a).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Month Filter */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-label">Months</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(q => (
                <button
                  key={q}
                  onClick={() => applyQuarter(q)}
                  className="text-[10px] font-bold text-secondary-text hover:text-white bg-white/5 px-2 py-1 rounded"
                >
                  Q{q}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {MONTHS.map((m, idx) => {
              const monthNum = idx + 1;
              const isSelected = (filters.months || []).includes(monthNum);
              return (
                <button
                  key={m}
                  onClick={() => toggleMonth(monthNum)}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${isSelected
                    ? 'bg-white text-black shadow-lg shadow-white/20'
                    : 'bg-glass-surface text-secondary-text hover:bg-white/10'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Filter - Chips */}
        <div>
          <label className="block text-label mb-3">Target</label>
          <div className="flex flex-wrap gap-3">
            {['Living', 'Present', 'Future'].map(target => (
              <button
                key={target}
                onClick={() => handleMultiSelect('targets', target)}
                className={`liquid-button px-5 py-2 text-sm ${filters.targets.includes(target)
                  ? target === 'Living' ? 'bg-[#487363] text-white' : // cat-sage
                    target === 'Present' ? 'bg-[#A9D9C7] text-black' : // cat-pale
                      'bg-[#8DF2CD] text-black' // cat-mint
                  : 'bg-card border border-white/5 hover:bg-white/5 text-muted-foreground'
                  }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter - Horizontal Scroll */}
        <div>
          <label className="block text-label mb-3">Category ({filters.categories.length})</label>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 no-scrollbar">
            {uniqueValues.categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleMultiSelect('categories', cat)}
                className={`liquid-button px-5 py-2 text-sm flex-shrink-0 whitespace-nowrap ${filters.categories.includes(cat)
                  ? 'bg-[#6CA1B7] text-white' // kibo-blue
                  : 'bg-card text-muted-foreground border border-white/5 hover:bg-white/5'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter - Horizontal Scroll */}
        <div>
          <label className="block text-label mb-3">Location</label>
          <div className="flex overflow-x-auto gap-3 pb-2 -mx-2 px-2 no-scrollbar">
            {uniqueValues.locations.map(loc => (
              <button
                key={loc}
                onClick={() => handleMultiSelect('locations', loc)}
                className={`liquid-button px-5 py-2 text-sm flex-shrink-0 whitespace-nowrap ${filters.locations.includes(loc)
                  ? 'bg-white text-black'
                  : 'bg-card text-muted-foreground border border-white/5 hover:bg-white/5'
                  }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
