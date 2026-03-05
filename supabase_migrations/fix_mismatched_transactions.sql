-- This query helps you fix transactions that were accidentally renamed to the wrong account
-- RUN THIS BEFORE running fix_account_name_uniqueness.sql

-- Step 1: View all orphaned transactions (transactions pointing to non-existent accounts)
-- This shows you what got messed up
SELECT
    t.id,
    t.user_id,
    t.account_name,
    t.amount,
    t.description,
    t.created_at
FROM public."Transactions" t
WHERE NOT EXISTS (
    SELECT 1 FROM public."Accounts" a
    WHERE a.user_id = t.user_id AND a.account_name = t.account_name
)
ORDER BY t.created_at DESC;

-- Step 2: Get YOUR user_id (run this to find your user ID)
SELECT id as your_user_id FROM auth.users WHERE email = 'boris.atanassov1@gmail.com';

-- Step 3: Fix the transactions by updating them to the correct account name
-- Update all YOUR transactions that have 'Main Checking' to 'Revolut'
-- REPLACE 'YOUR_USER_ID_HERE' with the actual UUID from Step 2

UPDATE public."Transactions"
SET account_name = 'Revolut'
WHERE user_id = '7ff0c22b-eac7-48a8-af95-8747845d2f8f'
  AND account_name = 'Main Checking';

-- Step 4: After fixing, verify there are no more orphaned transactions:
SELECT COUNT(*) as orphaned_count
FROM public."Transactions" t
WHERE NOT EXISTS (
    SELECT 1 FROM public."Accounts" a
    WHERE a.user_id = t.user_id AND a.account_name = t.account_name
);
