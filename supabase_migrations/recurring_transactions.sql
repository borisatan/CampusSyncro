-- Add push token to Profiles for server-initiated push notifications
ALTER TABLE "Profiles"
  ADD COLUMN IF NOT EXISTS push_token TEXT DEFAULT NULL;

-- RecurringTransactions table: stores templates for auto-created transactions
CREATE TABLE IF NOT EXISTS "RecurringTransactions" (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL,        -- negative = expense, positive = income
  category_name TEXT NOT NULL,
  account_name  TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  interval_type TEXT NOT NULL CHECK (interval_type IN ('biweekly', 'monthly')),
  next_run_date DATE NOT NULL,                 -- next calendar date to fire
  end_date      DATE DEFAULT NULL,             -- NULL = open-ended
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rt_user_id
  ON "RecurringTransactions"(user_id);

-- Partial index for efficient daily cron query
CREATE INDEX IF NOT EXISTS idx_rt_active_next_run
  ON "RecurringTransactions"(is_active, next_run_date)
  WHERE is_active = true;

CREATE OR REPLACE FUNCTION update_recurring_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_rt_updated_at
  BEFORE UPDATE ON "RecurringTransactions"
  FOR EACH ROW EXECUTE FUNCTION update_recurring_transactions_updated_at();

ALTER TABLE "RecurringTransactions" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own recurring"
  ON "RecurringTransactions" FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
