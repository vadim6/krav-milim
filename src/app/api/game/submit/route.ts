import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
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
  startTime:       number   // Date.now() when first key was pressed
}

/**
 * POST /api/game/submit
 * Validates a guess server-side (answer never leaves the server),
 * updates or creates the game_result row, and returns tile states.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: SubmitBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { wordId, guess, previousHistory, startTime } = body

  // Basic input validation
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

  // Fetch the answer using the service role (bypasses RLS)
  const serviceClient = createServiceClient()

  const { data: word, error: wordError } = await serviceClient
    .from("words")
    .select("word, source")
    .eq("id", wordId)
    .single()

  if (wordError || !word) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 })
  }

  const result: TileState[] = evaluateGuess(guess, word.word)
  const solved = result.every((s) => s === "correct")
  const newHistory: GuessHistoryEntry[] = [...previousHistory, { guess, result }]
  const revealedLetters = buildRevealedLetters(newHistory)
  const guessCount = newHistory.length
  const isLastGuess = guessCount >= MAX_GUESSES
  const durationSeconds = Math.round((Date.now() - startTime) / 1000)

  // Upsert game result and get back the row ID
  const { data: upserted, error: upsertError } = await supabase
    .from("game_results")
    .upsert(
      [{
        user_id:          user.id,
        word_id:          wordId,
        guesses:          guessCount,
        guess_history:    newHistory as unknown as import("@/types/database").Json,
        revealed_letters: revealedLetters as unknown as import("@/types/database").Json,
        solved:           solved || false,
        duration_seconds: (solved || isLastGuess) ? durationSeconds : null,
      }],
      { onConflict: "user_id,word_id" },
    )
    .select("id")
    .single()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // When game is over and the word is daily_global, record nemesis round scores
  if ((solved || isLastGuess) && word.source === "daily_global" && upserted) {
    await recordNemesisScores(user.id, wordId, upserted.id, serviceClient)
  }

  return NextResponse.json({
    result,
    solved,
    gameOver: solved || isLastGuess,
    answer:   (solved || isLastGuess) ? word.word : undefined,
  })
}

type ServiceClient = ReturnType<typeof createServiceClient>

/**
 * After a game ends, find all active nemesis rivalries for this user and upsert
 * a nemesis_scores row for (rivalry_id, word_id). The DB trigger computes the winner
 * automatically once both challenger_result_id and receiver_result_id are set.
 */
async function recordNemesisScores(
  userId:        string,
  wordId:        string,
  gameResultId:  string,
  service:       ServiceClient,
) {
  // Find active rivalries for this user
  const { data: rivalries } = await service
    .from("nemesis_rivalries")
    .select("id, challenger_id, receiver_id")
    .eq("status", "active")
    .or(`challenger_id.eq.${userId},receiver_id.eq.${userId}`)

  if (!rivalries?.length) return

  for (const rivalry of rivalries) {
    const isChallenger = rivalry.challenger_id === userId
    const updateField  = isChallenger ? "challenger_result_id" : "receiver_result_id"

    // Upsert: create row if not exists, or update my result_id if game was re-played (admin reset)
    await service
      .from("nemesis_scores")
      .upsert(
        [{
          rivalry_id: rivalry.id,
          word_id:    wordId,
          [updateField]: gameResultId,
        }],
        { onConflict: "rivalry_id,word_id", ignoreDuplicates: false },
      )
  }
}
