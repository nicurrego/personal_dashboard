export const DEFAULT_CATEGORIES = {
  Future: [
    '🚨 Emergency Fund',
    '🧓 Retirement Accounts',
    '📈 Other Investments',
    '🔗 Debt Repayment',
    '🎯 Goals Fund',
    '🛡️ Insurance',
    '🧠 Skill-Building'
  ],
  Living: [
    '🏠 Housing',
    '🔌 Utilities & Services',
    '🍽️ Food',
    '🚆 Transportation',
    '⚕️ Healthcare',
    '🧼 Basic Personal Care'
  ],
  Present: [
    '🥂 Enjoyment & Social Life',
    '🌱 Personal Development',
    '✈️ Travel & Experiences',
    '🎨 Hobbies & Leisure',
    '📦 Subscriptions',
    '🌧️ “Life Happens” Fund'
  ]
} as const;

export type TargetType = keyof typeof DEFAULT_CATEGORIES;

export const ALL_CATEGORIES = [
  ...DEFAULT_CATEGORIES.Future.map(c => ({ target: 'Future', category: c })),
  ...DEFAULT_CATEGORIES.Living.map(c => ({ target: 'Living', category: c })),
  ...DEFAULT_CATEGORIES.Present.map(c => ({ target: 'Present', category: c }))
];

export const TARGET_ORDER = ['Income', 'Future', 'Living', 'Present'];

export const TARGET_COLORS: Record<string, { border: string; text: string; bg: string }> = {
  Income: { border: 'border-[#A9D9C7]', text: 'text-[#A9D9C7]', bg: 'bg-[#A9D9C7]' },
  Future: { border: 'border-[#614FBB]', text: 'text-[#614FBB]', bg: 'bg-[#614FBB]' },
  Living: { border: 'border-[#65A1C9]', text: 'text-[#65A1C9]', bg: 'bg-[#65A1C9]' },
  Present: { border: 'border-[#C24656]', text: 'text-[#C24656]', bg: 'bg-[#C24656]' },
};
