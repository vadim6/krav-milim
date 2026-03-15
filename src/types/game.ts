import type { GuessHistoryEntry, RevealedLetters, TileState } from "./shared"

export type { TileState, GuessHistoryEntry, RevealedLetters }

export interface GameState {
  wordId:           string
  currentGuess:     string
  guesses:          GuessHistoryEntry[]
  revealedLetters:  RevealedLetters
  gameStatus:       "playing" | "won" | "lost"
  isRevealing:      boolean        // block input during flip animation
  invalidGuess:       boolean        // triggers row shake
  notInWordList:      boolean        // triggers "not in list" overlay
  hardModeViolation:  string | null  // triggers hard-mode toast with message
  answer:             string | null  // revealed after game ends
  streakData:         { currentStreak: number; bestStreak: number } | null
}

export type GameAction =
  | { type: "ADD_LETTER";   letter: string }
  | { type: "DELETE_LETTER" }
  | { type: "SUBMIT_GUESS"; result: TileState[]; answer?: string; streak?: { current_streak: number; best_streak: number } }
  | { type: "SET_INVALID" }
  | { type: "CLEAR_INVALID" }
  | { type: "SET_REVEALING"; value: boolean }
  | { type: "SET_WON" }
  | { type: "SET_LOST" }
  | { type: "SET_NOT_IN_WORD_LIST" }
  | { type: "CLEAR_NOT_IN_WORD_LIST" }
  | { type: "SET_HARD_MODE_VIOLATION"; message: string }
  | { type: "CLEAR_HARD_MODE_VIOLATION" }
