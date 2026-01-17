'use client';

interface DashboardActionsProps {
  isVisible: boolean;
  onSave: () => void;
  onReset: () => void;
}

export default function DashboardActions({ isVisible, onSave, onReset }: DashboardActionsProps) {
  if (!isVisible) return null;

  return (
    <div className="floating-action-container">
      <button
        onClick={onSave}
        className="floating-action-btn floating-action-btn--save"
      >
        Save View
      </button>
      
      <button
        onClick={onReset}
        className="floating-action-btn floating-action-btn--reset"
      >
        Reset all
      </button>
    </div>
  );
}
