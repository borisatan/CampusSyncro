-- ============================================
-- Delete User Account Function
-- ============================================
-- Deletes all data belonging to the calling authenticated user,
-- then removes the auth.users record (which cascades to Profiles,
-- NotificationMessages, and NotificationLogs via ON DELETE CASCADE).
--
-- Run this in your Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- GoalContributions first (FK: goal_id → Goals.id)
  DELETE FROM public."GoalContributions"
  WHERE user_id = v_user_id;

  -- Goals (FK: account_id → Accounts.id ON DELETE SET NULL, safe to delete before Accounts)
  DELETE FROM public."Goals"
  WHERE user_id = v_user_id;

  DELETE FROM public."Transactions"
  WHERE user_id = v_user_id;

  DELETE FROM public."Accounts"
  WHERE user_id = v_user_id;

  DELETE FROM public."Categories"
  WHERE user_id = v_user_id;

  -- Deleting the auth user cascades: Profiles, NotificationMessages, NotificationLogs
  DELETE FROM auth.users
  WHERE id = v_user_id;
END;
$$;

-- Only authenticated users can call this; they can only delete themselves
-- because the function uses auth.uid() internally.
REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
