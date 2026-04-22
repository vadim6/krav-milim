-- Enable RLS on leaderboard snapshot tables.
-- These tables are backing stores for the leaderboard_weekly_prev and
-- leaderboard_monthly_prev SECURITY DEFINER views.  Direct PostgREST
-- access from anon/authenticated should be blocked; the views (which
-- run as the postgres owner and bypass RLS) remain the only access path.
-- No policies are added intentionally — deny-all for regular users.

ALTER TABLE leaderboard_weekly_snapshot  ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_monthly_snapshot ENABLE ROW LEVEL SECURITY;
