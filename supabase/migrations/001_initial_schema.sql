-- ============================================================
-- Krav Milim (קרב מילים) — Initial Schema
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ──────────────────────────────────────────────────
CREATE TYPE rivalry_status AS ENUM ('pending', 'active', 'declined', 'completed');
CREATE TYPE chevre_role    AS ENUM ('admin', 'member');
CREATE TYPE word_source    AS ENUM ('daily_global', 'nemesis', 'chevre', 'custom');

-- ─── USERS ──────────────────────────────────────────────────
-- Mirrors auth.users; populated by trigger on signup.
CREATE TABLE users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username    TEXT        UNIQUE NOT NULL CHECK (char_length(username) BETWEEN 2 AND 30),
  email       TEXT        UNIQUE NOT NULL,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── WORDS ──────────────────────────────────────────────────
-- Stores every word used in gameplay: global daily, nemesis, chevre.
-- for_group FK is added after chevre_groups is created (see below).
CREATE TABLE words (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  word        TEXT        NOT NULL CHECK (char_length(word) = 5),
  language    TEXT        NOT NULL DEFAULT 'he',
  date        DATE,                          -- NULL = not yet scheduled
  source      word_source NOT NULL DEFAULT 'daily_global',
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  for_user    UUID        REFERENCES users(id) ON DELETE CASCADE,   -- nemesis target
  for_group   UUID,                          -- FK patched after chevre_groups
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Exactly one global word per calendar day
  CONSTRAINT words_date_global_unique UNIQUE NULLS NOT DISTINCT (date, source)
);

-- ─── GAME RESULTS ───────────────────────────────────────────
-- One row per (user, word). Records everything needed for tiebreakers.
--
-- guess_history JSON shape:
--   [{"guess": "שלום?", "result": ["correct","present","absent","correct","absent"]}, …]
--
-- revealed_letters JSON shape:
--   {"correct": ["ש"], "present": ["ל"], "absent": ["מ"]}
CREATE TABLE game_results (
  id                UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word_id           UUID     NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  guesses           SMALLINT NOT NULL CHECK (guesses BETWEEN 0 AND 6),
  guess_history     JSONB    NOT NULL DEFAULT '[]',
  revealed_letters  JSONB    NOT NULL DEFAULT '{"correct":[],"present":[],"absent":[]}',
  solved            BOOLEAN  NOT NULL DEFAULT false,
  duration_seconds  INTEGER  CHECK (duration_seconds >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, word_id)
);

-- ─── NEMESIS RIVALRIES ──────────────────────────────────────
CREATE TABLE nemesis_rivalries (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        rivalry_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT no_self_rivalry CHECK (challenger_id <> receiver_id),
  -- Rivalries are directional but we prevent duplicate pairs
  CONSTRAINT unique_rivalry UNIQUE (challenger_id, receiver_id)
);

-- Scored outcome for each day of a nemesis rivalry.
CREATE TABLE nemesis_scores (
  id                   UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  rivalry_id           UUID    NOT NULL REFERENCES nemesis_rivalries(id) ON DELETE CASCADE,
  word_id              UUID    NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  challenger_result_id UUID    REFERENCES game_results(id) ON DELETE SET NULL,
  receiver_result_id   UUID    REFERENCES game_results(id) ON DELETE SET NULL,
  winner_id            UUID    REFERENCES users(id) ON DELETE SET NULL,  -- NULL = draw
  tiebreaker_applied   BOOLEAN NOT NULL DEFAULT false,
  date                 DATE    NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (rivalry_id, word_id)
);

