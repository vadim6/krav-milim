-- Fix mutable search_path on functions that were missing SET search_path = public.
-- Without this, a malicious role could shadow public schema objects.

CREATE OR REPLACE FUNCTION public.compute_nemesis_winner()
RETURNS trigger LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  c game_results%ROWTYPE;
  r game_results%ROWTYPE;
BEGIN
  -- Wait until both results are submitted
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

  -- Tier 3: faster time (tiebreaker)
  NEW.tiebreaker_applied := true;

  IF COALESCE(c.duration_seconds, 999999) < COALESCE(r.duration_seconds, 999999) THEN
    NEW.winner_id := c.user_id; RETURN NEW;
  END IF;
  IF COALESCE(r.duration_seconds, 999999) < COALESCE(c.duration_seconds, 999999) THEN
    NEW.winner_id := r.user_id; RETURN NEW;
  END IF;

  -- True draw
  NEW.winner_id := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.pick_daily_word()
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE words
  SET date = CURRENT_DATE + 1
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.pick_word_for_date(target_date date)
RETURNS void LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE words
  SET date = target_date
  WHERE id = (
    SELECT id FROM words
    WHERE source = 'daily_global'
      AND date IS NULL
    ORDER BY RANDOM()
    LIMIT 1
  );
END;
$$;
