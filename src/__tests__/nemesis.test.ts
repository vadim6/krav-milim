import { describe, it, expect } from "vitest"
import { computeNemesisOutcome } from "@/lib/rivalries/nemesis"
import type { PlayerResult } from "@/lib/rivalries/nemesis"
import type { TileState } from "@/types/shared"

function makePlayer(overrides: Partial<PlayerResult> & { userId: string }): PlayerResult {
  return {
    solved: true,
    guesses: 3,
    revealedLetters: { correct: [], present: [], absent: [] },
    guessHistory: [],
    ...overrides,
  }
}

describe("computeNemesisOutcome", () => {
  // ─── Neither solved ───────────────────────────────────────────────────────

  it("draw when neither player solved", () => {
    const a = makePlayer({ userId: "a", solved: false })
    const b = makePlayer({ userId: "b", solved: false })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: null, tiebreakerTier: null })
  })

  // ─── One solved ───────────────────────────────────────────────────────────

  it("a wins when only a solved", () => {
    const a = makePlayer({ userId: "a", solved: true })
    const b = makePlayer({ userId: "b", solved: false })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "a", tiebreakerTier: null })
  })

  it("b wins when only b solved", () => {
    const a = makePlayer({ userId: "a", solved: false })
    const b = makePlayer({ userId: "b", solved: true })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "b", tiebreakerTier: null })
  })

  // ─── Tier 1: fewer guesses ────────────────────────────────────────────────

  it("tier 1: a wins with fewer guesses", () => {
    const a = makePlayer({ userId: "a", guesses: 2 })
    const b = makePlayer({ userId: "b", guesses: 4 })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "a", tiebreakerTier: 1 })
  })

  it("tier 1: b wins with fewer guesses", () => {
    const a = makePlayer({ userId: "a", guesses: 5 })
    const b = makePlayer({ userId: "b", guesses: 3 })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "b", tiebreakerTier: 1 })
  })

  // ─── Tier 2: fewer revealed letters ──────────────────────────────────────

  it("tier 2: a wins with fewer revealed letters when guesses are equal", () => {
    const a = makePlayer({
      userId: "a",
      guesses: 3,
      revealedLetters: { correct: ["א"], present: ["ב"], absent: [] },
    })
    const b = makePlayer({
      userId: "b",
      guesses: 3,
      revealedLetters: { correct: ["א", "ג"], present: ["ב", "ד"], absent: [] },
    })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "a", tiebreakerTier: 2 })
  })

  it("tier 2: b wins with fewer revealed letters", () => {
    const a = makePlayer({
      userId: "a",
      guesses: 3,
      revealedLetters: { correct: ["א", "ב", "ג"], present: [], absent: [] },
    })
    const b = makePlayer({
      userId: "b",
      guesses: 3,
      revealedLetters: { correct: ["א"], present: [], absent: [] },
    })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "b", tiebreakerTier: 2 })
  })

  it("tier 2: only counts correct + present, not absent", () => {
    const a = makePlayer({
      userId: "a",
      guesses: 3,
      revealedLetters: { correct: ["א"], present: [], absent: ["ב", "ג", "ד"] },
    })
    const b = makePlayer({
      userId: "b",
      guesses: 3,
      revealedLetters: { correct: ["א", "ב"], present: [], absent: [] },
    })
    // a has 1 revealed, b has 2 — a wins
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "a", tiebreakerTier: 2 })
  })

  // ─── Tier 3: fewer greens before final guess ──────────────────────────────

  it("tier 3: a wins with fewer greens before final", () => {
    const a = makePlayer({
      userId: "a",
      guesses: 3,
      revealedLetters: { correct: ["א"], present: [], absent: [] },
      guessHistory: [
        { guess: "אבגדה", result: ["correct", "absent", "absent", "absent", "absent"] }, // 1 green before final
        { guess: "אוזחט", result: ["correct", "correct", "correct", "correct", "correct"] },
      ],
    })
    const b = makePlayer({
      userId: "b",
      guesses: 3,
      revealedLetters: { correct: ["א"], present: [], absent: [] },
      guessHistory: [
        { guess: "אבגדה", result: ["correct", "correct", "absent", "absent", "absent"] }, // 2 greens before final
        { guess: "אוזחט", result: ["correct", "correct", "correct", "correct", "correct"] },
      ],
    })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: "a", tiebreakerTier: 3 })
  })

  // ─── Tier 4: draw ─────────────────────────────────────────────────────────

  it("tier 4: draw when everything is equal", () => {
    const history = [
      { guess: "אבגדה", result: ["correct", "absent", "absent", "absent", "absent"] as TileState[] },
      { guess: "אוזחט", result: ["correct", "correct", "correct", "correct", "correct"] as TileState[] },
    ]
    const revealed = { correct: ["א"], present: [], absent: ["ב"] }
    const a = makePlayer({ userId: "a", guesses: 2, revealedLetters: revealed, guessHistory: history })
    const b = makePlayer({ userId: "b", guesses: 2, revealedLetters: revealed, guessHistory: history })
    expect(computeNemesisOutcome(a, b)).toEqual({ winnerId: null, tiebreakerTier: 4 })
  })
})