-- ─── CHEVRE GROUPS ──────────────────────────────────────────
CREATE TABLE chevre_groups (
  id            UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT     NOT NULL CHECK (char_length(name) BETWEEN 2 AND 50),
  created_by    UUID     NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  threshold_pct SMALLINT NOT NULL DEFAULT 75 CHECK (threshold_pct BETWEEN 1 AND 100),
  invite_code   TEXT     UNIQUE NOT NULL
                         DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Back-patch FK on words
ALTER TABLE words
  ADD CONSTRAINT fk_words_for_group
  FOREIGN KEY (for_group) REFERENCES chevre_groups(id) ON DELETE CASCADE;

CREATE TABLE chevre_members (
  id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID        NOT NULL REFERENCES chevre_groups(id) ON DELETE CASCADE,
  user_id   UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role      chevre_role NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- One row per (group, day). Stores hider + all seeker outcomes.
--
-- seeker_results JSON shape:
--   {"<user_id>": {"solved": true, "guesses": 3, "duration_seconds": 90}, …}
CREATE TABLE chevre_scores (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID    NOT NULL REFERENCES chevre_groups(id) ON DELETE CASCADE,
  word_id        UUID    NOT NULL REFERENCES words(id) ON DELETE CASCADE,
  date           DATE    NOT NULL DEFAULT CURRENT_DATE,
  hider_id       UUID    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seeker_results JSONB   NOT NULL DEFAULT '{}',
  hider_won      BOOLEAN,   -- NULL until round concludes
  UNIQUE (group_id, date)
);

-- ─── Indexes ────────────────────────────────────────────────
CREATE INDEX idx_game_results_user_id    ON game_results(user_id);
CREATE INDEX idx_game_results_word_id    ON game_results(word_id);
CREATE INDEX idx_game_results_created   ON game_results(created_at DESC);
CREATE INDEX idx_words_date_source      ON words(date, source);
CREATE INDEX idx_nemesis_scores_rivalry ON nemesis_scores(rivalry_id);
CREATE INDEX idx_nemesis_rivals_users   ON nemesis_rivalries(challenger_id, receiver_id);
CREATE INDEX idx_chevre_members_group   ON chevre_members(group_id);
CREATE INDEX idx_chevre_members_user    ON chevre_members(user_id);
CREATE INDEX idx_chevre_scores_gd       ON chevre_scores(group_id, date DESC);

-- ─── Leaderboard Views ──────────────────────────────────────

-- Daily ranking for the global word
CREATE VIEW leaderboard_global AS
SELECT
  gr.user_id,
  u.username,
  u.avatar_url,
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

-- All-time cumulative stats per player
CREATE VIEW leaderboard_alltime AS
SELECT
  user_id,
  username,
  avatar_url,
  COUNT(*)                                              AS total_games,
  COUNT(*) FILTER (WHERE solved)                        AS total_wins,
  ROUND(AVG(guesses) FILTER (WHERE solved), 2)          AS avg_guesses,
  ROUND(AVG(duration_seconds) FILTER (WHERE solved), 1) AS avg_duration_seconds,
  RANK() OVER (ORDER BY COUNT(*) FILTER (WHERE solved) DESC) AS rank
FROM leaderboard_global
GROUP BY user_id, username, avatar_url;

-- Head-to-head summary per nemesis rivalry
CREATE VIEW nemesis_summary AS
SELECT
  nr.id                                                    AS rivalry_id,
  nr.challenger_id,
  uc.username                                              AS challenger_username,
  nr.receiver_id,
  ur.username                                              AS receiver_username,
  nr.status,
  COUNT(ns.id)                                             AS rounds_played,
  COUNT(ns.id) FILTER (WHERE ns.winner_id = nr.challenger_id) AS challenger_wins,
  COUNT(ns.id) FILTER (WHERE ns.winner_id = nr.receiver_id)   AS receiver_wins,
  COUNT(ns.id) FILTER (WHERE ns.winner_id IS NULL)            AS draws
FROM nemesis_rivalries nr
JOIN  users uc ON uc.id = nr.challenger_id
JOIN  users ur ON ur.id = nr.receiver_id
LEFT JOIN nemesis_scores ns ON ns.rivalry_id = nr.id
GROUP BY nr.id, nr.challenger_id, uc.username, nr.receiver_id, ur.username, nr.status;

-- ─── Trigger: auto-create user profile on auth signup ───────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ─── Trigger: auto-compute nemesis winner ───────────────────
-- Runs BEFORE INSERT/UPDATE on nemesis_scores.
-- Applies full tiebreaker algorithm from CLAUDE.md:
--   1. Fewer guesses wins
--   2. Fewer total revealed letters wins  (precomputed in game_results)
--   3. Fewer green letters before final guess (requires scan of guess_history)
--   4. Faster time wins
--   5. Both get the point (winner_id = NULL, draw)
CREATE OR REPLACE FUNCTION public.compute_nemesis_winner()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  c game_results%ROWTYPE;
  r game_results%ROWTYPE;
  c_revealed_count INT;
  r_revealed_count INT;
  c_greens_before  INT;
  r_greens_before  INT;
BEGIN
  -- Wait until both results are submitted
  IF NEW.challenger_result_id IS NULL OR NEW.receiver_result_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO c FROM game_results WHERE id = NEW.challenger_result_id;
  SELECT * INTO r FROM game_results WHERE id = NEW.receiver_result_id;

  -- Neither solved → draw
  IF NOT c.solved AND NOT r.solved THEN
    NEW.winner_id := NULL;
    RETURN NEW;
  END IF;

  -- Only one solved
  IF c.solved AND NOT r.solved THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r.solved AND NOT c.solved THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Tier 1: fewer guesses
  IF c.guesses < r.guesses THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r.guesses < c.guesses THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Tier 2: fewer total revealed letters (correct + present across all guesses)
  c_revealed_count := (
    jsonb_array_length(c.revealed_letters->'correct') +
    jsonb_array_length(c.revealed_letters->'present')
  );
  r_revealed_count := (
    jsonb_array_length(r.revealed_letters->'correct') +
    jsonb_array_length(r.revealed_letters->'present')
  );

  NEW.tiebreaker_applied := true;

  IF c_revealed_count < r_revealed_count THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r_revealed_count < c_revealed_count THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Tier 3: fewer greens revealed before final guess
  -- Count 'correct' tiles in all but last guess row
  SELECT
    COALESCE(SUM(
      (SELECT COUNT(*) FROM jsonb_array_elements_text(elem->'result') s WHERE s = 'correct')
    ), 0)
  INTO c_greens_before
  FROM jsonb_array_elements(c.guess_history) WITH ORDINALITY AS t(elem, ord)
  WHERE ord < jsonb_array_length(c.guess_history);

  SELECT
    COALESCE(SUM(
      (SELECT COUNT(*) FROM jsonb_array_elements_text(elem->'result') s WHERE s = 'correct')
    ), 0)
  INTO r_greens_before
  FROM jsonb_array_elements(r.guess_history) WITH ORDINALITY AS t(elem, ord)
  WHERE ord < jsonb_array_length(r.guess_history);

  IF c_greens_before < r_greens_before THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF r_greens_before < c_greens_before THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Tier 4: faster time
  IF COALESCE(c.duration_seconds, 999999) < COALESCE(r.duration_seconds, 999999) THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF COALESCE(r.duration_seconds, 999999) < COALESCE(c.duration_seconds, 999999) THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- Tier 5: draw
  NEW.winner_id := NULL;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_nemesis_winner
  BEFORE INSERT OR UPDATE ON nemesis_scores
  FOR EACH ROW EXECUTE PROCEDURE public.compute_nemesis_winner();

-- ─── Row Level Security ─────────────────────────────────────
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE words              ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE nemesis_rivalries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE nemesis_scores     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chevre_groups      ENABLE ROW LEVEL SECURITY;
ALTER TABLE chevre_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE chevre_scores      ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_read_all"   ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- Words: global words are public; nemesis/chevre restricted to participants
CREATE POLICY "words_global_read" ON words FOR SELECT
  USING (source = 'daily_global');

CREATE POLICY "words_nemesis_read" ON words FOR SELECT
  USING (
    source = 'nemesis'
    AND (created_by = auth.uid() OR for_user = auth.uid())
  );

CREATE POLICY "words_chevre_read" ON words FOR SELECT
  USING (
    source = 'chevre'
    AND EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = words.for_group AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "words_insert_auth" ON words FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Game results: publicly readable (needed for leaderboard); own-only write
CREATE POLICY "results_read_all"   ON game_results FOR SELECT USING (true);
CREATE POLICY "results_insert_own" ON game_results FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "results_update_own" ON game_results FOR UPDATE
  USING (auth.uid() = user_id);

-- Nemesis rivalries
CREATE POLICY "nemesis_read_participant" ON nemesis_rivalries FOR SELECT
  USING (auth.uid() IN (challenger_id, receiver_id));
CREATE POLICY "nemesis_insert_challenger" ON nemesis_rivalries FOR INSERT
  WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "nemesis_update_receiver" ON nemesis_rivalries FOR UPDATE
  USING (auth.uid() = receiver_id);

CREATE POLICY "nemesis_scores_read" ON nemesis_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nemesis_rivalries nr
      WHERE nr.id = nemesis_scores.rivalry_id
        AND auth.uid() IN (nr.challenger_id, nr.receiver_id)
    )
  );

-- Chevre groups
CREATE POLICY "chevre_groups_read_member" ON chevre_groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_groups.id AND cm.user_id = auth.uid()
    )
  );
CREATE POLICY "chevre_groups_insert_auth" ON chevre_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "chevre_groups_update_admin" ON chevre_groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_groups.id
        AND cm.user_id = auth.uid()
        AND cm.role = 'admin'
    )
  );

CREATE POLICY "chevre_members_read_member" ON chevre_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm2
      WHERE cm2.group_id = chevre_members.group_id AND cm2.user_id = auth.uid()
    )
  );
CREATE POLICY "chevre_members_insert_self" ON chevre_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "chevre_members_delete_self" ON chevre_members FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "chevre_scores_read_member" ON chevre_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chevre_members cm
      WHERE cm.group_id = chevre_scores.group_id AND cm.user_id = auth.uid()
    )
  );
