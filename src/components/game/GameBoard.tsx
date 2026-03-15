"use client"

import { useState, useEffect } from "react"
import { useGame } from "@/hooks/useGame"
import GameRow from "./GameRow"
import HebrewKeyboard from "./HebrewKeyboard"
import GameStatus from "./GameStatus"
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"
import type { StatusText } from "@/lib/game/statusTexts"
import { WIN_TEXTS, LOSS_TEXTS } from "@/lib/game/statusTexts"
import { MAX_GUESSES } from "@/lib/game/constants"
import { buildRevealedLetters } from "@/lib/game/engine"

interface ExistingResult {
  id:               string
  solved:           boolean
  guesses:          number
  guess_history:    GuessHistoryEntry[]
  revealed_letters: RevealedLetters
  duration_seconds: number | null
}

interface Props {
  wordId:         string
  existingResult: ExistingResult | null
}

export default function GameBoard({ wordId, existingResult }: Props) {
  const { state, dispatch } = useGame(wordId, existingResult)
  const [statusDismissed, setStatusDismissed] = useState(false)
  const [statusText, setStatusText] = useState<StatusText | null>(null)

  // Dynamically size tiles and keyboard keys to fit the available viewport height.
  // Uses visualViewport so it reacts to mobile browser chrome appearing/disappearing.
  const [tileSize, setTileSize] = useState(68)
  useEffect(() => {
    function compute() {
      const vh = window.visualViewport?.height ?? window.innerHeight
      // Fixed overhead: navbar(56) + pt-6(24) + h1+gap(56) + row-gaps(20)
      //               + board-keyboard gap(8) + keyboard h-14 3rows+gaps(184) + pb-20(80)
      const FIXED = 428
      setTileSize(Math.round(Math.min(68, Math.max(38, (vh - FIXED) / 6))))
    }
    compute()
    window.visualViewport?.addEventListener("resize", compute)
    return () => window.visualViewport?.removeEventListener("resize", compute)
  }, [])

  // Track game-in-progress for the settings modal's hard-mode guard
  useEffect(() => {
    if (state.guesses.length > 0 && state.gameStatus === "playing") {
      localStorage.setItem("krav-milim-game-in-progress", "true")
    }
  }, [state.guesses.length, state.gameStatus])

  useEffect(() => {
    if (state.gameStatus === "won" || state.gameStatus === "lost") {
      localStorage.setItem("krav-milim-game-in-progress", "false")
    }
  }, [state.gameStatus])

  useEffect(() => {
    if (state.gameStatus === "playing") return
    const arr = state.gameStatus === "won" ? WIN_TEXTS : LOSS_TEXTS
    const lsKey = `krav-milim-status-${wordId}`
    const stored = localStorage.getItem(lsKey)
    if (stored !== null) {
      const idx = parseInt(stored, 10)
      if (!isNaN(idx) && idx < arr.length) { setStatusText(arr[idx]); return }
    }
    const idx = Math.floor(Math.random() * arr.length)
    localStorage.setItem(lsKey, String(idx))
    setStatusText(arr[idx])
  }, [state.gameStatus, wordId])

  // When revealing, compute the keyboard's "before" state so keys can stagger in sync with tiles
  const animatingEntry      = state.isRevealing ? state.guesses[state.guesses.length - 1] : undefined
  const prevRevealedLetters = state.isRevealing ? buildRevealedLetters(state.guesses.slice(0, -1)) : undefined

  const emptyRowCount = Math.max(
    0,
    MAX_GUESSES - state.guesses.length - (state.gameStatus === "playing" ? 1 : 0),
  )

  return (
    <div
      className="flex flex-col items-center gap-2 w-full"
      style={{ "--tile-size": `${tileSize}px` } as React.CSSProperties}
    >
      {/* Grid */}
      <div className="relative flex flex-col gap-1" role="grid" aria-label="לוח המשחק">
        {/* Toasts — float over the top of the board */}
        {(state.notInWordList || state.hardModeViolation) && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-50 pointer-events-none">
            {state.notInWordList && (
              <div className="rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg animate-fade-in-out whitespace-nowrap">
                המילה אינה מופיעה ברשימת המילים
              </div>
            )}
            {state.hardModeViolation && (
              <div
                className="rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg animate-fade-in-out whitespace-nowrap"
                dangerouslySetInnerHTML={{ __html: state.hardModeViolation }}
              />
            )}
          </div>
        )}
        {/* Completed rows */}
        {state.guesses.map((entry, i) => (
          <GameRow
            key={i}
            entry={entry}
            revealed
            animating={state.isRevealing && i === state.guesses.length - 1}
          />
        ))}

        {/* Current input row */}
        {state.gameStatus === "playing" && (
          <GameRow current={state.currentGuess} invalid={state.invalidGuess || state.notInWordList || !!state.hardModeViolation} />
        )}

        {/* Empty rows */}
        {Array.from({ length: emptyRowCount }).map((_, i) => (
          <GameRow key={`empty-${i}`} />
        ))}

        {/* Status overlay — rendered inside the grid so backdrop covers only the board */}
        {state.gameStatus !== "playing" && !statusDismissed && statusText && (
          <GameStatus
            status={state.gameStatus}
            guessCount={state.guesses.length}
            guessHistory={state.guesses}
            answer={state.answer}
            statusText={statusText}
            onDismiss={() => setStatusDismissed(true)}
          />
        )}
      </div>

      {/* Keyboard */}
      <HebrewKeyboard
        revealedLetters={state.revealedLetters}
        prevRevealedLetters={prevRevealedLetters}
        animatingEntry={animatingEntry}
        isRevealing={state.isRevealing}
        onKey={(key) => {
          if (state.gameStatus !== "playing" || state.isRevealing) return
          if (key === "ENTER") {
            dispatch({ type: "SUBMIT_GUESS", result: [] }) // handled in hook
          } else if (key === "DELETE") {
            dispatch({ type: "DELETE_LETTER" })
          } else {
            dispatch({ type: "ADD_LETTER", letter: key })
          }
        }}
      />
    </div>
  )
}
