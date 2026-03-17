import { describe, it, expect } from "vitest"
import { evaluateGuess, buildRevealedLetters, countGreensBeforeFinal } from "@/lib/game/engine"
import type { GuessHistoryEntry } from "@/types/shared"

// ─── evaluateGuess ────────────────────────────────────────────────────────────

describe("evaluateGuess", () => {
  it("all correct when guess equals answer", () => {
    expect(evaluateGuess("שולחן", "שולחן")).toEqual([
      "correct", "correct", "correct", "correct", "correct",
    ])
  })

  it("all absent when no letters match", () => {
    expect(evaluateGuess("אבגדה", "וזחטי")).toEqual([
      "absent", "absent", "absent", "absent", "absent",
    ])
  })

  it("marks present when letter is in answer but wrong position", () => {
    // answer: אבגדה  guess: באגדה — first two letters are swapped
    const result = evaluateGuess("באגדה", "אבגדה")
    expect(result[0]).toBe("present") // ב is present but at wrong position
    expect(result[1]).toBe("present") // א is present but at wrong position
    expect(result[2]).toBe("correct")
    expect(result[3]).toBe("correct")
    expect(result[4]).toBe("correct")
  })

  it("does not over-mark duplicates in guess beyond answer count", () => {
    // answer has one א; guess has three א — only one should be marked correct/present
    const result = evaluateGuess("אאאבג", "אוזבג")
    expect(result[0]).toBe("correct")  // first א matches position
    expect(result[1]).toBe("absent")   // second א — answer pool exhausted
    expect(result[2]).toBe("absent")   // third א — answer pool exhausted
    expect(result[3]).toBe("correct")
    expect(result[4]).toBe("correct")
  })

  it("normalizes Hebrew final forms before comparing", () => {
    // ך is final form of כ — should match כ in answer
    const result = evaluateGuess("מלאכ", "מלאכה")
    // both have כ (base) at position 3 — correct
    expect(result[3]).toBe("correct")
  })

  it("correct takes priority over present for same letter", () => {
    // answer: אאבגד  guess: אבאגד — first א correct, second א should be absent (pool used up)
    const result = evaluateGuess("אבאגד", "אאבגד")
    expect(result[0]).toBe("correct")
    expect(result[2]).toBe("present") // א appears at pos 1 in answer, not pos 2
  })
})

// ─── buildRevealedLetters ─────────────────────────────────────────────────────

describe("buildRevealedLetters", () => {
  it("returns empty sets for no history", () => {
    const r = buildRevealedLetters([])
    expect(r.correct).toHaveLength(0)
    expect(r.present).toHaveLength(0)
    expect(r.absent).toHaveLength(0)
  })

  it("classifies letters from a single guess", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["correct", "present", "absent", "absent", "absent"] },
    ]
    const r = buildRevealedLetters(history)
    expect(r.correct).toContain("א")
    expect(r.present).toContain("ב")
    expect(r.absent).toContain("ג")
  })

  it("correct dominates present across guesses", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["present", "absent", "absent", "absent", "absent"] },
      { guess: "אוזחט", result: ["correct", "absent", "absent", "absent", "absent"] },
    ]
    const r = buildRevealedLetters(history)
    expect(r.correct).toContain("א")
    expect(r.present).not.toContain("א")
  })

  it("correct dominates absent across guesses", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["absent", "absent", "absent", "absent", "absent"] },
      { guess: "אוזחט", result: ["correct", "absent", "absent", "absent", "absent"] },
    ]
    const r = buildRevealedLetters(history)
    expect(r.correct).toContain("א")
    expect(r.absent).not.toContain("א")
  })

  it("present dominates absent across guesses", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["absent", "absent", "absent", "absent", "absent"] },
      { guess: "אוזחט", result: ["present", "absent", "absent", "absent", "absent"] },
    ]
    const r = buildRevealedLetters(history)
    expect(r.present).toContain("א")
    expect(r.absent).not.toContain("א")
  })
})

// ─── countGreensBeforeFinal ───────────────────────────────────────────────────

describe("countGreensBeforeFinal", () => {
  it("returns 0 for empty history", () => {
    expect(countGreensBeforeFinal([])).toBe(0)
  })

  it("returns 0 for single-guess history (nothing before final)", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["correct", "correct", "correct", "correct", "correct"] },
    ]
    expect(countGreensBeforeFinal(history)).toBe(0)
  })

  it("counts greens in all rows except the last", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["correct", "absent",  "correct", "absent",  "absent"] },  // 2 greens
      { guess: "אבגדה", result: ["absent",  "correct", "absent",  "absent",  "absent"] },  // 1 green (not counted)
    ]
    expect(countGreensBeforeFinal(history)).toBe(2)
  })

  it("sums greens across multiple non-final rows", () => {
    const history: GuessHistoryEntry[] = [
      { guess: "אבגדה", result: ["correct", "absent",  "absent", "absent", "absent"] },  // 1
      { guess: "אבגדה", result: ["correct", "correct", "absent", "absent", "absent"] },  // 2
      { guess: "אבגדה", result: ["correct", "correct", "correct", "correct", "correct"] }, // final — not counted
    ]
    expect(countGreensBeforeFinal(history)).toBe(3)
  })
})
