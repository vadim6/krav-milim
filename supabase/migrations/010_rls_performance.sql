-- ============================================================
-- Fix RLS performance warnings
--
-- 1. Replace auth.uid() with (select auth.uid()) in all policies
--    so it's evaluated once per query, not once per row.
--
-- 2. Merge the 3 permissive SELECT policies on `words` into one
--    to avoid multiple policy evaluation per row.
-- ============================================================

-- ─── Users ──────────────────────────────────────────────────
DROP POLICY "users_insert_own" ON users;
DROP POLICY "users_update_own" ON users;

CREATE POLICY "users_insert_own" ON users FOR INSERT
  WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE
  USING ((select auth.uid()) = id);

-- ─── Words ──────────────────────────────────────────────────
-- Drop the 3 separate SELECT policies and replace with one
DROP POLICY "words_global_read"  ON words;
DROP POLICY "words_nemesis_read" ON words;
DROP POLICY "words_chevre_read"  ON words;
DROP POLICY "words_insert_auth"  ON words;

CREATE POLICY "words_read" ON words FOR SELECT
  USING (
    source = 'daily_global'
    OR (
      source = 'nemesis'
      AND (created_by = (select auth.uid()) OR for_user = (select auth.uid()))
    )
    OR (
      source = 'chevre'
      AND EXISTS (
        SELECT 1 FROM chevre_members cm
        WHERE cm.group_id = words.for_group
          AND cm.user_id = (select auth.uid())
      )
    )
  );

CREATE POLICY "words_insert_auth" ON words FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);

-- ─── Game results ────────────────────────────────────────────
DROP POLICY "results_insert_own" ON game_results;
DROP POLICY "results_update_own" ON game_results;

CREATE POLICY "results_insert_own" ON game_results FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "results_update_own" ON game_results FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- ─── Nemesis rivalries ───────────────────────────────────────
DROP POLICY "nemesis_read_participant"   ON nemesis_rivalries;
DROP POLICY "nemesis_insert_challenger"  ON nemesis_rivalries;
DROP POLICY "nemesis_update_receiver"    ON nemesis_rivalries;

CREATE POLICY "nemesis_read_participant" ON nemesis_rivalries FOR SELECT
  USING ((select auth.uid()) IN (challenger_id, receiver_id));
CREATE POLICY "nemesis_insert_challenger" ON nemesis_rivalries FOR INSERT
  WITH CHECK ((select auth.uid()) = challenger_id);
CREATE POLICY "nemesis_update_receiver" ON nemesis_rivalries FOR UPDATE
  USING ((select auth.uid()) = receiver_id);

-- ─── Nemesis scores ──────────────────────────────────────────
DROP POLICY "nemesis_scores_read"               ON nemesis_scores;
DROP POLICY "nemesis_scores_insert_participant"  ON nemesis_scores;
DROP POLICY "nemesis_scores_update_participant"  ON nemesis_scores;

CREATE POLICY "nemesis_scores_read" ON nemesis_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = nemesis_scores.rivalry_id
        AND (select auth.uid()) IN (nr.challenger_id, nr.receiver_id)
    )
  );
CREATE POLICY "nemesis_scores_insert_participant" ON nemesis_scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = rivalry_id
        AND nr.status = 'active'
        AND (select auth.uid()) IN (nr.challenger_id, nr.receiver_id)
    )
  );
CREATE POLICY "nemesis_scores_update_participant" ON nemesis_scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = rivalry_id
        AND (select auth.uid()) IN (nr.challenger_id, nr.receiver_id)
    )
  );

-- ─── Chevre groups ───────────────────────────────────────────
DROP POLICY "chevre_groups_read_member"   ON chevre_groups;
DROP POLICY "chevre_groups_insert_auth"   ON chevre_groups;
DROP POLICY "chevre_groups_update_admin"  ON chevre_groups;

CREATE POLICY "chevre_groups_read_member" ON chevre_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_groups.id
        AND cm.user_id = (select auth.uid())
    )
  );
CREATE POLICY "chevre_groups_insert_auth" ON chevre_groups FOR INSERT
  WITH CHECK ((select auth.uid()) = created_by);
CREATE POLICY "chevre_groups_update_admin" ON chevre_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_groups.id
        AND cm.user_id = (select auth.uid())
        AND cm.role = 'admin'
    )
  );

-- ─── Chevre members ──────────────────────────────────────────
DROP POLICY "chevre_members_read_member"  ON chevre_members;
DROP POLICY "chevre_members_insert_self"  ON chevre_members;
DROP POLICY "chevre_members_delete_self"  ON chevre_members;

CREATE POLICY "chevre_members_read_member" ON chevre_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm2
      WHERE cm2.group_id = chevre_members.group_id
        AND cm2.user_id = (select auth.uid())
    )
  );
CREATE POLICY "chevre_members_insert_self" ON chevre_members FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "chevre_members_delete_self" ON chevre_members FOR DELETE
  USING ((select auth.uid()) = user_id);

-- ─── Chevre scores ───────────────────────────────────────────
DROP POLICY "chevre_scores_read_member" ON chevre_scores;

CREATE POLICY "chevre_scores_read_member" ON chevre_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_scores.group_id
        AND cm.user_id = (select auth.uid())
    )
  );
