import CreateBudgetWizard from "@/components/budget/create-budget-wizard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import PageTitle from "@/components/page-title";

export default function BudgetBuilderPage() {
  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <PageTitle title="Budget Builder" />

      <CreateBudgetWizard 
        headerActions={
          <Link href="/budget-pro">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
               <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
        }
      />
    </div>
  );
}
