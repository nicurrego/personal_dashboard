'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Expense {
  Year: number;
  Month: number;
  Date: string;
  Target: string;
  Category: string;
  Value: number;
  Detail: string;
  Context: string;
  Method: string;
  Shop: string;
  Location: string;
}

export default function ExpensesPage() {
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const pageSize = 50;

  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/expenses');
        if (!response.ok) throw new Error('Failed to load expenses');
        
        const rawData = await response.json();
        
        // Transform API data to match component state
        const parsed: Expense[] = rawData.map((e: any) => ({
          Year: Number(e.year),
          Month: Number(e.month),
          Date: e.date,
          Target: e.target,
          Category: e.category,
          Value: Number(e.value),
          Detail: e.item || '',
          Context: e.context || '',
          Method: e.method || '',
          Shop: e.shop || '',
          Location: e.location || ''
        }));
        
        setData(parsed);
        setLoading(false);
      } catch (error) {
        console.error('Error loading expenses:', error);
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter by search
  const filteredData = data.filter(row => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      row.Category?.toLowerCase().includes(searchLower) ||
      row.Shop?.toLowerCase().includes(searchLower) ||
      row.Detail?.toLowerCase().includes(searchLower) ||
      row.Location?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(page * pageSize, (page + 1) * pageSize);

  const formatCurrency = (val: number) => `¥${val?.toLocaleString() || 0}`;

  const targetColors: Record<string, string> = {
    'Living': 'text-cyber-cyan',
    'Present': 'text-alert-amber',
    'Future': 'text-growth-green',
    'Saving': 'text-growth-green',
    'Investment': 'text-flux-violet'
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-cyan"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void-black text-white p-6 pb-32">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <Link href="/" className="text-secondary-text text-sm hover:text-white transition-colors mb-2 inline-block">
              ← Back to Home
            </Link>
            <h1 className="text-3xl font-bold">Expenses Data</h1>
            <p className="text-secondary-text text-sm font-mono">{filteredData.length} records</p>
          </div>
          
          {/* Actions & Search */}
          <div className="flex items-center gap-4">
            <Link
              href="/upload"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 hover:text-cyber-cyan transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Import CSV</span>
            </Link>

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="bg-glass-surface border border-white/10 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:border-cyber-cyan"
            />
          </div>
        </div>

        {/* Table */}
        <div className="liquid-card overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-secondary-text font-medium">Date</th>
                  <th className="text-left p-3 text-secondary-text font-medium">Target</th>
                  <th className="text-left p-3 text-secondary-text font-medium">Category</th>
                  <th className="text-right p-3 text-secondary-text font-medium">Value</th>
                  <th className="text-left p-3 text-secondary-text font-medium">Shop</th>
                  <th className="text-left p-3 text-secondary-text font-medium">Location</th>
                  <th className="text-left p-3 text-secondary-text font-medium">Method</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono text-xs">{row.Date}</td>
                    <td className={`p-3 font-bold ${targetColors[row.Target] || 'text-white'}`}>{row.Target}</td>
                    <td className="p-3">{row.Category}</td>
                    <td className="p-3 text-right font-mono font-bold">{formatCurrency(row.Value)}</td>
                    <td className="p-3 text-secondary-text">{row.Shop}</td>
                    <td className="p-3 text-secondary-text">{row.Location}</td>
                    <td className="p-3 text-secondary-text text-xs">{row.Method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-secondary-text text-sm">
            Showing {page * pageSize + 1} - {Math.min((page + 1) * pageSize, filteredData.length)} of {filteredData.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg bg-glass-surface text-white disabled:opacity-30 hover:bg-neutral-800 transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-secondary-text">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 rounded-lg bg-glass-surface text-white disabled:opacity-30 hover:bg-neutral-800 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
