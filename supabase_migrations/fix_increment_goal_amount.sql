-- Fix increment_goal_amount RPC to use the correct table name "Goals" (capitalized)
CREATE OR REPLACE FUNCTION increment_goal_amount(p_goal_id integer, p_amount numeric)
RETURNS void AS $$
BEGIN
  UPDATE "Goals"
  SET current_amount = current_amount + p_amount,
      updated_at = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
