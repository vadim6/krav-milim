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

  const { wordId, guess, previousHistory } = body

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

  // Upsert game result
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
      }],
      { onConflict: "user_id,word_id" },
    )
    .select("id")
    .single()

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  const gameOver = solved || isLastGuess

  let streakData: { current_streak: number; best_streak: number } | undefined
  if (gameOver && word.source === "daily_global") {
    streakData = await updateStreak(user.id, solved, serviceClient)
    if (upserted) {
      await recordNemesisScores(user.id, wordId, upserted.id, serviceClient)
    }
  }

  return NextResponse.json({
    result,
    solved,
    gameOver,
    answer:  gameOver ? word.word : undefined,
    streak:  streakData,
  })
}

type ServiceClient = ReturnType<typeof createServiceClient>

async function updateStreak(
  userId: string,
  solved: boolean,
  service: ServiceClient,
): Promise<{ current_streak: number; best_streak: number }> {
  if (!solved) {
    await service.from("users").update({ current_streak: 0 }).eq("id", userId)
    const { data } = await service.from("users").select("best_streak").eq("id", userId).single()
    return { current_streak: 0, best_streak: data?.best_streak ?? 0 }
  }

  const { data: userData } = await service
    .from("users")
    .select("current_streak, best_streak, last_solved_date")
    .eq("id", userId)
    .single()

  if (!userData) return { current_streak: 0, best_streak: 0 }

  const today      = new Date().toISOString().split("T")[0]
  const yesterday  = new Date(Date.now() - 86400000).toISOString().split("T")[0]
  const lastSolved = userData.last_solved_date as string | null

  let newStreak: number
  if (lastSolved === today) {
    newStreak = userData.current_streak
  } else if (lastSolved === yesterday) {
    newStreak = userData.current_streak + 1
  } else {
    newStreak = 1
  }

  const newBest = Math.max(userData.best_streak, newStreak)
  await service.from("users").update({
    current_streak:   newStreak,
    best_streak:      newBest,
    last_solved_date: today,
  }).eq("id", userId)

  return { current_streak: newStreak, best_streak: newBest }
}

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
  const { data: rivalries } = await service
    .from("nemesis_rivalries")
    .select("id, challenger_id, receiver_id")
    .eq("status", "active")
    .or(`challenger_id.eq.${userId},receiver_id.eq.${userId}`)

  if (!rivalries?.length) return

  for (const rivalry of rivalries) {
    const isChallenger = rivalry.challenger_id === userId
    const updateField  = isChallenger ? "challenger_result_id" : "receiver_result_id"

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
