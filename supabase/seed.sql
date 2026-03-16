-- Seed: sample 5-letter Hebrew words for local development
-- Replace with a proper Hspell-derived list for production.
-- All words are without nikud, exactly 5 letters.

INSERT INTO words (word, language, date, source)
VALUES
  ('שולחן', 'he', CURRENT_DATE + 1,  'daily_global'),
  ('מזרון', 'he', CURRENT_DATE + 2,  'daily_global'),
  ('ספרים', 'he', CURRENT_DATE + 3,  'daily_global'),
  ('דלתות', 'he', CURRENT_DATE + 4,  'daily_global'),
  ('כלבים', 'he', CURRENT_DATE + 5, 'daily_global'),
  ('מכונה', 'he', CURRENT_DATE + 6,  'daily_global'),
  ('שמיים', 'he', CURRENT_DATE + 7,  'daily_global'),
  ('אריות', 'he', CURRENT_DATE + 8,  'daily_global'),
  ('פרחים', 'he', CURRENT_DATE + 9,  'daily_global'),
  ('כדורי', 'he', CURRENT_DATE + 10, 'daily_global')
ON CONFLICT DO NOTHING;
