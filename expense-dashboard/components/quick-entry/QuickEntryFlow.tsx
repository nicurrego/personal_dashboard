'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  QuickEntryData,
  QuickEntryStep,
  AutocompleteData
} from '@/types';
import { KIBO_COLORS } from '@/lib/constants/colors';
import { ExitConfirmationModal } from '@/components/shared/ExitConfirmationModal';
import { ProgressIndicator } from './ProgressIndicator';
import { StepCard } from './StepCard';
import { OptionChip } from './OptionChip';
import { AmountInput } from './AmountInput';
import { SuggestionInput } from './SuggestionInput';
import { DatePicker } from './DatePicker';
import { AutocompleteSelect } from './AutocompleteSelect';
import { ReviewCard } from './ReviewCard';
import { SuccessAnimation } from './SuccessAnimation';
import { FeelingInput } from './FeelingInput';

// Transition delay for smooth step changes (in milliseconds)
const TRANSITION_DELAY_MS = 150;

// Step order: Target comes BEFORE category (category depends on target)
const STEP_ORDER: QuickEntryStep[] = [
  'amount',
  'target',    // Target first
  'category',  // Category second (filtered by target)
  'shop',
  'method',
  'location',
  'item',      // Text input with suggestions
  'context',   // Text input with suggestions
  'feeling',   // How did this purchase make you feel?
  'review'
];

// Step metadata - NO emojis, just text
const STEP_CONFIG: Record<QuickEntryStep, { title: string; subtitle?: string }> = {
  amount: { title: 'How much?', subtitle: 'Enter the transaction amount' },
  target: { title: 'Target', subtitle: 'Which budget does this affect?' },
  category: { title: 'Category', subtitle: 'What type of expense?' },
  shop: { title: 'Where?', subtitle: 'Shop or vendor name' },
  method: { title: 'Payment Method', subtitle: 'How did you pay?' },
  location: { title: 'Location', subtitle: 'Area or city' },
  item: { title: 'Item', subtitle: 'What did you buy?' },
  context: { title: 'Context', subtitle: 'What was the occasion?' },
  feeling: { title: 'How do you feel?', subtitle: 'About this purchase' },
  review: { title: 'Review & Save', subtitle: 'Confirm your transaction' },
};

// Target colors for visual distinction
const TARGET_COLORS: Record<string, string> = {
  'Living': KIBO_COLORS.Living,
  'Present': KIBO_COLORS.Present,
  'Saving': KIBO_COLORS.Saving,
  'Future': KIBO_COLORS.Future,
};

interface QuickEntryFlowProps {
  autocompleteData: AutocompleteData;
  targetCategories: Map<string, string[]>;
  targets: string[];
  contexts: string[];    // Context suggestions
  items: string[];       // Item suggestions (from existing data)
  onSave: (data: QuickEntryData) => Promise<void>;
  onCancel: () => void;
}

