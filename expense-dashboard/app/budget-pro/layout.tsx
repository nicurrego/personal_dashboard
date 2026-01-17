'use client';
import { HeaderProvider } from "@/components/header-context";

export default function BudgetLayout({ children }: { children: React.ReactNode }) {
  return (
    <HeaderProvider>
      <div className="min-h-screen bg-black text-white p-6 pb-32">
        {children}
      </div>
    </HeaderProvider>
  );
}
