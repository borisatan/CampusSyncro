-- Fix category_name uniqueness to be per user instead of global
-- The original constraint "Categories_category_name_key" prevents different users
-- from having categories with the same name (e.g. "Housing"), which breaks bulk insert
-- during onboarding as soon as a second user signs up.

-- Step 1: Drop the foreign key on Transactions that references the global constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Transactions_category_name_fkey'
        AND conrelid = 'public."Transactions"'::regclass
    ) THEN
        ALTER TABLE public."Transactions" DROP CONSTRAINT "Transactions_category_name_fkey";
    END IF;
END $$;

-- Step 2: Drop the global unique constraint on category_name
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Categories_category_name_key'
        AND conrelid = 'public."Categories"'::regclass
    ) THEN
        ALTER TABLE public."Categories" DROP CONSTRAINT "Categories_category_name_key";
    END IF;
END $$;

-- Step 3: Create a per-user unique constraint on (user_id, category_name)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'Categories_user_id_category_name_key'
        AND conrelid = 'public."Categories"'::regclass
    ) THEN
        ALTER TABLE public."Categories"
        ADD CONSTRAINT "Categories_user_id_category_name_key"
        UNIQUE (user_id, category_name);
    END IF;
END $$;

-- Step 4: Recreate the foreign key from Transactions to Categories
-- Now references the composite key (user_id, category_name)
-- WITH ON UPDATE CASCADE so category renames automatically update transactions
ALTER TABLE public."Transactions"
ADD CONSTRAINT "Transactions_category_fkey"
FOREIGN KEY (user_id, category_name)
REFERENCES public."Categories" (user_id, category_name)
ON UPDATE CASCADE
ON DELETE RESTRICT;
