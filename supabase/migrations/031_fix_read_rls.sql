-- Fix critical RLS: users and game_results were readable by anon role due to USING (true) policies

-- users: restrict SELECT to own row only
-- Leaderboard data is served via SECURITY DEFINER views which bypass RLS
DROP POLICY "users_read_all" ON users;
CREATE POLICY "users_select_own" ON users
  FOR SELECT USING ((select auth.uid()) = id);

-- game_results: restrict SELECT to own row only
-- Leaderboard views (SECURITY DEFINER) bypass RLS and remain unaffected
DROP POLICY "results_read_all" ON game_results;
CREATE POLICY "results_select_own" ON game_results
  FOR SELECT USING ((select auth.uid()) = user_id);
