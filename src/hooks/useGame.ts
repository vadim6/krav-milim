"use client"

import { useReducer, useCallback, useRef } from "react"
import type { GameState, GameAction } from "@/types/game"
import type { GuessHistoryEntry, RevealedLetters, TileState } from "@/types/shared"
import { buildRevealedLetters } from "@/lib/game/engine"
import { WORD_LENGTH, MAX_GUESSES } from "@/lib/game/constants"
import { normalizeWord } from "@/lib/game/hebrew"

function emptyRevealed(): RevealedLetters {
  return { correct: [], present: [], absent: [] }
}

function initialState(
  wordId: string,
  existing: {
    solved: boolean
    guess_history: GuessHistoryEntry[]
    revealed_letters: RevealedLetters
  } | null,
  initialStreakData: { currentStreak: number; bestStreak: number } | null,
): GameState {
  if (existing) {
    const gameStatus = existing.solved
      ? "won"
      : existing.guess_history.length >= MAX_GUESSES
        ? "lost"
        : "playing"
    return {
      wordId,
      currentGuess:      "",
      guesses:           existing.guess_history,
      revealedLetters:   existing.revealed_letters,
      gameStatus,
      isRevealing:       false,
      invalidGuess:      false,
      notInWordList:     false,
      hardModeViolation: null,
      answer:            null,
      streakData:        initialStreakData,
    }
  }
  return {
    wordId,
    currentGuess:      "",
    guesses:           [],
    revealedLetters:   emptyRevealed(),
    gameStatus:        "playing",
    isRevealing:       false,
    invalidGuess:      false,
    notInWordList:     false,
    hardModeViolation: null,
    answer:            null,
    streakData:        null,
  }
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_LETTER": {
      if (state.currentGuess.length >= WORD_LENGTH) return state
      return { ...state, currentGuess: state.currentGuess + action.letter }
    }

    case "DELETE_LETTER":
      return { ...state, currentGuess: state.currentGuess.slice(0, -1) }

    case "SUBMIT_GUESS": {
      const entry: GuessHistoryEntry = {
        guess:  state.currentGuess,
        result: action.result,
      }
      const newGuesses        = [...state.guesses, entry]
      const newRevealed       = buildRevealedLetters(newGuesses)
      const solved            = action.result.every((s: TileState) => s === "correct")
      const lost              = !solved && newGuesses.length >= MAX_GUESSES
      return {
        ...state,
        currentGuess:    "",
        guesses:         newGuesses,
        revealedLetters: newRevealed,
        gameStatus:      solved ? "won" : lost ? "lost" : "playing",
        isRevealing:     true,
        answer:          action.answer ?? state.answer,
        streakData:      action.streak
          ? { currentStreak: action.streak.current_streak, bestStreak: action.streak.best_streak }
          : state.streakData,
      }
    }

    case "SET_INVALID":
      return { ...state, invalidGuess: true }

    case "CLEAR_INVALID":
      return { ...state, invalidGuess: false }

    case "SET_NOT_IN_WORD_LIST":
      return { ...state, notInWordList: true }

    case "CLEAR_NOT_IN_WORD_LIST":
      return { ...state, notInWordList: false }

    case "SET_HARD_MODE_VIOLATION":
      return { ...state, hardModeViolation: action.message }

    case "CLEAR_HARD_MODE_VIOLATION":
      return { ...state, hardModeViolation: null }

    case "SET_REVEALING":
      return { ...state, isRevealing: action.value }

    case "SET_WON":
      return { ...state, gameStatus: "won" }

    case "SET_LOST":
      return { ...state, gameStatus: "lost" }

    default:
      return state
  }
}

interface ExistingResult {
  solved:           boolean
  guess_history:    GuessHistoryEntry[]
  revealed_letters: RevealedLetters
}

export function useGame(
  wordId: string,
  existing: ExistingResult | null,
  initialStreakData: { currentStreak: number; bestStreak: number } | null = null,
) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    initialState(wordId, existing, initialStreakData),
  )
  const isSubmittingRef = useRef(false)

  const submitGuess = useCallback(async () => {
    if (isSubmittingRef.current) return
    const guess = state.currentGuess
    if (normalizeWord(guess).length !== WORD_LENGTH) {
      dispatch({ type: "SET_INVALID" })
      setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 500)
      return
    }

    // Hard mode validation
    const hardMode = localStorage.getItem("krav-milim-gibor-mode") === "true"
    if (hardMode && state.guesses.length > 0) {
      const normalized = normalizeWord(guess)
      for (const prev of state.guesses) {
        const prevNorm = normalizeWord(prev.guess)
        // Greens: must appear in the same position
        for (let i = 0; i < WORD_LENGTH; i++) {
          if (prev.result[i] === "correct" && normalized[i] !== prevNorm[i]) {
            const msg = `האות <strong>${prevNorm[i]}</strong> חייבת להיות במיקום <strong>${i + 1}</strong>`
            dispatch({ type: "SET_HARD_MODE_VIOLATION", message: msg })
            setTimeout(() => dispatch({ type: "CLEAR_HARD_MODE_VIOLATION" }), 2500)
            return
          }
        }
        // Yellows: must appear somewhere in the guess
        for (let i = 0; i < WORD_LENGTH; i++) {
          if (prev.result[i] === "present" && !normalized.includes(prevNorm[i])) {
            const msg = `הניחוש חייב לכלול את האות <strong>${prevNorm[i]}</strong>`
            dispatch({ type: "SET_HARD_MODE_VIOLATION", message: msg })
            setTimeout(() => dispatch({ type: "CLEAR_HARD_MODE_VIOLATION" }), 2500)
            return
          }
        }
      }
    }

    isSubmittingRef.current = true
    const res = await fetch("/api/game/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId,
        guess,
        previousHistory: state.guesses,
        hardMode,
      }),
    })

    if (!res.ok) {
      isSubmittingRef.current = false
      const { error } = await res.json()
      if (error === "Not in word list") {
        dispatch({ type: "SET_NOT_IN_WORD_LIST" })
        setTimeout(() => dispatch({ type: "CLEAR_NOT_IN_WORD_LIST" }), 2500)
      } else if (error === "Invalid guess") {
        dispatch({ type: "SET_INVALID" })
        setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 500)
      }
      return
    }

    const { result, answer, streak } = await res.json()
    dispatch({ type: "SUBMIT_GUESS", result, answer, streak })

    // Clear isRevealing after animation completes (300ms per tile × 5 + buffer)
    setTimeout(() => {
      dispatch({ type: "SET_REVEALING", value: false })
      isSubmittingRef.current = false
    }, WORD_LENGTH * 300 + 500)
  }, [state, wordId])

  const handleDispatch = useCallback(
    (action: GameAction) => {
      if (action.type === "SUBMIT_GUESS") {
        submitGuess()
      } else if (
        isSubmittingRef.current &&
        (action.type === "ADD_LETTER" || action.type === "DELETE_LETTER")
      ) {
        return
      } else {
        dispatch(action)
      }
    },
    [submitGuess],
  )

  return { state, dispatch: handleDispatch }
}
