/**
 * Nemesis rivalry scoring logic (app-layer, for display/preview).
 * Authoritative scoring happens in the DB trigger (compute_nemesis_winner).
 */
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"
import { countRevealedLetters, countGreensBeforeFinal } from "@/lib/game/engine"

export interface PlayerResult {
  userId:          string
  solved:          boolean
  guesses:         number
  revealedLetters: RevealedLetters
  guessHistory:    GuessHistoryEntry[]
}

export type TiebreakerTier = 1 | 2 | 3 | 4

export interface NemesisOutcome {
  winnerId:          string | null   // null = draw
  tiebreakerTier:    TiebreakerTier | null
}

/**
 * Apply the full tiebreaker algorithm from the spec.
 * Mirrors the DB trigger logic so the UI can preview outcomes.
 */
export function computeNemesisOutcome(
  a: PlayerResult,
  b: PlayerResult,
): NemesisOutcome {
  // Neither solved → draw
  if (!a.solved && !b.solved) return { winnerId: null, tiebreakerTier: null }

  // Only one solved
  if (a.solved && !b.solved) return { winnerId: a.userId, tiebreakerTier: null }
  if (b.solved && !a.solved) return { winnerId: b.userId, tiebreakerTier: null }

  // Tier 1: fewer guesses
  if (a.guesses < b.guesses) return { winnerId: a.userId, tiebreakerTier: 1 }
  if (b.guesses < a.guesses) return { winnerId: b.userId, tiebreakerTier: 1 }

  // Tier 2: fewer total revealed letters
  const aRevealed = countRevealedLetters(a.revealedLetters)
  const bRevealed = countRevealedLetters(b.revealedLetters)
  if (aRevealed < bRevealed) return { winnerId: a.userId, tiebreakerTier: 2 }
  if (bRevealed < aRevealed) return { winnerId: b.userId, tiebreakerTier: 2 }

  // Tier 3: fewer greens before final guess
  const aGreens = countGreensBeforeFinal(a.guessHistory)
  const bGreens = countGreensBeforeFinal(b.guessHistory)
  if (aGreens < bGreens) return { winnerId: a.userId, tiebreakerTier: 3 }
  if (bGreens < aGreens) return { winnerId: b.userId, tiebreakerTier: 3 }

  // Tier 4: draw
  return { winnerId: null, tiebreakerTier: 4 }
}
