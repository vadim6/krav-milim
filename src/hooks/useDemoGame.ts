"use client"

import { useReducer, useCallback, useRef, useEffect } from "react"
import type { GameState, GameAction } from "@/types/game"
import type { GuessHistoryEntry, TileState } from "@/types/shared"
import { buildRevealedLetters } from "@/lib/game/engine"
import { WORD_LENGTH, MAX_GUESSES } from "@/lib/game/constants"
import { normalizeWord } from "@/lib/game/hebrew"

function emptyRevealed() {
  return { correct: [], present: [], absent: [] }
}

function gameStateKey(wordId: string) {
  return `demo-game-${wordId}`
}

function freshState(wordId: string): GameState {
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

type ExtendedAction = GameAction | { type: "RESTORE"; payload: GameState }

function reducer(state: GameState, action: ExtendedAction): GameState {
  switch (action.type) {
    case "RESTORE":
      return action.payload

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
      const newGuesses  = [...state.guesses, entry]
      const newRevealed = buildRevealedLetters(newGuesses)
      const solved      = action.result.every((s: TileState) => s === "correct")
      const lost        = !solved && newGuesses.length >= MAX_GUESSES
      return {
        ...state,
        currentGuess:    "",
        guesses:         newGuesses,
        revealedLetters: newRevealed,
        gameStatus:      solved ? "won" : lost ? "lost" : "playing",
        isRevealing:     true,
        answer:          action.answer ?? state.answer,
        streakData:      null,
      }
    }

    case "SET_INVALID":            return { ...state, invalidGuess: true }
    case "CLEAR_INVALID":          return { ...state, invalidGuess: false }
    case "SET_NOT_IN_WORD_LIST":   return { ...state, notInWordList: true }
    case "CLEAR_NOT_IN_WORD_LIST": return { ...state, notInWordList: false }
    case "SET_REVEALING":          return { ...state, isRevealing: action.value }
    case "SET_WON":                return { ...state, gameStatus: "won" }
    case "SET_LOST":               return { ...state, gameStatus: "lost" }
    default:                       return state
  }
}

const DEMO_RESULT_KEY = "demo-result"

export function useDemoGame(wordId: string) {
  // Always start with empty state (matches SSR) — restore from localStorage after mount
  const [state, dispatch] = useReducer(reducer, null, () => freshState(wordId))
  const isSubmittingRef = useRef(false)

  // Restore saved game state after first client render to avoid SSR/hydration mismatch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(gameStateKey(wordId))
      if (!raw) return
      const { guesses, answer } = JSON.parse(raw) as {
        guesses: GuessHistoryEntry[]
        answer:  string | null
      }
      if (!guesses?.length) return
      const solved = guesses[guesses.length - 1].result.every(s => s === "correct")
      const lost   = !solved && guesses.length >= MAX_GUESSES
      dispatch({
        type: "RESTORE",
        payload: {
          wordId,
          currentGuess:      "",
          guesses,
          revealedLetters:   buildRevealedLetters(guesses),
          gameStatus:        solved ? "won" : lost ? "lost" : "playing",
          isRevealing:       false,
          invalidGuess:      false,
          notInWordList:     false,
          hardModeViolation: null,
          answer,
          streakData:        null,
        },
      })
    } catch { /* ignore corrupt data */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordId])

  // Persist guesses + answer to localStorage after every guess
  useEffect(() => {
    if (state.guesses.length === 0) return
    localStorage.setItem(
      gameStateKey(wordId),
      JSON.stringify({ guesses: state.guesses, answer: state.answer }),
    )
  }, [state.guesses, state.answer, wordId])

  // Keep sessionStorage demo-result in sync for the leaderboard ghost row
  useEffect(() => {
    if (state.gameStatus === "playing") return
    sessionStorage.setItem(
      DEMO_RESULT_KEY,
      JSON.stringify({ guesses: state.guesses.length, solved: state.gameStatus === "won" }),
    )
  }, [state.gameStatus, state.guesses.length])

  const submitGuess = useCallback(async () => {
    if (isSubmittingRef.current) return
    const guess = state.currentGuess
    if (normalizeWord(guess).length !== WORD_LENGTH) {
      dispatch({ type: "SET_INVALID" })
      setTimeout(() => dispatch({ type: "CLEAR_INVALID" }), 500)
      return
    }

    isSubmittingRef.current = true
    const res = await fetch("/api/demo/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wordId,
        guess,
        previousHistory: state.guesses,
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

    const { result, answer } = await res.json()
    dispatch({ type: "SUBMIT_GUESS", result, answer })

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
