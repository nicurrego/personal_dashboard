'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Pencil, Eye } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  importCSV,
  validateCSV,
  type ImportResult,
} from '@/lib/csv';
import { EditableExpenseTable } from '@/components/expenses';
import type { Expense } from '@/types';

type ImportStage = 'select' | 'preview' | 'review' | 'importing' | 'success' | 'error';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<ImportStage>('select');
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [editableData, setEditableData] = useState<Expense[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStage('select');

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      // First validate
      const validation = validateCSV(text);
      if (!validation.valid && !validation.hasCorrectHeaders) {
        setError('Invalid CSV format. Please check your file has the correct headers.');
        return;
      }

      // Full import to get complete results
      const result = importCSV(text);
      setImportResult(result);
      setEditableData([...result.data]);
      setStage('preview');

      if (!result.success) {
        setError(`No valid records found. ${result.errors[0]?.message || 'Check your CSV format.'}`);
      }
    };
    reader.onerror = () => {
      setError('Error reading file');
    };
    reader.readAsText(selectedFile);
  }, []);

  const handleImport = async () => {
    if (!editableData.length) return;

    setImporting(true);
    setStage('importing');
    setError(null);
    setProgress(0);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('Not authenticated. Please log in first.');
      setImporting(false);
      setStage('error');
      return;
    }

    const batchSize = 100;
    let imported = 0;
    const totalRows = editableData.length;

    try {
      for (let i = 0; i < totalRows; i += batchSize) {
        const batch = editableData.slice(i, i + batchSize).map(row => ({
          user_id: user.id,
          year: row.year,
          month: row.month,
          date: row.date,
          target: row.target,
          category: row.category,
          value: row.value,
          item: row.item || '',
          context: row.context || '',
          method: row.method || '',
          shop: row.shop || '',
          location: row.location || '',
        }));

        const { error: insertError } = await supabase
          .from('expenses')
          .insert(batch);

        if (insertError) {
          console.error('Insert error:', insertError);
          setError(`Error at row ${i + 1}: ${insertError.message}`);
          setImporting(false);
          setStage('error');
          return;
        }

        imported += batch.length;
        setProgress(Math.round((imported / totalRows) * 100));
      }

      setStage('success');
      setImporting(false);

      // Redirect after success
      setTimeout(() => {
        router.push('/dashboard');
      }, 2500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error during import');
      setStage('error');
      setImporting(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      // Simulate file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileSelect({ target: { files: dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
      }
    } else {
      setError('Please drop a CSV file');
    }
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  // Handle editing data in review mode
  const handleDataChange = (newData: Expense[]) => {
    setEditableData(newData);
  };

  // Toggle between preview and full review mode
  const toggleReviewMode = () => {
    if (stage === 'preview') {
      setStage('review');
    } else {
      setStage('preview');
    }
  };

  // ======================================
  // Render Functions
  // ======================================

  const renderFormatInfo = () => (
    <div className="liquid-card-premium p-6 hover-lift">
      <h2 className="text-xl font-semibold text-white mb-4">Expected CSV Format</h2>
      <p className="text-secondary-text text-sm mb-4">
        Your CSV file should have these columns (order matters):
      </p>
      <div className="bg-[#1B4034]/50 rounded-lg p-4 overflow-x-auto">
        <code className="text-xs text-cyber-cyan whitespace-nowrap">
          Year, Month, Date, Target, Category, Value, Item, Context, Method, Shop, Location
        </code>
      </div>

      <div className="mt-4 space-y-3">
        <div className="text-xs text-secondary-text">
          <span className="text-growth-green font-medium">✓ Supported date formats:</span>
          {' '}YYYY-MM-DD, M/D/YYYY, MM/DD/YYYY
        </div>
        <div className="text-xs text-secondary-text">
          <span className="text-growth-green font-medium">✓ Supported value formats:</span>
          {' '}1234, $1,234, ¥1234
        </div>
        <div className="text-xs text-secondary-text">
          <span className="text-growth-green font-medium">✓ Auto-conversion:</span>
          {' '}Saving/Investment → Future, Transport → Transport
        </div>
      </div>

      <p className="text-secondary-text text-xs mt-4 pt-3 border-t border-white/10">
        <span className="text-white">Example row:</span>
        <br />
        <code className="text-cyber-cyan">2024, 1, 2024-01-15, Living, Food, 1500, Lunch, Daily, Cash, Restaurant, Tokyo</code>
      </p>
    </div>
  );

  const renderFileDropzone = () => (
    <div
      className={`liquid-card p-8 border-2 border-dashed transition-all cursor-pointer
        ${file ? 'border-cyber-cyan/50' : 'border-white/20 hover:border-cyber-cyan/30'}`}
      onClick={() => fileInputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
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
            {importResult && (
              <p className="text-secondary-text text-sm">
                {editableData.length.toLocaleString()} valid transactions found
              </p>
            )}
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
  );

  const renderImportStats = () => {
    if (!importResult) return null;
    const { stats } = importResult;

    return (
      <div className="liquid-card-premium p-6 hover-lift">
        <h3 className="text-lg font-semibold text-white mb-4">Import Analysis</h3>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-growth-green/10">
            <div className="text-2xl font-bold text-growth-green">{editableData.length.toLocaleString()}</div>
            <div className="text-xs text-secondary-text">Valid Records</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="text-2xl font-bold text-white">{stats.totalRows.toLocaleString()}</div>
            <div className="text-xs text-secondary-text">Total Rows</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-secondary-text">Date format detected:</span>
            <span className="text-cyber-cyan">{stats.dateFormatUsed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-secondary-text">Value format detected:</span>
            <span className="text-cyber-cyan">{stats.valueFormatUsed}</span>
          </div>
          {stats.skippedRows > 0 && (
            <div className="flex justify-between">
              <span className="text-secondary-text">Skipped rows:</span>
              <span className="text-amber-400">{stats.skippedRows}</span>
            </div>
          )}
        </div>

        {/* Warnings & Errors toggles */}
        {(importResult.warnings.length > 0 || importResult.errors.length > 0) && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
            {importResult.warnings.length > 0 && (
              <button
                onClick={() => setShowWarnings(!showWarnings)}
                className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <span className="text-amber-400 text-sm">
                  ⚠️ {importResult.warnings.length} warning{importResult.warnings.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-secondary-text">{showWarnings ? '▲' : '▼'}</span>
              </button>
            )}

            {showWarnings && importResult.warnings.length > 0 && (
              <div className="pl-4 space-y-1 max-h-40 overflow-y-auto">
                {importResult.warnings.slice(0, 20).map((w, i) => (
                  <div key={i} className="text-xs text-amber-400/70">
                    Row {w.row}: {w.field} — {w.originalValue} → {w.correctedValue}
                  </div>
                ))}
                {importResult.warnings.length > 20 && (
                  <div className="text-xs text-secondary-text">
                    ...and {importResult.warnings.length - 20} more
                  </div>
                )}
              </div>
            )}

            {importResult.errors.length > 0 && (
              <button
                onClick={() => setShowErrors(!showErrors)}
                className="w-full text-left flex items-center justify-between p-2 rounded-lg bg-laser-magenta/10 hover:bg-laser-magenta/20 transition-colors"
              >
                <span className="text-laser-magenta text-sm">
                  ❌ {importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}
                </span>
                <span className="text-xs text-secondary-text">{showErrors ? '▲' : '▼'}</span>
              </button>
            )}

            {showErrors && importResult.errors.length > 0 && (
              <div className="pl-4 space-y-1 max-h-40 overflow-y-auto">
                {importResult.errors.slice(0, 20).map((e, i) => (
                  <div key={i} className="text-xs text-laser-magenta/70">
                    Row {e.row}: {e.message} {e.field && `(${e.field})`}
                  </div>
                ))}
                {importResult.errors.length > 20 && (
                  <div className="text-xs text-secondary-text">
                    ...and {importResult.errors.length - 20} more
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuickPreview = () => {
    if (editableData.length === 0) return null;
    const preview = editableData.slice(0, 5);

    return (
      <div className="liquid-card-premium p-6 hover-lift">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Quick Preview</h3>
          <button
            onClick={toggleReviewMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-flux-violet/20 border border-flux-violet/30 text-flux-violet text-sm font-medium hover:bg-flux-violet/30 transition-colors"
          >
            <Pencil className="w-4 h-4" />
            <span>Review & Edit All</span>
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-secondary-text text-left border-b border-white/10">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 pr-4 font-medium">Target</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium text-right">Value</th>
                <th className="py-2 pr-4 font-medium">Item</th>
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="text-white border-t border-white/5 hover:bg-white/5">
                  <td className="py-2 pr-4">{row.date}</td>
                  <td className="py-2 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs
                      ${row.target === 'Living' ? 'bg-cyan-500/20 text-cyan-400' :
                        row.target === 'Present' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-green-500/20 text-green-400'}`}>
                      {row.target}
                    </span>
                  </td>
                  <td className="py-2 pr-4">{row.category}</td>
                  <td className="py-2 pr-4 text-right font-mono">¥{row.value.toLocaleString()}</td>
                  <td className="py-2 pr-4 text-secondary-text truncate max-w-[150px]">
                    {row.item || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {editableData.length > 5 && (
          <p className="text-secondary-text text-xs mt-3 pt-3 border-t border-white/10">
            ...and {(editableData.length - 5).toLocaleString()} more rows
          </p>
        )}
      </div>
    );
  };

  const renderFullReview = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Review & Edit Data</h3>
            <p className="text-secondary-text text-sm">
              Click any row to edit • Double-click a cell for quick edit
            </p>
          </div>
          <button
            onClick={toggleReviewMode}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>Back to Summary</span>
          </button>
        </div>

        <EditableExpenseTable
          expenses={editableData}
          onChange={handleDataChange}
          editable={true}
          showDelete={true}
          pageSize={25}
          isPreviewMode={true}
        />
      </div>
    );
  };

  const renderProgress = () => (
    <div className="liquid-card-premium p-6 hover-lift">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-medium">Importing data...</span>
        <span className="text-cyber-cyan font-bold">{progress}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyber-cyan to-growth-green transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-secondary-text text-xs mt-3">
        {`${Math.round((progress / 100) * editableData.length).toLocaleString()} / ${editableData.length.toLocaleString()} records`}
      </p>
    </div>
  );

  const renderSuccess = () => (
    <div className="min-h-screen bg-[#1B4034] flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-growth-green/20 flex items-center justify-center animate-pulse">
          <svg className="w-10 h-10 text-growth-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Import Complete!</h1>
        <p className="text-secondary-text mb-4">
          {editableData.length.toLocaleString()} transactions imported successfully
        </p>
        <p className="text-sm text-secondary-text">Redirecting to dashboard...</p>

        <Link
          href="/dashboard"
          className="inline-block mt-6 px-6 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          Go to Dashboard Now →
        </Link>
      </div>
    </div>
  );

  // Success screen
  if (stage === 'success') {
    return renderSuccess();
  }

  return (
    <div className="min-h-screen bg-[#1B4034] pb-20 page-ambient">
      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold text-white text-center">Import Data</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-6 relative z-10">
        {/* Format Instructions - only show initially */}
        {(stage === 'select' || !file) && renderFormatInfo()}

        {/* File Input */}
        {renderFileDropzone()}

        {/* Content based on stage */}
        {stage === 'preview' && (
          <>
            {renderImportStats()}
            {renderQuickPreview()}
          </>
        )}

        {stage === 'review' && renderFullReview()}

        {/* Import Progress */}
        {stage === 'importing' && renderProgress()}

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-xl bg-laser-magenta/10 border border-laser-magenta/30 text-laser-magenta">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-medium">Import Error</p>
                <p className="text-sm mt-1 opacity-80">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Import Button */}
        {(stage === 'preview' || stage === 'review') && editableData.length > 0 && !importing && (
          <button
            onClick={handleImport}
            className="w-full py-4 rounded-xl font-bold text-lg
                       bg-gradient-to-r from-cyber-cyan to-growth-green text-white
                       hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] 
                       hover:scale-[1.01] active:scale-[0.99]
                       transition-all duration-200"
          >
            Import {editableData.length.toLocaleString()} Transactions
          </button>
        )}
      </main>
    </div>
  );
}
