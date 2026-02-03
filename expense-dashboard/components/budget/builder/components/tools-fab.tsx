'use client';

import { SlidersHorizontal, Check, Lightbulb, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { triggerHaptic } from '../utils/formatters';

interface ToolsFabProps {
  isAutoComplete: boolean;
  onAutoCompleteToggleAll: (value: boolean) => void;
  isTotalFixed: boolean;
  onTotalFixedToggle: () => void;
  onTipsOpen: () => void;
  onViewModeOpen: () => void;
  bottomOffset?: number;
  /** Callback to show confirmation modal. Should return true to proceed. */
  onConfirmAction: (title: string, description: string, onConfirm: () => void) => void;
}

export function ToolsFab({
  isAutoComplete,
  onAutoCompleteToggleAll,
  isTotalFixed,
  onTotalFixedToggle,
  onTipsOpen,
  onViewModeOpen,
  bottomOffset = 0,
  onConfirmAction,
}: ToolsFabProps) {
  const handleAutoCompleteToggle = () => {
    const newValue = !isAutoComplete;
    const action = newValue ? 'enable' : 'disable';

    onConfirmAction(
      `${newValue ? 'Enable' : 'Disable'} Auto-Fill for All Rows?`,
      `This will ${action} auto-fill for ALL budget categories. When enabled, entering a value in the first month will automatically fill all future months with the same value.`,
      () => {
        onAutoCompleteToggleAll(newValue);
        triggerHaptic();
      }
    );
  };

  return (
    <div
      className="fixed z-50 pointer-events-auto transition-all duration-200 right-6"
      style={{ bottom: bottomOffset > 0 ? `${bottomOffset + 80}px` : '6rem' }}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            onClick={triggerHaptic}
            className="rounded-full w-14 h-14 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg transition-all duration-300 active:scale-95"
          >
            <SlidersHorizontal className="w-6 h-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="top" align="end" className="w-48 bg-card border-border p-2 mb-2 rounded-2xl shadow-xl">
          <div className="flex flex-col gap-1">
            <button
              onClick={handleAutoCompleteToggle}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isAutoComplete ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {isAutoComplete && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm font-medium">Auto-Fill All</span>
            </button>

            <button
              onClick={() => { onTotalFixedToggle(); triggerHaptic(); }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isTotalFixed ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                {isTotalFixed && <Check className="w-3 h-3" />}
              </div>
              <span className="text-sm font-medium">Fix Total Column</span>
            </button>

            <button
              onClick={() => { onTipsOpen(); triggerHaptic(); }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <Lightbulb className="w-4 h-4" />
              <span className="text-sm font-medium">Tips & Tricks</span>
            </button>

            <button
              onClick={() => { onViewModeOpen(); triggerHaptic(); }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors w-full text-left"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-medium">View Mode</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
