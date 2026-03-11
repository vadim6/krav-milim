/**
 * App-level types — kept separate from database.ts so they survive
 * future `supabase gen types typescript` regenerations.
 */
import type { Database } from "./database"

// ── DB enum aliases ──────────────────────────────────────────
export type RivalryStatus = Database["public"]["Enums"]["rivalry_status"]
export type ChevreRole    = Database["public"]["Enums"]["chevre_role"]
export type WordSource    = Database["public"]["Enums"]["word_source"]

// ── Game tile states ─────────────────────────────────────────
export type TileState = "correct" | "present" | "absent" | "empty" | "tbd"

// ── JSONB shapes stored in game_results ──────────────────────

/** One row in the guess grid */
export interface GuessHistoryEntry {
  guess:  string       // 5-char Hebrew string
  result: TileState[]  // length 5
}

/** Precomputed letter knowledge for keyboard colouring */
export interface RevealedLetters {
  correct: string[]
  present: string[]
  absent:  string[]
}

// ── Chevre JSONB shapes ──────────────────────────────────────
export interface SeekerResult {
  solved:           boolean
  guesses:          number
  duration_seconds: number | null
}

// ── View row convenience types ───────────────────────────────
export type LeaderboardGlobalRow  = Database["public"]["Views"]["leaderboard_global"]["Row"]
export type LeaderboardAlltimeRow = Database["public"]["Views"]["leaderboard_alltime"]["Row"]
export type NemesisSummaryRow     = Database["public"]["Views"]["nemesis_summary"]["Row"]
