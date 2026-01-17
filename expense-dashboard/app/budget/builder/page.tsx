import CreateBudgetWizard from "@/components/budget/create-budget-wizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageTitle from "@/components/page-title";

export default function BudgetBuilderPage() {
  return (
    <div className="min-h-screen bg-void-black text-white overflow-x-hidden">
      <div className="max-w-[1600px] mx-auto">
        <CreateBudgetWizard 
          headerActions={
            <Link href="/budget">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                 <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </Link>
          }
        />
      </div>
    </div>
  );
}
