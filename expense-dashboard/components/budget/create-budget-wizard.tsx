'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { saveBudget, BudgetRow } from '@/_actions/budget/actions';
import BudgetSpreadsheet from './builder/budget-spreadsheet';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from './builder/constants';

export default function CreateBudgetWizard({ headerActions }: { headerActions?: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (payload: { data: Record<string, number>, viewMode: string }) => {
    try {
      setLoading(true);
      const { data } = payload;
      
      const startDate = new Date();
      const rows: BudgetRow[] = [];

      const allCats = [...DEFAULT_CATEGORIES, ...INCOME_CATEGORIES];

      // Iterate 12 months (standard budget plan)
      // We assume the user builds a 12-month plan starting from now (or current month).
      // The BudgetSpreadsheet uses the same startDate = new Date().
      
      for (let i = 0; i < 12; i++) {
        // Calculate Year/Month for this index
        const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-indexed for DB

        for (const cat of allCats) {
          const key = `${cat.id}-${i}`;
          const amount = data[key] || 0;

          if (amount > 0) {
            rows.push({
              year,
              month,
              target: cat.group === 'INCOME' ? 'Income' : (cat.group.charAt(0).toUpperCase() + cat.group.slice(1).toLowerCase()), // Future, Living, Present
              category: cat.name,
              amount
            });
          }
        }
      }

      await saveBudget(rows);

      toast.success("Financial plan saved successfully!");
      // Redirect to the merged budget page
      router.push('/budget');

    } catch (error) {
      console.error(error);
      toast.error("Failed to save plan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <BudgetSpreadsheet onSave={handleSave} isLoading={loading} headerActions={headerActions} />
    </div>
  );
}

