-- Frozen snapshot tables for previous-week and previous-month leaderboards.
-- Populated by pg_cron functions; the _prev views now read from these tables
-- so historical rankings are immutable regardless of live streak changes.

-- ── Capture existing _prev data before any drops ──────────────────────────────
-- On first run (prod): reads from the old live-computed _prev views.
-- On re-run (local): reads from the already-snapshot-backed _prev views.
-- Either way the data lands in temp tables and survives the DROP TABLE CASCADE below.

CREATE TEMP TABLE _weekly_backfill AS
SELECT
  user_id, username, avatar_url, avatar_config, current_streak,
  games_played, wins, perfect_games, avg_guesses, win_rate,
  gibor_badge, perfect_week, rank
FROM leaderboard_weekly_prev;

CREATE TEMP TABLE _monthly_backfill AS
SELECT
  user_id, username, avatar_url, avatar_config, current_streak,
  games_played, wins, perfect_games, avg_guesses, win_rate,
  gibor_badge, days_elapsed, days_in_month,
  perfect_month_running, perfect_month_full, rank
FROM leaderboard_monthly_prev;

-- ── Snapshot tables ───────────────────────────────────────────────────────────

DROP TABLE IF EXISTS leaderboard_weekly_snapshot CASCADE;
DROP TABLE IF EXISTS leaderboard_monthly_snapshot CASCADE;

CREATE TABLE leaderboard_weekly_snapshot (
  user_id       uuid        NOT NULL,
  username      text        NOT NULL,
  avatar_url    text,
  avatar_config jsonb,
  current_streak integer    NOT NULL DEFAULT 0,
  games_played  bigint      NOT NULL,
  wins          bigint      NOT NULL,
  perfect_games bigint      NOT NULL,
  avg_guesses   numeric,
  win_rate      numeric,
  gibor_badge   boolean     NOT NULL DEFAULT false,
  perfect_week  boolean     NOT NULL DEFAULT false,
  rank          bigint      NOT NULL,
  PRIMARY KEY (user_id)
);

CREATE TABLE leaderboard_monthly_snapshot (
  user_id               uuid     NOT NULL,
  username              text     NOT NULL,
  avatar_url            text,
  avatar_config         jsonb,
  current_streak        integer  NOT NULL DEFAULT 0,
  games_played          bigint   NOT NULL,
  wins                  bigint   NOT NULL,
  perfect_games         bigint   NOT NULL,
  avg_guesses           numeric,
  win_rate              numeric,
  gibor_badge           boolean  NOT NULL DEFAULT false,
  days_elapsed          integer  NOT NULL,
  days_in_month         integer  NOT NULL,
  perfect_month_running boolean  NOT NULL DEFAULT false,
  perfect_month_full    boolean  NOT NULL DEFAULT false,
  rank                  bigint   NOT NULL,
  PRIMARY KEY (user_id)
);

-- ── Backfill from captured data ───────────────────────────────────────────────

INSERT INTO leaderboard_weekly_snapshot  SELECT * FROM _weekly_backfill;
INSERT INTO leaderboard_monthly_snapshot SELECT * FROM _monthly_backfill;

-- ── Weekly snapshot function ──────────────────────────────────────────────────
-- Called at Saturday 22:01 UTC (= Sunday 00:01–01:01 Israel time).
-- At that moment leaderboard_weekly still reflects the just-ended Sun–Sat week.

CREATE OR REPLACE FUNCTION snapshot_weekly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  TRUNCATE leaderboard_weekly_snapshot;
  INSERT INTO leaderboard_weekly_snapshot
  SELECT
    user_id, username, avatar_url, avatar_config, current_streak,
    games_played, wins, perfect_games, avg_guesses, win_rate,
    gibor_badge, perfect_week, rank
  FROM leaderboard_weekly;
END;
$$;

-- ── Monthly snapshot function ─────────────────────────────────────────────────
-- Called at 00:01 UTC on the 1st of each month (= 02:01–03:01 Israel time).
-- Cannot read from leaderboard_monthly (already shows new month by then), so
-- the previous month's bounds are computed inline.

CREATE OR REPLACE FUNCTION snapshot_monthly_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_month_start   date    := date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date;
  v_month_end     date    := (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date;
  v_days_in_month integer := v_month_end - v_month_start + 1;
BEGIN
  TRUNCATE leaderboard_monthly_snapshot;
  INSERT INTO leaderboard_monthly_snapshot
  WITH base AS (
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
      v_days_in_month                                       AS days_elapsed,
      v_days_in_month                                       AS days_in_month
    FROM game_results gr
    JOIN users u ON u.id = gr.user_id
    JOIN words w ON w.id = gr.word_id
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
      AND w.date >= v_month_start
      AND w.date <= v_month_end
    GROUP BY gr.user_id, u.username, u.avatar_url, u.avatar_config, u.current_streak, gibor.gibor_badge
  )
  SELECT
    b.user_id,
    b.username,
    b.avatar_url,
    b.avatar_config,
    b.current_streak,
    b.games_played,
    b.wins,
    b.perfect_games,
    b.avg_guesses,
    b.win_rate,
    b.gibor_badge,
    b.days_elapsed,
    b.days_in_month,
    (b.wins >= 7 AND b.wins = b.days_elapsed) AS perfect_month_running,
    (b.wins = b.days_in_month)                AS perfect_month_full,
    DENSE_RANK() OVER (
      ORDER BY
        b.wins DESC,
        b.avg_guesses ASC NULLS LAST,
        b.current_streak DESC,
        b.games_played DESC
    ) AS rank
  FROM base b;
END;
$$;

-- ── pg_cron schedules ─────────────────────────────────────────────────────────

SELECT cron.unschedule('snapshot-weekly-leaderboard')  FROM cron.job WHERE jobname = 'snapshot-weekly-leaderboard';
SELECT cron.unschedule('snapshot-monthly-leaderboard') FROM cron.job WHERE jobname = 'snapshot-monthly-leaderboard';

SELECT cron.schedule(
  'snapshot-weekly-leaderboard',
  '1 22 * * 6',   -- Saturday 22:01 UTC = Sunday 00:01 IST / 01:01 IDT
  'SELECT snapshot_weekly_leaderboard()'
);

SELECT cron.schedule(
  'snapshot-monthly-leaderboard',
  '1 0 1 * *',    -- 1st of month 00:01 UTC = 02:01–03:01 Israel time
  'SELECT snapshot_monthly_leaderboard()'
);

-- ── Replace _prev views to read from snapshot tables ─────────────────────────

DROP VIEW IF EXISTS leaderboard_weekly_prev CASCADE;
DROP VIEW IF EXISTS leaderboard_monthly_prev CASCADE;

CREATE VIEW leaderboard_weekly_prev
WITH (security_invoker = false)
AS SELECT * FROM leaderboard_weekly_snapshot;

CREATE VIEW leaderboard_monthly_prev
WITH (security_invoker = false)
AS SELECT * FROM leaderboard_monthly_snapshot;
