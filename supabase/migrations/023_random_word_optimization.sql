-- Replace ORDER BY RANDOM() LIMIT 1 with count+offset pattern.
-- ORDER BY RANDOM() scores every candidate row and sorts — O(n log n).
-- count+offset does two index scans with no sort — O(n).
-- Randomness is equivalent (uniform distribution); the only theoretical
-- edge case is if a word is inserted between the COUNT and OFFSET subqueries,
-- which could cause the OFFSET to go out of range and the UPDATE to affect
-- 0 rows. This is negligible in practice.

CREATE OR REPLACE FUNCTION pick_daily_word() RETURNS void AS $$
BEGIN
  UPDATE words
  SET date = CURRENT_DATE + 1
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    OFFSET floor(random() * (
      SELECT count(*) FROM words WHERE source = 'daily_global' AND date IS NULL
    ))::int
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION pick_word_for_date(target_date date) RETURNS void AS $$
BEGIN
  UPDATE words
  SET date = target_date
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    OFFSET floor(random() * (
      SELECT count(*) FROM words WHERE source = 'daily_global' AND date IS NULL
    ))::int
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
