import { Expense, Budget } from '@/types';

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1;

// Helper to get past dates
const subtractMonths = (date: Date, months: number) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() - months);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
};

// Generate past 12 months
const months = Array.from({ length: 12 }, (_, i) => subtractMonths(now, i));

export const MOCK_BUDGET: Budget[] = [];
export const MOCK_EXPENSES: Expense[] = [];

months.forEach(({ year, month }) => {
    // Budget
    MOCK_BUDGET.push(
        // Income
        { year, month, target: 'Income', category: 'Main Income / Salary', amount: 330000 },
        { year, month, target: 'Income', category: 'Freelance', amount: 27000 },

        // Future
        { year, month, target: 'Future', category: '🚨 Emergency Fund', amount: 40000 },
        { year, month, target: 'Future', category: '👴 Retirement Accounts', amount: 5000 },
        { year, month, target: 'Future', category: '📈 Other Investments', amount: 30000 },
        { year, month, target: 'Future', category: '🧠 Skill-Building', amount: 10000 },

        // Living
        { year, month, target: 'Living', category: '🏠 Housing', amount: 100000 },
        { year, month, target: 'Living', category: '🔦 Utilities & Services', amount: 30000 },
        { year, month, target: 'Living', category: '🍽 Food', amount: 30000 },
        { year, month, target: 'Living', category: '🚆 Transportation', amount: 20000 },
        { year, month, target: 'Living', category: '⚕ Healthcare', amount: 15000 },
        { year, month, target: 'Living', category: '🧼 Basic Personal Care', amount: 10000 },

        // Present
        { year, month, target: 'Present', category: '🥂 Enjoyment & Social Life', amount: 8000 },
        { year, month, target: 'Present', category: '🌱 Personal Development', amount: 15000 },
        { year, month, target: 'Present', category: '✈ Travel & Experiences', amount: 2000 },
        { year, month, target: 'Present', category: '🎨 Hobbies & Leisure', amount: 2000 },
        { year, month, target: 'Present', category: '📦 Subscriptions', amount: 2000 },
        { year, month, target: 'Present', category: '🌧 “Life Happens” Fund', amount: 2000 }
    );

    // Expenses
    const p = (d: number) => `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    MOCK_EXPENSES.push(
        { year, month, date: p(5), target: 'Living', category: '🏠 Housing', value: 100000, item: 'Monthly Rent', context: 'Fixed', method: 'Bank Transfer', shop: 'Landlord', location: 'Home' },
        { year, month, date: p(10), target: 'Living', category: '🍽 Food', value: 5400, item: 'Weekly Shopping', context: 'Weekly', method: 'Credit Card', shop: 'Supermarket', location: 'Local' },
        { year, month, date: p(15), target: 'Present', category: '🥂 Enjoyment & Social Life', value: 3500, item: 'Movie Night', context: 'Fun', method: 'Credit Card', shop: 'Cinema', location: 'Mall' },
        { year, month, date: p(20), target: 'Future', category: '📈 Other Investments', value: 30000, item: 'Stock Purchase', context: 'Growth', method: 'Bank Transfer', shop: 'Broker', location: 'Online' },
        { year, month, date: p(25), target: 'Living', category: '🔦 Utilities & Services', value: 15000, item: 'Electric Bill', context: 'Utilities', method: 'Credit Card', shop: 'Power Co', location: 'Home' },
        { year, month, date: p(28), target: 'Present', category: '🎨 Hobbies & Leisure', value: 2000, item: 'New Book', context: 'Wants', method: 'Credit Card', shop: 'Bookstore', location: 'City' }
    );
});
