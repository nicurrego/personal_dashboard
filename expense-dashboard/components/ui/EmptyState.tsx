'use client';

interface EmptyStateProps {
  title?: string;
  message?: string;
  onReset?: () => void;
}

/**
 * Empty State Component
 * Displays when no data matches the current filters
 */
export default function EmptyState({ 
  title = "No Data Found",
  message = "No expenses match your current filters. Try adjusting your filter settings or reset to view all data.",
  onReset
}: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md px-6">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-flux-violet/20 to-cyber-cyan/20 flex items-center justify-center">
              <svg 
                className="w-12 h-12 text-secondary-text" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-alert-amber rounded-full flex items-center justify-center">
              <span className="text-black text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
        
        {/* Message */}
        <p className="text-secondary-text text-sm leading-relaxed mb-6">
          {message}
        </p>

        {/* Action Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="liquid-button px-6 py-3 rounded-xl font-semibold text-sm uppercase tracking-wider transition-all duration-300"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06b6d4 100%)',
              color: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
