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
    color: 'text-white', 
    bgColor: 'bg-flux-violet/10',
    hex: CATEGORY_COLORS.INCOME,
  },
  FUTURE: { 
    label: 'Future', 
    color: 'text-growth-green', 
    bgColor: 'bg-growth-green/10',
    hex: CATEGORY_COLORS.FUTURE,
  },
  LIVING: { 
    label: 'Living', 
    color: 'text-cyber-cyan', 
    bgColor: 'bg-cyber-cyan/10',
    hex: CATEGORY_COLORS.LIVING,
  },
  PRESENT: { 
    label: 'Present', 
    color: 'text-alert-amber', 
    bgColor: 'bg-alert-amber/10',
    hex: CATEGORY_COLORS.PRESENT,
  },
};

export const DEFAULT_CATEGORIES: BudgetCategoryDef[] = [
  // FUTURE (Green)
  { id: 'emergency', name: 'Emergency Fund', group: 'FUTURE', word: 'Safety', emoji: '🚨💰🏦' },
  { id: 'retirement', name: 'Retirement Accounts', group: 'FUTURE', word: 'Future', emoji: '👴⏳📈' },
  { id: 'investments', name: 'Other Investments', group: 'FUTURE', word: 'Growth', emoji: '🪴📊🚀' },
  { id: 'debt', name: 'Debt Repayment', group: 'FUTURE', word: 'Freedom', emoji: '⛓️✂️🎉' },
  { id: 'goals', name: 'Goals Fund', group: 'FUTURE', word: 'Target', emoji: '🎯⛰️🏆' },
  { id: 'insurance', name: 'Insurance', group: 'FUTURE', word: 'Protection', emoji: '🛡️📑☂️' },
  { id: 'skills', name: 'Skill-Building', group: 'FUTURE', word: 'Mastery', emoji: '🧠🛠️💎' },

  // LIVING (Blue)
  { id: 'housing', name: 'Housing', group: 'LIVING', word: 'Shelter', emoji: '🏠🔑🕯️' },
  { id: 'utilities', name: 'Utilities & Services', group: 'LIVING', word: 'Basics', emoji: '⚡🚰🌐' },
  { id: 'food', name: 'Food', group: 'LIVING', word: 'Fuel', emoji: '🛒🍎🍱' },
  { id: 'transport', name: 'Transportation', group: 'LIVING', word: 'Transit', emoji: '🚗⛽🚇' },
  { id: 'health', name: 'Healthcare', group: 'LIVING', word: 'Wellness', emoji: '🩺💊🩹' },
  { id: 'personal_care', name: 'Basic Personal Care', group: 'LIVING', word: 'Hygiene', emoji: '🧼🪒🧴' },

  // PRESENT (Red)
  { id: 'enjoyment', name: 'Enjoyment & Social Life', group: 'PRESENT', word: 'Fun', emoji: '🥂🍕🎊' },
  { id: 'development', name: 'Personal Development', group: 'PRESENT', word: 'Evolution', emoji: '📖🌱🧘' },
  { id: 'travel', name: 'Travel & Experiences', group: 'PRESENT', word: 'Adventure', emoji: '✈️🗺️📸' },
  { id: 'hobbies', name: 'Hobbies & Leisure', group: 'PRESENT', word: 'Play', emoji: '🎨🎸🕹️' },
  { id: 'subscriptions', name: 'Subscriptions', group: 'PRESENT', word: 'Access', emoji: '🔄📱🍿' },
  { id: 'life_happens', name: '"Life Happens" Fund', group: 'PRESENT', word: 'Buffer', emoji: '🩹🌊🧘' },
];

export const INCOME_CATEGORIES: BudgetCategoryDef[] = [
  { id: 'salary', name: 'Main Income / Salary', group: 'INCOME', word: 'Salary', emoji: '💸💼👔' },
  { id: 'freelance', name: 'Freelance / Side Gig', group: 'INCOME', word: 'Hustle', emoji: '💻⚡🔋' },
  { id: 'extra', name: 'Extra / Bonus', group: 'INCOME', word: 'Bonus', emoji: '🎁✨💰' },
];
