-- Replace NULLS NOT DISTINCT constraint with a standard one so multiple unscheduled
-- words (date IS NULL) can coexist — NULL != NULL in standard SQL unique constraints.
-- The one-word-per-day guarantee still holds for actual date values.
ALTER TABLE words DROP CONSTRAINT IF EXISTS words_date_global_unique;
ALTER TABLE words ADD CONSTRAINT words_date_global_unique UNIQUE (date, source);

-- Prevent duplicate words in the same source pool
CREATE UNIQUE INDEX IF NOT EXISTS words_word_source_unique ON words(word, source);

-- Enable pg_cron extension (available on all Supabase projects)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required by Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;

-- Function: pick one random unscheduled daily_global word and assign it to tomorrow
CREATE OR REPLACE FUNCTION pick_daily_word() RETURNS void AS $$
BEGIN
  UPDATE words
  SET date = CURRENT_DATE + 1
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule: runs every day at 22:00 UTC (midnight–01:00 Israel time, safe for both DST offsets)
SELECT cron.schedule(
  'pick-daily-word',
  '0 22 * * *',
  'SELECT pick_daily_word()'
);
