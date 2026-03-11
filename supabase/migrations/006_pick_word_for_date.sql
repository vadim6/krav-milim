-- Generalised version: pick a random unscheduled word and assign it to any target date
CREATE OR REPLACE FUNCTION pick_word_for_date(target_date date) RETURNS void AS $$
BEGIN
  UPDATE words
  SET date = target_date
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
