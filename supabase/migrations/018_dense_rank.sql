-- Fix leaderboard_global to use DENSE_RANK so tied ranks don't skip numbers.
-- e.g. two players tied at rank 1 → next player is rank 2, not rank 3.
DROP VIEW IF EXISTS leaderboard_global;

CREATE VIEW leaderboard_global AS
SELECT
  gr.user_id,
  u.username,
  u.avatar_url,
  u.avatar_config,
  gr.word_id,
  w.date,
  gr.solved,
  gr.guesses,
  COALESCE(gibor.gibor_badge, false) AS gibor_badge,
  DENSE_RANK() OVER (
    PARTITION BY gr.word_id
    ORDER BY
      gr.solved DESC,
      gr.guesses ASC
  ) AS rank
FROM game_results gr
JOIN users u ON u.id = gr.user_id
JOIN words  w ON w.id = gr.word_id
LEFT JOIN LATERAL (
  SELECT COUNT(*) = 2 AND bool_and(hard_mode) AS gibor_badge
  FROM (
    SELECT gr2.hard_mode
    FROM game_results gr2
    JOIN words w2 ON w2.id = gr2.word_id
    WHERE gr2.user_id = gr.user_id
      AND w2.source = 'daily_global'
      AND (gr2.solved = true OR gr2.guesses >= 6)
      AND gr2.hard_mode IS NOT NULL
    ORDER BY w2.date DESC
    LIMIT 2
  ) last2
) gibor ON true
WHERE w.source = 'daily_global'
  AND (gr.solved = true OR gr.guesses >= 6);
