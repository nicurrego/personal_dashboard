-- Run this query in your Supabase SQL Editor to check for orphaned data

-- Check if there are any expenses that might be showing for your new account
SELECT 
    e.id,
    e.user_id,
    e.date,
    e.value,
    e.category,
    e.target,
    u.email
FROM expenses e
LEFT JOIN auth.users u ON e.user_id = u.id
ORDER BY e.created_at DESC
LIMIT 20;

-- Check if there are any budgets that might be showing for your new account
SELECT 
    b.id,
    b.user_id,
    b.year,
    b.month,
    b.amount,
    b.target,
    b.category,
    u.email
FROM budgets b
LEFT JOIN auth.users u ON b.user_id = u.id
ORDER BY b.created_at DESC
LIMIT 20;

-- Check for orphaned records (expenses/budgets with no matching user)
SELECT 'Orphaned Expenses' as type, COUNT(*) as count
FROM expenses e
LEFT JOIN auth.users u ON e.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned Budgets' as type, COUNT(*) as count
FROM budgets b
LEFT JOIN auth.users u ON b.user_id = u.id
WHERE u.id IS NULL;

-- Get your current user ID
SELECT id, email FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';
