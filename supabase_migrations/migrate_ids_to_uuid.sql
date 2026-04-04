-- Migration: Change Accounts.id and Transactions.id from INT to UUID
-- Uses DO blocks to look up actual constraint names dynamically.

-- ============================================================
-- PHASE 1: Transactions.id  (no FK dependents — straightforward)
-- ============================================================

ALTER TABLE public."Transactions"
  ADD COLUMN new_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Drop the PK constraint by looking up its real name
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name   = 'Transactions'
    AND constraint_type = 'PRIMARY KEY';

  EXECUTE format('ALTER TABLE public."Transactions" DROP CONSTRAINT %I', v_constraint);
END $$;

ALTER TABLE public."Transactions" ADD PRIMARY KEY (new_id);
ALTER TABLE public."Transactions" DROP COLUMN id;
ALTER TABLE public."Transactions" RENAME COLUMN new_id TO id;


-- ============================================================
-- PHASE 2: Accounts.id  (Goals and GoalContributions depend on it)
-- ============================================================

-- Step 1: Drop FK constraints on dependent tables (IF EXISTS is safe here)
DO $$
DECLARE
  v_constraint text;
BEGIN
  -- Goals → Accounts FK
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name   = 'Goals'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name ILIKE '%account%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public."Goals" DROP CONSTRAINT %I', v_constraint);
  END IF;

  -- GoalContributions → Accounts FK
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name   = 'GoalContributions'
    AND constraint_type = 'FOREIGN KEY'
    AND constraint_name ILIKE '%account%';

  IF v_constraint IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public."GoalContributions" DROP CONSTRAINT %I', v_constraint);
  END IF;
END $$;

-- Step 2: Add new UUID column to Accounts
ALTER TABLE public."Accounts"
  ADD COLUMN new_id UUID NOT NULL DEFAULT gen_random_uuid();

-- Step 3: Add UUID shadow columns to dependent tables
ALTER TABLE public."Goals"
  ADD COLUMN new_account_id UUID;

ALTER TABLE public."GoalContributions"
  ADD COLUMN new_source_account_id UUID;

-- Step 4: Back-fill shadow columns
UPDATE public."Goals" g
SET new_account_id = a.new_id
FROM public."Accounts" a
WHERE g.account_id = a.id;

UPDATE public."GoalContributions" gc
SET new_source_account_id = a.new_id
FROM public."Accounts" a
WHERE gc.source_account_id = a.id;

-- Step 5: Swap Accounts primary key
DO $$
DECLARE
  v_constraint text;
BEGIN
  SELECT constraint_name INTO v_constraint
  FROM information_schema.table_constraints
  WHERE table_schema = 'public'
    AND table_name   = 'Accounts'
    AND constraint_type = 'PRIMARY KEY';

  EXECUTE format('ALTER TABLE public."Accounts" DROP CONSTRAINT %I', v_constraint);
END $$;

ALTER TABLE public."Accounts" ADD PRIMARY KEY (new_id);
ALTER TABLE public."Accounts" DROP COLUMN id;
ALTER TABLE public."Accounts" RENAME COLUMN new_id TO id;

-- Step 6: Swap FK columns on dependent tables
ALTER TABLE public."Goals" DROP COLUMN account_id;
ALTER TABLE public."Goals" RENAME COLUMN new_account_id TO account_id;

ALTER TABLE public."GoalContributions" DROP COLUMN source_account_id;
ALTER TABLE public."GoalContributions" RENAME COLUMN new_source_account_id TO source_account_id;

-- Step 7: Re-add FK constraints
ALTER TABLE public."Goals"
  ADD CONSTRAINT "Goals_account_id_fkey"
  FOREIGN KEY (account_id) REFERENCES public."Accounts" (id)
  ON DELETE SET NULL;

ALTER TABLE public."GoalContributions"
  ADD CONSTRAINT "GoalContributions_source_account_id_fkey"
  FOREIGN KEY (source_account_id) REFERENCES public."Accounts" (id)
  ON DELETE SET NULL;
