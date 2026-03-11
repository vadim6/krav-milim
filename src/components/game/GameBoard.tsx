"use client"

import { useGame } from "@/hooks/useGame"
import GameRow from "./GameRow"
import HebrewKeyboard from "./HebrewKeyboard"
import GameStatus from "./GameStatus"
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"
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

  // When revealing, compute the keyboard's "before" state so keys can stagger in sync with tiles
  const animatingEntry      = state.isRevealing ? state.guesses[state.guesses.length - 1] : undefined
  const prevRevealedLetters = state.isRevealing ? buildRevealedLetters(state.guesses.slice(0, -1)) : undefined

  const emptyRowCount = Math.max(
    0,
    MAX_GUESSES - state.guesses.length - (state.gameStatus === "playing" ? 1 : 0),
  )

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Grid */}
      <div className="flex flex-col gap-1" role="grid" aria-label="לוח המשחק">
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
          <GameRow current={state.currentGuess} invalid={state.invalidGuess} />
        )}

        {/* Empty rows */}
        {Array.from({ length: emptyRowCount }).map((_, i) => (
          <GameRow key={`empty-${i}`} />
        ))}
      </div>

      {/* Status overlay */}
      {state.gameStatus !== "playing" && (
        <GameStatus
          status={state.gameStatus}
          guessCount={state.guesses.length}
          guessHistory={state.guesses}
        />
      )}

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
