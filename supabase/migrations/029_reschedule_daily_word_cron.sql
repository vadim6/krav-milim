-- Reschedule daily word picker from 22:00 UTC to 20:00 UTC.
-- 22:00 UTC caused a 1-hour window in summer (UTC+3) where israelToday()
-- had already flipped to the next day but the word wasn't assigned yet.
-- 20:00 UTC fires before Israel midnight in both summer (23:00 IDT) and winter (22:00 IST).
SELECT cron.unschedule('pick-daily-word');
SELECT cron.schedule(
  'pick-daily-word',
  '0 20 * * *',
  'SELECT pick_daily_word()'
);
