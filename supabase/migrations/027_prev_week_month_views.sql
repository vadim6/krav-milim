-- Read-only views for the previous week and previous calendar month.
-- Identical structure to leaderboard_weekly / leaderboard_monthly so the
-- frontend can reuse the same column set without any type gymnastics.

CREATE VIEW leaderboard_weekly_prev AS
WITH week_bounds AS (
  SELECT
    ((date_trunc('week', CURRENT_DATE + INTERVAL '1 day') - INTERVAL '1 day') - INTERVAL '7 days')::date AS week_start,
    ((date_trunc('week', CURRENT_DATE + INTERVAL '1 day') + INTERVAL '5 days') - INTERVAL '7 days')::date AS week_end
),
base AS (
  SELECT
    gr.user_id,
    u.username,
    u.avatar_url,
    u.avatar_config,
    u.current_streak,
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
  GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, u.current_streak, gibor.gibor_badge
)
SELECT
  b.*,
  (b.wins = 7)                                           AS perfect_week,
  DENSE_RANK() OVER (
    ORDER BY
      b.wins DESC,
      b.avg_guesses ASC NULLS LAST,
      b.current_streak DESC,
      b.games_played DESC
  ) AS rank
FROM base b;


CREATE VIEW leaderboard_monthly_prev AS
WITH month_bounds AS (
  SELECT
    date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date AS month_start,
    (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date AS month_end
),
base AS (
  SELECT
    gr.user_id,
    u.username,
    u.avatar_url,
    u.avatar_config,
    u.current_streak,
    COUNT(*)                                              AS games_played,
    COUNT(*) FILTER (WHERE gr.solved)                     AS wins,
    COUNT(*) FILTER (WHERE gr.solved AND gr.guesses = 1)  AS perfect_games,
    ROUND(AVG(gr.guesses) FILTER (WHERE gr.solved), 2)   AS avg_guesses,
    ROUND(
      100.0 * COUNT(*) FILTER (WHERE gr.solved) / NULLIF(COUNT(*), 0),
      0
    )                                                     AS win_rate,
    COALESCE(gibor.gibor_badge, false)                    AS gibor_badge,
    (mb.month_end - mb.month_start + 1)::integer          AS days_elapsed,
    (mb.month_end - mb.month_start + 1)::integer          AS days_in_month
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
  GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, u.current_streak,
           gibor.gibor_badge, mb.month_start, mb.month_end
)
SELECT
  b.*,
  (b.wins >= 7 AND b.wins = b.days_elapsed)             AS perfect_month_running,
  (b.wins = b.days_in_month)                             AS perfect_month_full,
  DENSE_RANK() OVER (
    ORDER BY
      b.wins DESC,
      b.avg_guesses ASC NULLS LAST,
      b.current_streak DESC,
      b.games_played DESC
  ) AS rank
FROM base b;
