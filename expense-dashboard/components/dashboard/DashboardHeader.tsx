'use client';

interface DashboardHeaderProps {
  recordCount: number;
  dateLabel: string;
}

export default function DashboardHeader({
  recordCount,
  dateLabel
}: DashboardHeaderProps) {
  return (
    <header className="mb-4 flex items-center justify-between">
      <div>
        <h1 className="text-lg font-bold text-white tracking-wide uppercase">Dashboard</h1>
        <p className="text-[10px] text-secondary-text font-mono mt-0.5">
          {recordCount} records • {dateLabel}
        </p>
      </div>
      {/* Future controls can go here */}
    </header>
  );
}
