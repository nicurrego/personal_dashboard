import { getUserBudget } from "@/_actions/budget/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state"; // Might need to check if this exists or use inline

export default async function BudgetPage() {
  const budget = await getUserBudget();
  // For demo, we can force "no budget" if needed, but let's show the budget
  // const budget = null; 

  if (!budget) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center p-4">
        <div className="p-6 rounded-full bg-slate-800/50 ring-1 ring-white/10">
          <span className="text-6xl">📊</span>
        </div>
        <div className="max-w-md space-y-2">
          <h1 className="text-3xl font-bold text-white">No Active Budget</h1>
          <p className="text-slate-400">
            You haven't set up a budget yet. Create one to start tracking your financial health.
          </p>
        </div>
        <Link href="/budget-pro/builder">
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600">
            <PlusCircle className="mr-2 h-5 w-5" />
            Build My Budget
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Budget Overview</h1>
          <span className="text-sm text-muted-foreground">
            {budget.period} • {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
          </span>
        </div>
        <Link href="/budget-pro/builder">
          <Button variant="outline" className="border-white/10 hover:bg-white/5">
            <Edit className="mr-2 h-4 w-4" />
            Edit Budget
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Discretionary Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              ${Number(budget.totalDiscretionary).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">Available for categories</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
               ${Number(budget.totalIncome).toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Fixed Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
               ${Number(budget.totalFixedCosts).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle>Category Allocations</CardTitle>
          <CardDescription>How you planned your discretionary spending</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {budget.categories.map((cat: any) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{cat.name}</span>
                  <span className="text-sm text-slate-400">
                    ${cat.allocatedAmount.toLocaleString()}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800">
                  <div 
                    className="h-full rounded-full bg-purple-500" 
                    style={{ width: `${Math.min(cat.percentUsed || 0, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Spent: ${cat.spentAmount}</span>
                  <span className={cat.status === 'EXCEEDED' ? 'text-red-400' : 'text-green-400'}>
                    {Number(cat.remainingAmount) < 0 ? 'Over Budget' : 'Remaining: $' + Number(cat.remainingAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
