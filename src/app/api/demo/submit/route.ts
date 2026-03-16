import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { evaluateGuess, buildRevealedLetters } from "@/lib/game/engine"
import { isHebrewWord, normalizeWord } from "@/lib/game/hebrew"
import { isValidWord } from "@/lib/game/wordlist"
import { WORD_LENGTH, MAX_GUESSES } from "@/lib/game/constants"
import type { GuessHistoryEntry, TileState } from "@/types/shared"

interface SubmitBody {
  wordId:          string
  guess:           string
  previousHistory: GuessHistoryEntry[]
}

/**
 * POST /api/demo/submit
 * Evaluates a demo guess server-side without requiring auth or saving to DB.
 */
export async function POST(request: Request) {
  let body: SubmitBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { wordId, guess, previousHistory } = body

  if (!wordId || !guess || typeof guess !== "string") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  if (normalizeWord(guess).length !== WORD_LENGTH || !isHebrewWord(guess)) {
    return NextResponse.json({ error: "Invalid guess" }, { status: 422 })
  }
  if (!isValidWord(guess)) {
    return NextResponse.json({ error: "Not in word list" }, { status: 422 })
  }
  if (previousHistory.length >= MAX_GUESSES) {
    return NextResponse.json({ error: "Game already over" }, { status: 409 })
  }

  const serviceClient = createServiceClient()

  const { data: word, error: wordError } = await serviceClient
    .from("words")
    .select("word")
    .eq("id", wordId)
    .single()

  if (wordError || !word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 })
  }

  const result: TileState[] = evaluateGuess(guess, word.word)
  const solved = result.every((s) => s === "correct")
  const newHistory: GuessHistoryEntry[] = [...previousHistory, { guess, result }]
  buildRevealedLetters(newHistory) // compute but don't store
  const guessCount = newHistory.length
  const isLastGuess = guessCount >= MAX_GUESSES
  const gameOver = solved || isLastGuess

  return NextResponse.json({
    result,
    solved,
    gameOver,
    answer: gameOver ? word.word : undefined,
  })
}
