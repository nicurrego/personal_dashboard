'use server';

export async function getUserBudget() {
  // Mock data for display purposes
  return {
    id: 'mock-budget-id',
    period: 'Monthly',
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    totalDiscretionary: 1500000,
    totalIncome: 5000000,
    totalFixedCosts: 3500000,
    categories: [
      { id: '1', name: 'Groceries', allocatedAmount: 500000, spentAmount: 120000, remainingAmount: 380000, percentUsed: 24, status: 'OK' },
      { id: '2', name: 'Entertainment', allocatedAmount: 200000, spentAmount: 50000, remainingAmount: 150000, percentUsed: 25, status: 'OK' },
      { id: '3', name: 'Dining Out', allocatedAmount: 300000, spentAmount: 320000, remainingAmount: -20000, percentUsed: 106, status: 'EXCEEDED' },
      { id: '4', name: 'Transport', allocatedAmount: 150000, spentAmount: 40000, remainingAmount: 110000, percentUsed: 26, status: 'OK' }
    ]
  };
}

export async function createBudget(data: any) {
  console.log('Creating budget:', data);
  // In a real app, this would save to DB. 
  // For now, we just return success.
  return { success: true };
}
