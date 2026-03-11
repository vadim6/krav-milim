"use client"

import { useReducer, useCallback } from "react"
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
): GameState {
  if (existing) {
    const gameStatus = existing.solved
      ? "won"
      : existing.guess_history.length >= MAX_GUESSES
        ? "lost"
        : "playing"
    return {
      wordId,
      currentGuess:    "",
      guesses:         existing.guess_history,
      revealedLetters: existing.revealed_letters,
      gameStatus,
      startTime:       null,
      isRevealing:     false,
      invalidGuess:    false,
    }
  }
  return {
    wordId,
    currentGuess:    "",
    guesses:         [],
    revealedLetters: emptyRevealed(),
    gameStatus:      "playing",
    startTime:       null,
    isRevealing:     false,
    invalidGuess:    false,
  }
}

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "ADD_LETTER": {
      if (state.currentGuess.length >= WORD_LENGTH) return state
      const startTime = state.startTime ?? Date.now()
      return { ...state, currentGuess: state.currentGuess + action.letter, startTime }
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
      }
    }

    case "SET_INVALID":
      return { ...state, invalidGuess: true }

    case "CLEAR_INVALID":
      return { ...state, invalidGuess: false }

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
  duration_seconds: number | null
}

export function useGame(wordId: string, existing: ExistingResult | null) {
  const [state, dispatch] = useReducer(reducer, null, () =>
    initialState(wordId, existing),
  )

  const submitGuess = useCallback(async () => {
    const guess = state.currentGuess
    if (normalizeWord(guess).length !== WORD_LENGTH) {
      dispatch({ type: "SET_INVALID" })
      setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 500)
      return
    }

    const res = await fetch("/api/game/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId,
        guess,
        previousHistory: state.guesses,
        startTime:       state.startTime ?? Date.now(),
      }),
    })

    if (!res.ok) {
      const { error } = await res.json()
      if (error === "Invalid guess") {
        dispatch({ type: "SET_INVALID" })
        setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 500)
      }
      return
    }

    const { result } = await res.json()
    dispatch({ type: "SUBMIT_GUESS", result })

    // Clear isRevealing after animation completes (300ms per tile × 5 + buffer)
    setTimeout(
      () => dispatch({ type: "SET_REVEALING", value: false }),
      WORD_LENGTH * 300 + 500,
    )
  }, [state, wordId])

  const handleDispatch = useCallback(
    (action: GameAction) => {
      if (action.type === "SUBMIT_GUESS") {
        submitGuess()
      } else {
        dispatch(action)
      }
    },
    [submitGuess],
  )

  return { state, dispatch: handleDispatch }
}
