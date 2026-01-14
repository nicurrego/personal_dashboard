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
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-800">Recent Transactions</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shop</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {recentExpenses.map((expense, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate max-w-xs" title={expense.detail}>{expense.detail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expense.shop}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(expense.value)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${expense.target === 'Living' ? 'bg-green-100 text-green-800' : 
                      expense.target === 'Present' ? 'bg-blue-100 text-blue-800' : 
                      'bg-yellow-100 text-yellow-800'}`}>
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
