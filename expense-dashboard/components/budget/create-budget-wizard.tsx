'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createBudget } from '@/_actions/budget/actions';
import BudgetSpreadsheet from './builder/budget-spreadsheet';
import { DEFAULT_CATEGORIES, INCOME_CATEGORIES } from './builder/constants';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function CreateBudgetWizard({ headerActions }: { headerActions?: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSave = async (payload: { data: Record<string, number>, viewMode: string }) => {
    try {
      setLoading(true);
      const { data } = payload;
      
      // We need to convert the detailed monthly plan { "catId-monthIdx": val } 
      // into the standard Budget structure (Average Monthly).
      // We'll process the first 12 months (indices 0-11).
      
      const calculateAverage = (catId: string) => {
        let sum = 0;
        for (let i = 0; i < 12; i++) {
          sum += (data[`${catId}-${i}`] || 0);
        }
        return sum / 12;
      };

      // 1. Income (Map from INCOME_CATEGORIES)
      const income = INCOME_CATEGORIES.map(cat => {
        const avg = calculateAverage(cat.id);
        if (avg <= 0) return null;
        return {
          id: crypto.randomUUID(),
          name: cat.name,
          amount: avg,
          frequency: 'MONTHLY' as const,
          isVariable: false
        };
      }).filter(Boolean) as any[];

      // 2. Fixed Costs (Map from LIVING group)
      const fixedCosts = DEFAULT_CATEGORIES
        .filter(cat => cat.group === 'LIVING')
        .map(cat => {
          const avg = calculateAverage(cat.id);
          if (avg <= 0) return null;
          return {
            id: crypto.randomUUID(),
            name: cat.name,
            amount: avg,
            category: 'Living',
            isRecurring: true
          };
        }).filter(Boolean) as any[];

      // 3. Categories (Allocations - FUTURE and PRESENT groups)
      const categories = DEFAULT_CATEGORIES
        .filter(cat => cat.group === 'FUTURE' || cat.group === 'PRESENT')
        .map(cat => {
          const avg = calculateAverage(cat.id);
          // Even if 0, we might want to track it, but maybe skip for now
          return {
            id: crypto.randomUUID(),
            name: cat.name,
            allocatedAmount: avg,
            rolloverAmount: 0, // New budgets start with zero rollover
          };
        });

      // 4. Create Budget
      // Current date
      const startDate = new Date();
      // Period is MONTHLY by default for the core budget engine
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

      await createBudget({
        name: 'My Financial Plan',
        period: 'MONTHLY',
        startDate: startDate,
        endDate: oneMonthLater,
        income,
        fixedCosts,
        categories,
      });

      toast.success("Financial plan saved successfully!");
      router.push('/budget-pro');

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
