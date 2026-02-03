import { CATEGORY_COLORS } from '@/lib/category-colors';

export type BudgetGroupType = 'INCOME' | 'FUTURE' | 'LIVING' | 'PRESENT';

export interface BudgetCategoryDef {
  id: string;
  name: string; // This is now the tooltip/full name
  group: BudgetGroupType;
  word: string; // Short display name
  emoji: string; // Emoji code
  description?: string;
  defaultAmount?: number;
}

export const BUDGET_GROUPS: Record<BudgetGroupType, {
  label: string;
  color: string;
  bgColor: string;
  hex: string;  // Hex color for charts and inline styles
}> = {
  INCOME: {
    label: 'Income',
    color: 'text-[var(--color-total)]',
    bgColor: 'bg-[var(--color-total)]/10',
    hex: CATEGORY_COLORS.INCOME,
  },
  FUTURE: {
    label: 'Future',
    color: 'text-[var(--color-future)]',
    bgColor: 'bg-[var(--color-future)]/10',
    hex: CATEGORY_COLORS.FUTURE,
  },
  LIVING: {
    label: 'Living',
    color: 'text-[var(--color-living)]',
    bgColor: 'bg-[var(--color-living)]/10',
    hex: CATEGORY_COLORS.LIVING,
  },
  PRESENT: {
    label: 'Present',
    color: 'text-[var(--color-present)]',
    bgColor: 'bg-[var(--color-present)]/10',
    hex: CATEGORY_COLORS.PRESENT,
  },
};

export const DEFAULT_CATEGORIES: BudgetCategoryDef[] = [
  // FUTURE (Green)
  { id: 'emergency', name: '🚨 Emergency Fund', group: 'FUTURE', word: 'Emergency Fund', emoji: '🚨' },
  { id: 'retirement', name: '🧓 Retirement Accounts', group: 'FUTURE', word: 'Retirement', emoji: '🧓' },
  { id: 'investments', name: '📈 Other Investments', group: 'FUTURE', word: 'Investments', emoji: '📈' },
  { id: 'debt', name: '🔗 Debt Repayment', group: 'FUTURE', word: 'Debt Repayment', emoji: '🔗' },
  { id: 'goals', name: '🎯 Goals Fund', group: 'FUTURE', word: 'Goals', emoji: '🎯' },
  { id: 'insurance', name: '🛡️ Insurance', group: 'FUTURE', word: 'Insurance', emoji: '🛡️' },
  { id: 'skills', name: '🧠 Skill-Building', group: 'FUTURE', word: 'Skills', emoji: '🧠' },

  // LIVING (Blue)
  { id: 'housing', name: '🏠 Housing', group: 'LIVING', word: 'Housing', emoji: '🏠' },
  { id: 'utilities', name: '🔌 Utilities & Services', group: 'LIVING', word: 'Utilities', emoji: '🔌' },
  { id: 'food', name: '🍽️ Food', group: 'LIVING', word: 'Food', emoji: '🍽️' },
  { id: 'transport', name: '🚆 Transportation', group: 'LIVING', word: 'Transportation', emoji: '🚆' },
  { id: 'health', name: '⚕️ Healthcare', group: 'LIVING', word: 'Healthcare', emoji: '⚕️' },
  { id: 'personal_care', name: '🧼 Basic Personal Care', group: 'LIVING', word: 'Personal Care', emoji: '🧼' },

  // PRESENT (Red)
  { id: 'enjoyment', name: '🥂 Enjoyment & Social Life', group: 'PRESENT', word: 'Social Life', emoji: '🥂' },
  { id: 'development', name: '🌱 Personal Development', group: 'PRESENT', word: 'Development', emoji: '🌱' },
  { id: 'travel', name: '✈️ Travel & Experiences', group: 'PRESENT', word: 'Travel', emoji: '✈️' },
  { id: 'hobbies', name: '🎨 Hobbies & Leisure', group: 'PRESENT', word: 'Hobbies', emoji: '🎨' },
  { id: 'subscriptions', name: '📦 Subscriptions', group: 'PRESENT', word: 'Subscriptions', emoji: '📦' },
  { id: 'life_happens', name: '🌧️ “Life Happens” Fund', group: 'PRESENT', word: 'Life Fund', emoji: '🌧️' },
];

export const INCOME_CATEGORIES: BudgetCategoryDef[] = [
  { id: 'salary', name: 'Main Income / Salary', group: 'INCOME', word: 'Main Income', emoji: '💸' },
  { id: 'freelance', name: 'Freelance / Side Gig', group: 'INCOME', word: 'Freelance', emoji: '💻' },
  { id: 'extra', name: 'Extra / Bonus', group: 'INCOME', word: 'Extra', emoji: '🎁' },
];
