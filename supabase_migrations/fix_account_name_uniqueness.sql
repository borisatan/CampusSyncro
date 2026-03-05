-- Fix account_name uniqueness to be per user instead of global
-- This allows different users to have accounts with the same name

-- Step 1: Drop the foreign key constraint from Transactions table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Transactions_account_name_fkey'
        AND conrelid = 'public."Transactions"'::regclass
    ) THEN
        ALTER TABLE public."Transactions" DROP CONSTRAINT "Transactions_account_name_fkey";
    END IF;
END $$;

-- Step 2: Drop the unique constraint on account_name from Accounts table
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Accounts_account_name_key'
        AND conrelid = 'public."Accounts"'::regclass
    ) THEN
        ALTER TABLE public."Accounts" DROP CONSTRAINT "Accounts_account_name_key";
    END IF;
END $$;

-- Step 3: Create a new unique constraint on (user_id, account_name)
-- This ensures account names are unique per user, not globally
ALTER TABLE public."Accounts"
ADD CONSTRAINT "Accounts_user_id_account_name_key"
UNIQUE (user_id, account_name);

-- Step 4: Recreate the foreign key constraint from Transactions to Accounts
-- Now it references the composite key (user_id, account_name)
-- WITH ON UPDATE CASCADE so account renames automatically update transactions
ALTER TABLE public."Transactions"
ADD CONSTRAINT "Transactions_account_fkey"
FOREIGN KEY (user_id, account_name)
REFERENCES public."Accounts" (user_id, account_name)
ON UPDATE CASCADE
ON DELETE RESTRICT;
