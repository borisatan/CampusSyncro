-- ============================================
-- Auto-Create Profiles on User Sign-Up
-- ============================================
-- This migration creates a trigger that automatically creates a profile
-- when a new user signs up (via email or OAuth)

-- ============================================
-- 1. Create Profiles Table (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS Profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT DEFAULT 'USD',
  use_dynamic_income BOOLEAN DEFAULT false,
  manual_income NUMERIC DEFAULT 0,
  monthly_savings_target NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_id ON Profiles(id);

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE Profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON Profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON Profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (for manual creation)
CREATE POLICY "Users can insert their own profile"
  ON Profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. Auto-Create Profile Function
-- ============================================
-- This function runs automatically when a new user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.Profiles (id, currency, created_at, updated_at)
  VALUES (new.id, 'USD', NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Create Trigger on auth.users
-- ============================================
-- Drop the trigger if it exists (to allow re-running this migration)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. Verification Queries
-- ============================================
-- Run these queries after the migration to verify:

-- Check if trigger exists:
-- SELECT trigger_name, event_manipulation, event_object_table, action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_name = 'handle_new_user';
