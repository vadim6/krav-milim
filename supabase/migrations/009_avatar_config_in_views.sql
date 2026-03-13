-- Recreate leaderboard views to include avatar_config

DROP VIEW IF EXISTS leaderboard_alltime;
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
  gr.duration_seconds,
  RANK() OVER (
    PARTITION BY gr.word_id
    ORDER BY
      gr.solved DESC,
      gr.guesses ASC,
      gr.duration_seconds ASC NULLS LAST
  ) AS rank
FROM game_results gr
JOIN users u ON u.id = gr.user_id
JOIN words  w ON w.id = gr.word_id
WHERE w.source = 'daily_global';

CREATE VIEW leaderboard_alltime AS
SELECT
  user_id,
  username,
  avatar_url,
  avatar_config,
  COUNT(*)                                              AS total_games,
  COUNT(*) FILTER (WHERE solved)                        AS total_wins,
  ROUND(AVG(guesses) FILTER (WHERE solved), 2)          AS avg_guesses,
  ROUND(AVG(duration_seconds) FILTER (WHERE solved), 1) AS avg_duration_seconds,
  RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE solved) DESC) AS rank
FROM leaderboard_global
GROUP BY user_id, username, avatar_url, avatar_config;
