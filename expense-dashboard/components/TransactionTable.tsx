'use client';

import { Expense } from '@/types';
import { formatCurrency } from '@/lib/formatters';

interface TransactionTableProps {
  expenses: Expense[];
}

export default function TransactionTable({ expenses }: TransactionTableProps) {
  // Show only last 50 transactions for performance
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  return (
    <div className="liquid-card overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-black/20">
        <h2 className="text-label text-secondary-text">Recent Transactions</h2>
        <span className="text-xs font-mono text-cobalt-blue">{expenses.length} TOTAL</span>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden">
        {recentExpenses.map((expense, idx) => (
          <div key={idx} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-mono text-secondary-text block mb-1">{expense.date}</span>
                <span className="text-sm font-bold text-cobalt-blue block">{expense.category}</span>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-white font-mono">{formatCurrency(expense.value)}</span>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                    expense.target === 'Living' ? 'bg-cobalt-blue/10 text-cobalt-blue border-cobalt-blue/20' : 
                    expense.target === 'Present' ? 'bg-electric-orange/10 text-electric-orange border-electric-orange/20' : 
                    'bg-acid-green/10 text-acid-green border-acid-green/20'}`}>
                  {expense.target}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-secondary-text">
              <span className="truncate max-w-[60%]">{expense.item}</span>
              <span className="font-medium">{expense.shop}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-white/5">
          <thead className="bg-black/20">
            <tr>
              <th className="px-6 py-3 text-left text-label text-secondary-text">Date</th>
              <th className="px-6 py-3 text-left text-label text-secondary-text">Category</th>
              <th className="px-6 py-3 text-left text-label text-secondary-text">Detail</th>
              <th className="px-6 py-3 text-left text-label text-secondary-text">Shop</th>
              <th className="px-6 py-3 text-right text-label text-secondary-text">Value</th>
              <th className="px-6 py-3 text-left text-label text-secondary-text">Target</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {recentExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text font-mono">{expense.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-cobalt-blue font-medium">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">{expense.item}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-text">{expense.shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono tracking-wide">{formatCurrency(expense.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded-sm border ${
                    expense.target === 'Living' ? 'bg-cobalt-blue/10 text-cobalt-blue border-cobalt-blue/30' : 
                    expense.target === 'Present' ? 'bg-electric-orange/10 text-electric-orange border-electric-orange/30' : 
                    'bg-acid-green/10 text-acid-green border-acid-green/30'}`}>
                    {expense.target}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
