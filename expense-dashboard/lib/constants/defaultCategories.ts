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
