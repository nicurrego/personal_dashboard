'use client';

import { FilterState } from '@/lib/types';

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

  const handleMultiSelect = (field: keyof Omit<FilterState, 'dateRange'>, value: string) => {
    const current = filters[field];
    const newValues = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
      
    onChange({
      ...filters,
      [field]: newValues
    });
  };

  return (
    <div className="bg-trust-navy rounded-xl border border-neutral-800 shadow-xl p-5 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-cyber-cyan tracking-wide uppercase">Filters</h2>
        <button 
          onClick={() => onChange({
            dateRange: { start: null, end: null },
            targets: [],
            categories: [],
            locations: [],
            methods: []
          })}
          className="text-xs font-semibold text-laser-magenta hover:text-white transition-colors"
        >
          RESET ALL
        </button>
      </div>
      
      <div className="space-y-6">
        {/* Year Filter */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label>
          <select 
            className="w-full bg-neutral-900 text-white border-neutral-800 rounded-lg shadow-sm focus:ring-cyber-cyan focus:border-cyber-cyan border p-3 appearance-none"
            onChange={handleYearChange}
            defaultValue=""
          >
            <option value="">All Time</option>
            {uniqueValues.years.sort((a, b) => b - a).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Target Filter - Chips */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Target</label>
          <div className="flex flex-wrap gap-2">
            {['Living', 'Present', 'Future'].map(target => (
              <button
                key={target}
                onClick={() => handleMultiSelect('targets', target)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                  filters.targets.includes(target)
                    ? target === 'Living' ? 'bg-cyber-cyan text-black border-cyber-cyan shadow-[0_0_15px_rgba(6,182,212,0.4)]' :
                      target === 'Present' ? 'bg-alert-amber text-black border-alert-amber shadow-[0_0_15px_rgba(245,158,11,0.4)]' :
                      'bg-growth-green text-black border-growth-green shadow-[0_0_15px_rgba(34,197,94,0.4)]'
                    : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:bg-neutral-800'
                }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter - Horizontal Scroll */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Category ({filters.categories.length})</label>
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 no-scrollbar">
            {uniqueValues.categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleMultiSelect('categories', cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  filters.categories.includes(cat)
                    ? 'bg-cyber-cyan text-black border-cyber-cyan shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                    : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Location Filter - Horizontal Scroll */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
          <div className="flex overflow-x-auto gap-2 pb-2 -mx-2 px-2 no-scrollbar">
            {uniqueValues.locations.map(loc => (
              <button
                key={loc}
                onClick={() => handleMultiSelect('locations', loc)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all whitespace-nowrap ${
                  filters.locations.includes(loc)
                    ? 'bg-flux-violet text-white border-flux-violet shadow-[0_0_10px_rgba(139,92,246,0.3)]'
                    : 'bg-neutral-900 text-gray-400 border-neutral-800 hover:border-gray-600'
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
