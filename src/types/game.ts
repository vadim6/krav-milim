import type { GuessHistoryEntry, RevealedLetters, TileState } from "./shared"

export type { TileState, GuessHistoryEntry, RevealedLetters }

export interface GameState {
  wordId:           string
  currentGuess:     string
  guesses:          GuessHistoryEntry[]
  revealedLetters:  RevealedLetters
  gameStatus:       "playing" | "won" | "lost"
  startTime:        number | null  // Date.now() on first keypress
  isRevealing:      boolean        // block input during flip animation
  invalidGuess:     boolean        // triggers row shake
  notInWordList:    boolean        // triggers "not in list" overlay
  answer:           string | null  // revealed after game ends
}

export type GameAction =
  | { type: "ADD_LETTER";   letter: string }
  | { type: "DELETE_LETTER" }
  | { type: "SUBMIT_GUESS"; result: TileState[]; answer?: string }
  | { type: "SET_INVALID" }
  | { type: "CLEAR_INVALID" }
  | { type: "SET_REVEALING"; value: boolean }
  | { type: "SET_WON" }
  | { type: "SET_LOST" }
  | { type: "SET_NOT_IN_WORD_LIST" }
  | { type: "CLEAR_NOT_IN_WORD_LIST" }
