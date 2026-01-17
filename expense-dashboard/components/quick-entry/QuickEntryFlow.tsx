'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  QuickEntryData, 
  QuickEntryStep, 
  AutocompleteData 
} from '@/lib/types';
import { ProgressIndicator } from './ProgressIndicator';
import { StepCard } from './StepCard';
import { OptionChip } from './OptionChip';
import { AmountInput } from './AmountInput';
import { SuggestionInput } from './SuggestionInput';
import { DatePicker } from './DatePicker';
import { AutocompleteSelect } from './AutocompleteSelect';
import { ReviewCard } from './ReviewCard';
import { SuccessAnimation } from './SuccessAnimation';

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
  'review'
];

// Step metadata - NO emojis, just text
const STEP_CONFIG: Record<QuickEntryStep, { title: string; subtitle?: string }> = {
  amount: { title: 'How much?', subtitle: 'Enter the transaction amount' },
  target: { title: 'Target Bucket', subtitle: 'Which budget does this affect?' },
  category: { title: 'Category', subtitle: 'What type of expense?' },
  shop: { title: 'Where?', subtitle: 'Shop or vendor name' },
  method: { title: 'Payment Method', subtitle: 'How did you pay?' },
  location: { title: 'Location', subtitle: 'Area or city' },
  item: { title: 'Item', subtitle: 'What did you buy?' },
  context: { title: 'Context', subtitle: 'What was the occasion?' },
  review: { title: 'Review & Save', subtitle: 'Confirm your transaction' },
};

// Target colors for visual distinction
const TARGET_COLORS: Record<string, string> = {
  'Living': '#06b6d4',    // Cyan
  'Present': '#f59e0b',   // Amber
  'Saving': '#22c55e',    // Green
  'Investment': '#8B5CF6', // Violet
  'Future': '#22c55e',    // Green (alias)
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Get categories filtered by selected target
  const filteredCategories = useMemo(() => {
    if (!data.target) return autocompleteData.categories;
    
    const categoriesForTarget = targetCategories.get(data.target) || [];
    return autocompleteData.categories.filter(cat => 
      categoriesForTarget.includes(cat.id)
    );
  }, [data.target, targetCategories, autocompleteData.categories]);

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
      onCancel();
    }
  }, [currentStep, onCancel]);

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
    setTimeout(goNext, 150);
  }, [goNext]);

  // Handle final save
  const handleSave = async () => {
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
    const stepMap: Record<string, QuickEntryStep> = {
      amount: 'amount',
      category: 'category',
      target: 'target',
      shop: 'shop',
      method: 'method',
      location: 'location',
      item: 'item',
      context: 'context',
      date: 'amount',
    };
    goToStep(stepMap[step] || 'amount');
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
          <div className="flex flex-wrap gap-3 justify-center">
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
            autoFocus={false}
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
            autoFocus={false}
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
            autoFocus={false}
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
            autoFocus={false}
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

      case 'review':
        return (
          <ReviewCard
            data={data}
            onEdit={handleEditFromReview}
            onConfirm={handleSave}
            isSubmitting={isSubmitting}
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

  if (showSuccess) {
    return <SuccessAnimation onComplete={handleSuccessComplete} />;
  }

  const stepConfig = STEP_CONFIG[currentStep];

  return (
    <div className="min-h-screen bg-black flex flex-col pb-32">
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
          <button
            onClick={goNext}
            className="text-cyber-cyan text-sm font-medium hover:text-cyber-cyan/80 transition-colors"
          >
            Next
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* Progress */}
      <ProgressIndicator currentStep={currentStep} />

      {/* Main content */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <StepCard
          title={stepConfig.title}
          subtitle={stepConfig.subtitle}
        >
          {renderStepContent()}
        </StepCard>
      </div>

      {/* Bottom navigation */}
      {currentStep !== 'review' && (
        <div className="px-4 pb-8 pt-4 border-t border-white/10">
          <button
            onClick={goNext}
            disabled={currentStep === 'amount' && !data.value}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg
              transition-all duration-200
              ${currentStep === 'amount' && !data.value
                ? 'bg-white/10 text-secondary-text cursor-not-allowed'
                : 'bg-gradient-to-r from-cyber-cyan to-growth-green text-white active:scale-[0.98]'
              }
            `}
          >
            {currentStep === 'context' ? 'Review' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}
