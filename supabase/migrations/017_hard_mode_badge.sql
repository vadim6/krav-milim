-- Track whether each game was played on hard mode (גיבור mode).
-- NULL = pre-feature game (ignored by badge logic).
ALTER TABLE game_results ADD COLUMN hard_mode BOOLEAN DEFAULT NULL;

-- Recreate leaderboard_global with gibor_badge:
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
  RANK() OVER (
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

-- Recreate leaderboard_alltime with gibor_badge:
-- badge = true if all of the user's last 1–2 post-feature daily games were played on hard mode.
-- Uses a CTE for the aggregated base, then a LATERAL for the per-user badge check.
DROP VIEW IF EXISTS leaderboard_alltime;

CREATE VIEW leaderboard_alltime AS
WITH base AS (
  SELECT
    gr.user_id,
    u.username,
    u.avatar_url,
    u.avatar_config,
    CASE
      WHEN u.last_solved_date >= CURRENT_DATE - INTERVAL '1 day'
      THEN u.current_streak
      ELSE 0
    END                                                       AS current_streak,
    u.best_streak,
    COUNT(*) FILTER (WHERE gr.solved)                         AS total_wins,
    ROUND(AVG(gr.guesses), 2)                                 AS avg_guesses
  FROM game_results gr
  JOIN users u ON u.id = gr.user_id
  JOIN words  w ON w.id = gr.word_id
  WHERE w.source = 'daily_global'
    AND (gr.solved = true OR gr.guesses >= 6)
  GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config,
           u.current_streak, u.best_streak, u.last_solved_date
)
SELECT
  b.user_id,
  b.username,
  b.avatar_url,
  b.avatar_config,
  b.current_streak,
  b.best_streak,
  b.total_wins,
  b.avg_guesses,
  COALESCE(gibor.gibor_badge, false)                          AS gibor_badge,
  RANK() OVER (
    ORDER BY
      b.total_wins DESC,
      b.avg_guesses ASC NULLS LAST,
      b.current_streak DESC NULLS LAST
  ) AS rank
FROM base b
LEFT JOIN LATERAL (
  SELECT COUNT(*) = 2 AND bool_and(hard_mode) AS gibor_badge
  FROM (
    SELECT gr2.hard_mode
    FROM game_results gr2
    JOIN words w2 ON w2.id = gr2.word_id
    WHERE gr2.user_id = b.user_id
      AND w2.source = 'daily_global'
      AND (gr2.solved = true OR gr2.guesses >= 6)
      AND gr2.hard_mode IS NOT NULL
    ORDER BY w2.date DESC
    LIMIT 2
  ) last5
) gibor ON true;
