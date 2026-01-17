'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ParsedRow {
  year: number;
  month: number;
  date: string;
  target: string;
  category: string;
  value: number;
  item: string;
  context: string;
  method: string;
  shop: string;
  location: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    
    const rows: ParsedRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length < 11) continue;
      
      try {
        const row: ParsedRow = {
          year: parseInt(values[0]) || new Date().getFullYear(),
          month: parseInt(values[1]) || 1,
          date: values[2] || new Date().toISOString().split('T')[0],
          target: values[3] || 'Living',
          category: values[4] || 'Other',
          value: parseFloat(values[5].replace(/,/g, '')) || 0,
          item: values[6] || '',
          context: values[7] || '',
          method: values[8] || '',
          shop: values[9] || '',
          location: values[10] || '',
        };
        
        if (row.value > 0) {
          rows.push(row);
        }
      } catch {
        // Skip invalid rows
      }
    }
    
    return rows;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setTotalRows(parsed.length);
      setPreview(parsed.slice(0, 5)); // Show first 5 rows
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setError(null);
    setProgress(0);
    
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setError('Not authenticated');
      setImporting(false);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      
      const batchSize = 100;
      let imported = 0;
      
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize).map(row => ({
          user_id: user.id,
          ...row,
        }));
        
        const { error: insertError } = await supabase
          .from('expenses')
          .insert(batch);
        
        if (insertError) {
          console.error('Insert error:', insertError);
          setError(`Error importing row ${i}: ${insertError.message}`);
          setImporting(false);
          return;
        }
        
        imported += batch.length;
        setProgress(Math.round((imported / rows.length) * 100));
      }
      
      setSuccess(true);
      setImporting(false);
      
      // Redirect to dashboard after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    };
    
    reader.readAsText(file);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-growth-green/20 flex items-center justify-center">
            <svg className="w-10 h-10 text-growth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Import Complete!</h1>
          <p className="text-secondary-text mb-4">{totalRows} transactions imported successfully</p>
          <p className="text-sm text-secondary-text">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="text-secondary-text hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <h1 className="text-lg font-semibold text-white">Import Data</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Instructions */}
        <div className="liquid-card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">CSV Format</h2>
          <p className="text-secondary-text text-sm mb-4">
            Your CSV file should have these columns in order:
          </p>
          <div className="bg-black/50 rounded-lg p-4 overflow-x-auto">
            <code className="text-xs text-cyber-cyan">
              Year, Month, Date, Target, Category, Value, Item, Context, Method, Shop, Location
            </code>
          </div>
          <p className="text-secondary-text text-xs mt-3">
            Example: 2024, 1, 2024-01-15, Living, Food, 1500, Lunch, Daily, Cash, Restaurant, Tokyo
          </p>
        </div>

        {/* File Input */}
        <div 
          className="liquid-card p-8 border-2 border-dashed border-white/20 hover:border-cyber-cyan/50 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="text-center">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyber-cyan/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-cyber-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">{file.name}</p>
                <p className="text-secondary-text text-sm">{totalRows} valid transactions found</p>
                <p className="text-cyber-cyan text-xs mt-2">Click to change file</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-secondary-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-1">Click to select CSV file</p>
                <p className="text-secondary-text text-sm">or drag and drop</p>
              </>
            )}
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="liquid-card p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Preview (first 5 rows)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-secondary-text text-left">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Category</th>
                    <th className="py-2 pr-4">Value</th>
                    <th className="py-2 pr-4">Item</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="text-white border-t border-white/10">
                      <td className="py-2 pr-4">{row.date}</td>
                      <td className="py-2 pr-4">{row.category}</td>
                      <td className="py-2 pr-4">¥{row.value.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-secondary-text">{row.item || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalRows > 5 && (
              <p className="text-secondary-text text-xs mt-3">
                ...and {totalRows - 5} more rows
              </p>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-laser-magenta/10 border border-laser-magenta/30 text-laser-magenta">
            {error}
          </div>
        )}

        {/* Import Button */}
        {file && !importing && (
          <button
            onClick={handleImport}
            className="w-full py-4 rounded-xl font-bold text-lg
                       bg-gradient-to-r from-cyber-cyan to-growth-green text-white
                       hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all"
          >
            Import {totalRows} Transactions
          </button>
        )}

        {/* Progress */}
        {importing && (
          <div className="liquid-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-medium">Importing...</span>
              <span className="text-cyber-cyan">{progress}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyber-cyan to-growth-green transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
