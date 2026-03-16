-- Add streak tracking columns to users
ALTER TABLE users
  ADD COLUMN current_streak   INT  NOT NULL DEFAULT 0,
  ADD COLUMN best_streak      INT  NOT NULL DEFAULT 0,
  ADD COLUMN last_solved_date DATE;

-- Recreate leaderboard_global: remove duration_seconds from select and from RANK()
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
  RANK() OVER (
    PARTITION BY gr.word_id
    ORDER BY
      gr.solved DESC,
      gr.guesses ASC
  ) AS rank
FROM game_results gr
JOIN users u ON u.id = gr.user_id
JOIN words  w ON w.id = gr.word_id
WHERE w.source = 'daily_global'
  AND (gr.solved = true OR gr.guesses >= 6);

-- Recreate leaderboard_alltime: remove avg_duration, add streak, new ranking
-- Built directly from game_results (not from leaderboard_global view) so we can JOIN users for streak fields.
-- current_streak is shown as 0 if last_solved_date is older than yesterday (streak expired).
CREATE VIEW leaderboard_alltime AS
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
  ROUND(AVG(gr.guesses) FILTER (WHERE gr.solved), 2)        AS avg_guesses,
  RANK() OVER (
    ORDER BY
      COUNT(*) FILTER (WHERE gr.solved) DESC,
      AVG(gr.guesses)  FILTER (WHERE gr.solved) ASC NULLS LAST,
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
GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, u.current_streak, u.best_streak, u.last_solved_date;

-- Update compute_nemesis_winner: remove duration tiebreaker (Tier 3 → true draw)
CREATE OR REPLACE FUNCTION public.compute_nemesis_winner()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  c game_results%ROWTYPE;
  r game_results%ROWTYPE;
BEGIN
  IF NEW.challenger_result_id IS NULL OR NEW.receiver_result_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO c FROM game_results WHERE id = NEW.challenger_result_id;
  SELECT * INTO r FROM game_results WHERE id = NEW.receiver_result_id;

  NEW.tiebreaker_applied := false;

  -- Tier 1: solved beats unsolved
  IF c.solved AND NOT r.solved THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r.solved AND NOT c.solved THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Neither solved → draw
  IF NOT c.solved AND NOT r.solved THEN
    NEW.winner_id := NULL; RETURN NEW;
  END IF;

  -- Both solved from here on

  -- Tier 2: fewer guesses
  IF c.guesses < r.guesses THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r.guesses < c.guesses THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- True draw (same guesses, both solved)
  NEW.winner_id := NULL;
  RETURN NEW;
END;
$$;
