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
    <div className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden shadow">
      <div className="px-6 py-4 border-b border-neutral-800">
        <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-800">
          <thead className="bg-neutral-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Detail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Target</th>
            </tr>
          </thead>
          <tbody className="bg-neutral-900 divide-y divide-neutral-800">
            {recentExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-neutral-800 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{expense.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 truncate max-w-xs" title={expense.detail}>{expense.detail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{expense.shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white text-right">{formatCurrency(expense.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${expense.target === 'Living' ? 'bg-green-900/30 text-green-400 border border-green-800' : 
                      expense.target === 'Present' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' : 
                      'bg-yellow-900/30 text-yellow-500 border border-yellow-800'}`}>
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
