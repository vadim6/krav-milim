/**
 * Core game engine — pure functions, no side effects.
 */
import type { TileState, GuessHistoryEntry, RevealedLetters } from "@/types/shared"
import { normalizeWord } from "./hebrew"
import { WORD_LENGTH } from "./constants"

/**
 * Evaluate a guess against the answer.
 * Both inputs are normalized (final forms → base forms) before comparison.
 *
 * Algorithm (matches standard Wordle rules):
 *   1. Mark exact matches as "correct".
 *   2. For remaining positions, mark letters that appear elsewhere as "present",
 *      consuming each answer letter at most once.
 *   3. Everything else is "absent".
 */
export function evaluateGuess(guess: string, answer: string): TileState[] {
  const g = normalizeWord(guess).split("")
  const a = normalizeWord(answer).split("")

  const result: TileState[] = Array(WORD_LENGTH).fill("absent")
  const answerPool = [...a]

  // Pass 1: exact matches
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (g[i] === a[i]) {
      result[i] = "correct"
      answerPool[i] = ""  // consume
    }
  }

  // Pass 2: present letters
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue
    const idx = answerPool.indexOf(g[i])
    if (idx !== -1) {
      result[i] = "present"
      answerPool[idx] = ""  // consume
    }
  }

  return result
}

/**
 * Returns true if `word` exists in the provided dictionary set.
 * Normalizes the word before lookup.
 */
export function isValidWord(word: string, dictionary: Set<string>): boolean {
  return dictionary.has(normalizeWord(word))
}

/**
 * Build revealed-letter state from accumulated guess history.
 * A letter's strongest state wins: correct > present > absent.
 */
export function buildRevealedLetters(history: GuessHistoryEntry[]): RevealedLetters {
  const correct = new Set<string>()
  const present = new Set<string>()
  const absent  = new Set<string>()

  for (const { guess, result } of history) {
    const letters = normalizeWord(guess).split("")
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i]
      if (result[i] === "correct") {
        correct.add(letter)
        present.delete(letter)
        absent.delete(letter)
      } else if (result[i] === "present" && !correct.has(letter)) {
        present.add(letter)
        absent.delete(letter)
      } else if (!correct.has(letter) && !present.has(letter)) {
        absent.add(letter)
      }
    }
  }

  return {
    correct: [...correct],
    present: [...present],
    absent:  [...absent],
  }
}

/**
 * Count total revealed letters (correct + present) across a result.
 * Used for tiebreaker tier 2.
 */
export function countRevealedLetters(revealed: RevealedLetters): number {
  return revealed.correct.length + revealed.present.length
}

/**
 * Count green (correct) tiles in all guesses except the final one.
 * Used for tiebreaker tier 3.
 */
export function countGreensBeforeFinal(history: GuessHistoryEntry[]): number {
  if (history.length <= 1) return 0
  return history
    .slice(0, -1)
    .flatMap((h) => h.result)
    .filter((s) => s === "correct").length
}
