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
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
        <button 
          onClick={() => onChange({
            dateRange: { start: null, end: null },
            targets: [],
            categories: [],
            locations: [],
            methods: []
          })}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Reset All
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
          <select 
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2"
            onChange={handleYearChange}
            defaultValue=""
          >
            <option value="">All Time</option>
            {uniqueValues.years.sort((a, b) => b - a).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {/* Target Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target</label>
          <div className="flex flex-wrap gap-2">
            {['Living', 'Present', 'Future'].map(target => (
              <button
                key={target}
                onClick={() => handleMultiSelect('targets', target)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  filters.targets.includes(target)
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {target}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter - Dropdown for space */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select 
            multiple
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 h-32"
            value={filters.categories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              onChange({ ...filters, categories: selected });
            }}
          >
            {uniqueValues.categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <select 
            multiple
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 border p-2 h-32"
            value={filters.locations}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              onChange({ ...filters, locations: selected });
            }}
          >
            {uniqueValues.locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
