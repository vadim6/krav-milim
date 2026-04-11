-- ============================================================
-- Weekly & Monthly Leaderboard Views
-- Gives new players a fair chance to compete on shorter windows,
-- not just all-time cumulative stats.
-- ============================================================

-- Weekly leaderboard: aggregates results for the current Sun–Sat week.
-- date_trunc('week') gives Monday; shifting +1 day before truncating and -1 after
-- converts that to Sunday start.
-- Ranks by: wins DESC, avg_guesses ASC, perfect_games DESC, games_played DESC
CREATE VIEW leaderboard_weekly AS
WITH week_bounds AS (
  SELECT
    (date_trunc('week', CURRENT_DATE + INTERVAL '1 day') - INTERVAL '1 day')::date AS week_start,
    (date_trunc('week', CURRENT_DATE + INTERVAL '1 day') + INTERVAL '5 days')::date AS week_end
),
base AS (
  SELECT
    gr.user_id,
    u.username,
    u.avatar_url,
    u.avatar_config,
    COUNT(*)                                              AS games_played,
    COUNT(*) FILTER (WHERE gr.solved)                     AS wins,
    COUNT(*) FILTER (WHERE gr.solved AND gr.guesses = 1)  AS perfect_games,
    ROUND(AVG(gr.guesses) FILTER (WHERE gr.solved), 2)   AS avg_guesses,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE gr.solved) / NULLIF(COUNT(*), 0),
      0
    )                                                     AS win_rate,
    COALESCE(gibor.gibor_badge, false)                    AS gibor_badge
  FROM game_results gr
  JOIN users u ON u.id = gr.user_id
  JOIN words w ON w.id = gr.word_id
  CROSS JOIN week_bounds wb
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
    AND (gr.solved = true OR gr.guesses >= 6)
    AND w.date >= wb.week_start
    AND w.date <= wb.week_end
  GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, gibor.gibor_badge
)
SELECT
  b.*,
  DENSE_RANK() OVER (
    ORDER BY
      b.wins DESC,
      b.avg_guesses ASC NULLS LAST,
      b.perfect_games DESC,
      b.games_played DESC
  ) AS rank
FROM base b;


-- Monthly leaderboard: aggregates results for the current calendar month.
-- Same ranking logic as weekly.
CREATE VIEW leaderboard_monthly AS
WITH month_bounds AS (
  SELECT
    date_trunc('month', CURRENT_DATE)::date AS month_start,
    (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::date AS month_end
),
base AS (
  SELECT
    gr.user_id,
    u.username,
    u.avatar_url,
    u.avatar_config,
    COUNT(*)                                              AS games_played,
    COUNT(*) FILTER (WHERE gr.solved)                     AS wins,
    COUNT(*) FILTER (WHERE gr.solved AND gr.guesses = 1)  AS perfect_games,
    ROUND(AVG(gr.guesses) FILTER (WHERE gr.solved), 2)   AS avg_guesses,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE gr.solved) / NULLIF(COUNT(*), 0),
      0
    )                                                     AS win_rate,
    COALESCE(gibor.gibor_badge, false)                    AS gibor_badge
  FROM game_results gr
  JOIN users u ON u.id = gr.user_id
  JOIN words w ON w.id = gr.word_id
  CROSS JOIN month_bounds mb
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
    AND (gr.solved = true OR gr.guesses >= 6)
    AND w.date >= mb.month_start
    AND w.date <= mb.month_end
  GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, gibor.gibor_badge
)
SELECT
  b.*,
  DENSE_RANK() OVER (
    ORDER BY
      b.wins DESC,
      b.avg_guesses ASC NULLS LAST,
      b.perfect_games DESC,
      b.games_played DESC
  ) AS rank
FROM base b;
