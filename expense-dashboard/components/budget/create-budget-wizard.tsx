'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveBudget, getBudgetForEditing, BudgetRow } from '@/_actions/budget/actions';
import BudgetSpreadsheet from './builder/budget-spreadsheet';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from './builder/constants';
import { SaveSuccessOverlay } from './builder/components';

interface ExistingBudgetRow {
  year: number;
  month: number;
  target: string;
  category: string;
  amount: number;
}

export default function CreateBudgetWizard({ headerActions }: { headerActions?: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [initialData, setInitialData] = useState<Record<string, number> | null>(null);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  // Load existing budget data on mount
  useEffect(() => {
    async function loadExistingBudget() {
      try {
        const existingBudget = await getBudgetForEditing();

        if (existingBudget && existingBudget.length > 0) {
          // Convert the budget rows to spreadsheet data format
          const spreadsheetData: Record<string, number> = {};
          const startDate = new Date();
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth() + 1; // 1-indexed

          // Map category names to category IDs
          const allCats = [...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES];
          const categoryNameToId = new Map<string, string>();
          allCats.forEach(cat => {
            categoryNameToId.set(cat.name.toLowerCase(), cat.id);
          });

          existingBudget.forEach((row: ExistingBudgetRow) => {
            // Calculate the month index relative to start date
            const monthsDiff = (row.year - startYear) * 12 + (row.month - startMonth);

            // Only include data for months within the editable range (0-11 for a 12-month budget)
            if (monthsDiff >= 0 && monthsDiff < 12) {
              // Find the category ID from the category name
              const catId = categoryNameToId.get(row.category.toLowerCase());

              if (catId) {
                const key = `${catId}-${monthsDiff}`;
                spreadsheetData[key] = row.amount;
              }
            }
          });

          setInitialData(spreadsheetData);
        }
      } catch (error) {
        console.error('Error loading existing budget:', error);
        // Continue without initial data - user can create a new budget
      } finally {
        setInitialDataLoading(false);
      }
    }

    loadExistingBudget();
  }, []);

  const handleSave = async (payload: { data: Record<string, number>, viewMode: string }) => {
    try {
      setLoading(true);
      const { data } = payload;

      const startDate = new Date();
      const rows: BudgetRow[] = [];

      const allCats = [...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES];

      // Iterate 12 months (standard budget plan)
      for (let i = 0; i < 12; i++) {
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;

        for (const cat of allCats) {
          const key = `${cat.id}-${i}`;
          const amount = data[key] || 0;

          if (amount > 0) {
            rows.push({
              year,
              month,
              target: cat.group === 'INCOME' ? 'Income' : (cat.group.charAt(0).toUpperCase() + cat.group.slice(1).toLowerCase()),
              category: cat.name,
              amount
            });
          }
        }
      }

      await saveBudget(rows);

      // Show success overlay instead of immediate redirect
      setShowSuccessOverlay(true);

    } catch (error) {
      console.error(error);
      toast.error("Failed to save plan.");
      setLoading(false);
    }
  };

  const handleSuccessComplete = useCallback(() => {
    // Redirect after animation completes
    router.push('/budget');
  }, [router]);

  // Show loading state while fetching initial data
  if (initialDataLoading) {
    return (
      <div className="min-h-screen bg-void-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading your budget...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BudgetSpreadsheet
        onSave={handleSave}
        isLoading={loading}
        headerActions={headerActions}
        initialData={initialData}
      />

      {/* Success Animation Overlay */}
      <SaveSuccessOverlay
        isVisible={showSuccessOverlay}
        message="Budget Saved!"
        onComplete={handleSuccessComplete}
      />
    </div>
  );
}
