'use client';

import { Expense } from '@/lib/types';
import { formatCurrency } from '@/lib/d3-utils';

interface TransactionTableProps {
  expenses: Expense[];
}

export default function TransactionTable({ expenses }: TransactionTableProps) {
  // Show only last 50 transactions for performance
  const recentExpenses = expenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  return (
    <div className="bg-trust-navy rounded-xl border border-neutral-800 overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
        <h2 className="text-lg font-bold text-white tracking-wide uppercase">Recent Transactions</h2>
        <span className="text-xs text-cyber-cyan font-mono">{expenses.length} TOTAL</span>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden">
        {recentExpenses.map((expense, idx) => (
          <div key={idx} className="p-4 border-b border-neutral-800 last:border-0 hover:bg-neutral-900/50 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-xs font-bold text-gray-500 block mb-1">{expense.date}</span>
                <span className="text-sm font-bold text-cyber-cyan block">{expense.category}</span>
              </div>
              <div className="text-right">
                <span className="block text-lg font-bold text-white font-mono">{formatCurrency(expense.value)}</span>
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm border ${
                    expense.target === 'Living' ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/20' : 
                    expense.target === 'Present' ? 'bg-alert-amber/10 text-alert-amber border-alert-amber/20' : 
                    'bg-growth-green/10 text-growth-green border-growth-green/20'}`}>
                  {expense.target}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span className="truncate max-w-[60%]">{expense.detail}</span>
              <span className="font-medium text-gray-500">{expense.shop}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-800">
          <thead className="bg-neutral-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Detail</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Target</th>
            </tr>
          </thead>
          <tbody className="bg-trust-navy divide-y divide-neutral-800">
            {recentExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-neutral-900/50 transition-colors group">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{expense.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-cyber-cyan font-medium">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 truncate max-w-xs">{expense.detail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right font-mono tracking-wide">{formatCurrency(expense.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-4 font-bold uppercase tracking-wider rounded-sm border ${
                    expense.target === 'Living' ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30' : 
                    expense.target === 'Present' ? 'bg-alert-amber/10 text-alert-amber border-alert-amber/30' : 
                    'bg-growth-green/10 text-growth-green border-growth-green/30'}`}>
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
