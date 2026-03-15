-- ============================================================
-- Add missing indexes on foreign key columns
-- and drop the unused game_results created_at index.
-- ============================================================

-- words
CREATE INDEX idx_words_created_by ON words(created_by);
CREATE INDEX idx_words_for_user   ON words(for_user);
CREATE INDEX idx_words_for_group  ON words(for_group);

-- chevre_groups
CREATE INDEX idx_chevre_groups_created_by ON chevre_groups(created_by);

-- chevre_scores
CREATE INDEX idx_chevre_scores_hider_id ON chevre_scores(hider_id);
CREATE INDEX idx_chevre_scores_word_id  ON chevre_scores(word_id);

-- nemesis_rivalries (receiver_id — challenger_id already covered by unique index)
CREATE INDEX idx_nemesis_rivalries_receiver ON nemesis_rivalries(receiver_id);

-- nemesis_scores
CREATE INDEX idx_nemesis_scores_challenger_result ON nemesis_scores(challenger_result_id);
CREATE INDEX idx_nemesis_scores_receiver_result   ON nemesis_scores(receiver_result_id);
CREATE INDEX idx_nemesis_scores_winner            ON nemesis_scores(winner_id);
CREATE INDEX idx_nemesis_scores_word_id           ON nemesis_scores(word_id);

-- Drop unused index (no queries order game_results by created_at)
DROP INDEX IF EXISTS idx_game_results_created;
