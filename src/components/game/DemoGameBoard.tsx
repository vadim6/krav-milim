"use client"

import { useState, useEffect } from "react"
import { useDemoGame } from "@/hooks/useDemoGame"
import GameRow from "./GameRow"
import HebrewKeyboard from "./HebrewKeyboard"
import GameStatus from "./GameStatus"
import type { StatusText } from "@/lib/game/statusTexts"
import { pickStatusText } from "@/lib/game/statusTexts"
import { MAX_GUESSES } from "@/lib/game/constants"
import { buildRevealedLetters } from "@/lib/game/engine"

interface Props {
  wordId: string
}

export default function DemoGameBoard({ wordId }: Props) {
  const { state, dispatch } = useDemoGame(wordId)
  const [statusDismissed, setStatusDismissed] = useState(false)
  const [statusText, setStatusText] = useState<StatusText | null>(null)

  const [tileSize, setTileSize] = useState(68)
  useEffect(() => {
    function compute() {
      const vh = window.visualViewport?.height ?? window.innerHeight
      const FIXED = 428
      setTileSize(Math.round(Math.min(68, Math.max(38, (vh - FIXED) / 6))))
    }
    compute()
    window.visualViewport?.addEventListener("resize", compute)
    return () => window.visualViewport?.removeEventListener("resize", compute)
  }, [])

  useEffect(() => {
    if (state.gameStatus === "playing") return
    setStatusText(pickStatusText(state.gameStatus as "won" | "lost", `krav-milim-demo-status-${wordId}`))
  }, [state.gameStatus, wordId])

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
      <div className="relative flex flex-col gap-1" role="grid" aria-label="לוח המשחק">
        {state.notInWordList && (
          <div className="absolute left-1/2 -translate-x-1/2 top-0 z-50 pointer-events-none">
            <div className="rounded-lg bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 px-5 py-3 text-sm font-semibold shadow-lg animate-fade-in-out whitespace-nowrap">
              המילה אינה מופיעה ברשימת המילים
            </div>
          </div>
        )}

        {state.guesses.map((entry, i) => (
          <GameRow
            key={i}
            entry={entry}
            revealed
            animating={state.isRevealing && i === state.guesses.length - 1}
          />
        ))}

        {state.gameStatus === "playing" && (
          <GameRow current={state.currentGuess} invalid={state.invalidGuess || state.notInWordList} />
        )}

        {Array.from({ length: emptyRowCount }).map((_, i) => (
          <GameRow key={`empty-${i}`} />
        ))}

        {state.gameStatus !== "playing" && !statusDismissed && statusText && (
          <GameStatus
            status={state.gameStatus}
            guessCount={state.guesses.length}
            guessHistory={state.guesses}
            answer={state.answer}
            statusText={statusText}
            streakData={null}
            isDemo
            onDismiss={() => setStatusDismissed(true)}
          />
        )}
      </div>

      <HebrewKeyboard
        revealedLetters={state.revealedLetters}
        prevRevealedLetters={prevRevealedLetters}
        animatingEntry={animatingEntry}
        isRevealing={state.isRevealing}
        onKey={(key) => {
          if (state.gameStatus !== "playing" || state.isRevealing) return
          if (key === "ENTER") {
            dispatch({ type: "SUBMIT_GUESS", result: [] })
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
