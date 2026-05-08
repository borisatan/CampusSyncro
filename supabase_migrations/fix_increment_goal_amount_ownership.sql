-- Add user ownership check to increment_goal_amount RPC.
-- The previous version used SECURITY DEFINER without a user_id guard, allowing
-- any authenticated user to mutate another user's goal balance by guessing a goal_id.
CREATE OR REPLACE FUNCTION increment_goal_amount(p_goal_id integer, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE "Goals"
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_goal_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
