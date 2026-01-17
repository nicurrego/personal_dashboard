'use client';

interface DashboardHeaderProps {
  recordCount: number;
  timeRangePreset: 'month' | 'year' | 'all';
  currentYear: number;
  currentMonth: number;
}

export default function DashboardHeader({ 
  recordCount, 
  timeRangePreset, 
  currentYear, 
  currentMonth 
}: DashboardHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-col gap-4">
        {/* Title Row */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide uppercase">Dashboard</h1>
            <p className="text-xs text-secondary-text font-mono">
              {recordCount} records
              {timeRangePreset === 'month' && ` • ${currentYear}/${String(currentMonth).padStart(2, '0')}`}
              {timeRangePreset === 'year' && ` • ${currentYear}`}
            </p>
          </div>
        </div>
        
        {/* Spacer for potential controls */}
        <div className="h-4" />
      </div>
    </header>
  );
}