export function QuickEntryFlow({
  autocompleteData,
  targetCategories,
  targets,
  contexts,
  items,
  onSave,
  onCancel
}: QuickEntryFlowProps) {
  const [currentStep, setCurrentStep] = useState<QuickEntryStep>('amount');
  const [data, setData] = useState<QuickEntryData>({
    value: null,
    category: '',
    target: null,
    shop: '',
    method: '',
    location: '',
    item: '',
    context: '',
    date: new Date(),
    feeling: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [returnToReview, setReturnToReview] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Get categories filtered by selected target
  const filteredCategories = useMemo(() => {
    if (!data.target) return autocompleteData.categories;

    const categoriesForTarget = targetCategories.get(data.target) || [];
    return autocompleteData.categories.filter(cat =>
      categoriesForTarget.includes(cat.id)
    );
  }, [data.target, targetCategories, autocompleteData.categories]);

  // Clear returnToReview flag when we reach the review step
  useEffect(() => {
    if (currentStep === 'review') {
      setReturnToReview(false);
    }
  }, [currentStep]);

  // Prevent accidental browser navigation/close when user has progress
  useEffect(() => {
    const hasProgress = data.value !== null || data.target !== null;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasProgress && !showSuccess) {
        e.preventDefault();
        e.returnValue = ''; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data.value, data.target, showSuccess]);

  // Intercept internal navigation (Links, Bottom Nav)
  useEffect(() => {
    const hasProgress = data.value !== null || data.target !== null;

    const handleAnchorClick = (e: MouseEvent) => {
      if (!hasProgress || showSuccess) return;

      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href) {
        // Check if it's an internal link
        const isInternal = anchor.href.startsWith(window.location.origin);
        const isSelf = anchor.target === '' || anchor.target === '_self';

        if (isInternal && isSelf) {
          e.preventDefault();
          e.stopPropagation();
          setShowExitConfirm(true);
        }
      }
    };

    // Capture phase to intercept before Next.js Link handles it
    document.addEventListener('click', handleAnchorClick, true);
    return () => document.removeEventListener('click', handleAnchorClick, true);
  }, [data.value, data.target, showSuccess]);

  // Navigation functions
  const goToStep = useCallback((step: QuickEntryStep) => {
    setCurrentStep(step);
  }, []);

  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [currentStep]);

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEP_ORDER[currentIndex - 1]);
    } else {
      // Check if user has made progress (past step 1 - target)
      const hasProgress = currentIndex >= 2 || data.value !== null || data.target !== null;
      if (hasProgress) {
        setShowExitConfirm(true);
      } else {
        onCancel();
      }
    }
  }, [currentStep, data.value, data.target, onCancel]);

  const handleReturnToReview = useCallback(() => {
    setCurrentStep('review');
  }, []);

  // Data update helpers
  const updateData = useCallback(<K extends keyof QuickEntryData>(
    key: K,
    value: QuickEntryData[K]
  ) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle target change - reset category when target changes
  const handleTargetChange = useCallback((target: string) => {
    setData(prev => ({
      ...prev,
      target: target as QuickEntryData['target'],
      category: ''
    }));
    setTimeout(goNext, TRANSITION_DELAY_MS);
  }, [goNext]);

  // Handle final save
  const handleSave = async () => {
    if (!data.value || !data.category || !data.target) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave(data);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit from review
  const handleEditFromReview = (step: string) => {
    setReturnToReview(true);
    const stepMap: Record<string, QuickEntryStep> = {
      amount: 'amount',
      category: 'category',
      target: 'target',
      shop: 'shop',
      method: 'method',
      location: 'location',
      item: 'item',
      context: 'context',
      feeling: 'feeling',
      date: 'amount',
    };
    goToStep(stepMap[step] || 'amount');
  };

  const [showSearch, setShowSearch] = useState(false);

  // Reset search visibility when step changes
  useEffect(() => {
    setShowSearch(false);
  }, [currentStep]);

  // Steps that allow searching
  const searchableSteps = ['category', 'shop', 'method', 'location'];

  const handleToggleSearch = () => {
    setShowSearch(prev => !prev);
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'amount':
        return (
          <>
            <AmountInput
              value={data.value}
              onChange={(v) => updateData('value', v)}
              onSubmit={goNext}
            />
            <div className="mt-6">
              <DatePicker
                value={data.date}
                onChange={(d) => updateData('date', d)}
              />
            </div>
          </>
        );

      case 'target':
        return (
          <div className="flex flex-col h-full justify-end">
            <div className="flex flex-wrap gap-3 justify-center pb-8">
              {targets.map((target) => (
                <OptionChip
                  key={target}
                  label={target}
                  selected={data.target === target}
                  onClick={() => handleTargetChange(target)}
                  variant="target"
                  color={TARGET_COLORS[target]}
                />
              ))}
            </div>
          </div>
        );

      case 'category':
        return (
          <AutocompleteSelect
            options={filteredCategories}
            value={data.category}
            onChange={(v) => updateData('category', v)}
            onSubmit={goNext}
            placeholder="Search categories..."
            allowCustom={true}
            autoFocus={true} // Focus when search opens
            showSearch={showSearch}
            onSearchClose={() => setShowSearch(false)}
          />
        );

      case 'shop':
        return (
          <AutocompleteSelect
            options={autocompleteData.shops}
            value={data.shop}
            onChange={(v) => updateData('shop', v)}
            onSubmit={goNext}
            placeholder="Search shops..."
            allowCustom={true}
            autoFocus={true}
            showSearch={showSearch}
            onSearchClose={() => setShowSearch(false)}
          />
        );

      case 'method':
        return (
          <AutocompleteSelect
            options={autocompleteData.methods}
            value={data.method}
            onChange={(v) => updateData('method', v)}
            onSubmit={goNext}
            placeholder="Payment method..."
            allowCustom={true}
            autoFocus={true}
            showSearch={showSearch}
            onSearchClose={() => setShowSearch(false)}
          />
        );

      case 'location':
        return (
          <AutocompleteSelect
            options={autocompleteData.locations}
            value={data.location}
            onChange={(v) => updateData('location', v)}
            onSubmit={goNext}
            placeholder="Location..."
            allowCustom={true}
            autoFocus={true}
            showSearch={showSearch}
            onSearchClose={() => setShowSearch(false)}
          />
        );

      case 'item':
        // Item - text input with insert-able suggestions
        return (
          <SuggestionInput
            value={data.item}
            onChange={(v) => updateData('item', v)}
            onSubmit={goNext}
            suggestions={items}
            placeholder="What did you buy?"
            hint="Describe what you purchased"
          />
        );

      case 'context':
        // Context - text input with insert-able suggestions
        return (
          <SuggestionInput
            value={data.context}
            onChange={(v) => updateData('context', v)}
            onSubmit={goNext}
            suggestions={contexts}
            placeholder="e.g. Daily lunch, Weekend trip..."
            hint="What was the occasion?"
          />
        );

      case 'feeling':
        return (
          <FeelingInput
            value={data.feeling}
            onChange={(v) => updateData('feeling', v)}
            onSubmit={goNext}
          />
        );

      case 'review':
        const missingFields = (!data.value || !data.category || !data.target)
          ? 'Amount, Category, and Target are required'
          : null;

        return (
          <ReviewCard
            data={data}
            onEdit={handleEditFromReview}
            onConfirm={handleSave}
            isSubmitting={isSubmitting}
            error={missingFields}
          />
        );

      default:
        return null;
    }
  };

  // Success animation complete handler
  const handleSuccessComplete = () => {
    setShowSuccess(false);
    onCancel();
  };

  // Exit confirmation handlers
  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onCancel();
  };

  const handleCancelExit = () => {
    setShowExitConfirm(false);
  };

  if (showSuccess) {
    return <SuccessAnimation onComplete={handleSuccessComplete} />;
  }

  const stepConfig = STEP_CONFIG[currentStep];

  return (
    <div className="h-screen max-h-screen bg-[#1B4034] flex flex-col overflow-hidden page-ambient">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-secondary-text hover:text-white transition-colors"
        >
          <span className="text-lg">←</span>
          <span className="text-sm">
            {currentStep === 'amount' ? 'Cancel' : 'Back'}
          </span>
        </button>

        <h1 className="text-sm font-medium text-white">Quick Entry</h1>

        {currentStep !== 'review' ? (
          <div className="flex items-center gap-4">
            {returnToReview && (
              <button
                onClick={handleReturnToReview}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                Review
              </button>
            )}
            <button
              onClick={goNext}
              className="text-cyber-cyan text-sm font-medium hover:text-cyber-cyan/80 transition-colors"
            >
              Next
            </button>
          </div>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Progress */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Main content */}
      <div className="flex-1 px-4 pt-4 pb-28 overflow-hidden flex flex-col">
        <StepCard
          title={stepConfig.title}
          subtitle={stepConfig.subtitle}
          headerRight={
            searchableSteps.includes(currentStep) ? (
              <button
                onClick={handleToggleSearch}
                className={`p-2 rounded-full transition-all duration-200 ${showSearch ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            ) : currentStep === 'review' ? (
              <button
                onClick={handleSave}
                disabled={isSubmitting || !(data.value && data.category && data.target)}
                className={`
                  px-4 py-1.5 rounded-full font-bold text-sm
                  transition-all duration-200
                  ${isSubmitting || !(data.value && data.category && data.target)
                    ? 'bg-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-[#A9D9C7] text-[#1B4034] hover:bg-[#A9D9C7]/90 active:scale-[0.98]'
                  }
                `}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </button>
            ) : undefined
          }
        >
          {renderStepContent()}
        </StepCard>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmationModal
        isOpen={showExitConfirm}
        onCancel={handleCancelExit}
        onConfirm={handleConfirmExit}
        title="Leave Quick Entry?"
        message="You have unsaved changes. Are you sure you want to leave? Your progress will be lost."
        cancelText="Stay"
        confirmText="Leave"
      />

    </div>
  );
}
