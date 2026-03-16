-- Fix leaderboard_alltime: failed games (guesses=6, solved=false) were excluded
-- from avg_guesses, artificially lowering the average. Include all games.
CREATE OR REPLACE VIEW leaderboard_alltime AS
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
  ROUND(AVG(gr.guesses), 2)                                 AS avg_guesses,
  RANK() OVER (
    ORDER BY
      COUNT(*) FILTER (WHERE gr.solved) DESC,
      AVG(gr.guesses) ASC NULLS LAST,
      CASE
        WHEN u.last_solved_date >= CURRENT_DATE - INTERVAL '1 day'
        THEN u.current_streak
        ELSE 0
      END DESC NULLS LAST
  ) AS rank
FROM game_results gr
JOIN users u ON u.id = gr.user_id
JOIN words w ON w.id = gr.word_id
WHERE w.source = 'daily_global'
  AND (gr.solved = true OR gr.guesses >= 6)
GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, u.current_streak, u.best_streak, u.last_solved_date;
