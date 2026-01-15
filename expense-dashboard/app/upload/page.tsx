'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; records?: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `Successfully uploaded and cleaned "${file.name}"`,
          records: data.records
        });
        setFile(null);
      } else {
        setResult({
          success: false,
          message: data.error || 'Upload failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Failed to upload file'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-secondary-text text-sm hover:text-white transition-colors mb-2 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold">Upload CSV</h1>
          <p className="text-secondary-text text-sm mt-2">
            Upload your expense data. It will be automatically cleaned and used as the new dataset.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`liquid-card p-12 border-2 border-dashed cursor-pointer transition-all ${
            dragOver 
              ? 'border-cyber-cyan bg-cyber-cyan/10' 
              : file 
                ? 'border-growth-green bg-growth-green/5' 
                : 'border-white/20 hover:border-white/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <div className="text-center">
            {file ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-growth-green/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-growth-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-growth-green mb-2">{file.name}</p>
                <p className="text-secondary-text text-sm">
                  {(file.size / 1024).toFixed(1)} KB • Click to change
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glass-surface flex items-center justify-center">
                  <svg className="w-8 h-8 text-secondary-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-xl font-bold mb-2">Drop your CSV here</p>
                <p className="text-secondary-text">or click to browse</p>
              </>
            )}
          </div>
        </div>

        {/* Upload Button */}
        {file && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-6 liquid-button bg-cyber-cyan text-black py-4 text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                Cleaning & Uploading...
              </span>
            ) : (
              'Upload & Clean Data'
            )}
          </button>
        )}

        {/* Result */}
        {result && (
          <div className={`mt-6 p-6 rounded-xl ${
            result.success 
              ? 'bg-growth-green/10 border border-growth-green/30' 
              : 'bg-red-500/10 border border-red-500/30'
          }`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <svg className="w-6 h-6 text-growth-green flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              <div>
                <p className={`font-bold ${result.success ? 'text-growth-green' : 'text-red-500'}`}>
                  {result.success ? 'Success!' : 'Error'}
                </p>
                <p className="text-secondary-text mt-1">{result.message}</p>
                {result.records && (
                  <p className="text-cyber-cyan font-mono mt-2">{result.records} records imported</p>
                )}
              </div>
            </div>
            
            {result.success && (
              <div className="mt-6 flex gap-3">
                <Link
                  href="/expenses"
                  className="flex-1 text-center py-3 bg-glass-surface rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  View Expenses
                </Link>
                <Link
                  href="/dashboard"
                  className="flex-1 text-center py-3 bg-flux-violet text-white rounded-lg hover:bg-opacity-80 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="mt-8 p-6 bg-glass-surface rounded-xl">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <svg className="w-5 h-5 text-cyber-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expected CSV Format
          </h3>
          <p className="text-secondary-text text-sm mb-4">
            Your CSV should have these columns (the cleaner will attempt to fix issues):
          </p>
          <code className="block bg-void-black p-4 rounded-lg text-xs font-mono text-cyber-cyan overflow-x-auto">
            Year,Month,Date,Target,Category,Value,Detail,Context,Method,Shop,Location
          </code>
        </div>
      </div>
    </div>
  );
}
