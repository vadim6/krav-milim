import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import GameBoard from "@/components/game/GameBoard"
import { israelToday, formatHebrewDate } from "@/lib/dates"
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"

export default async function GamePage() {
  const service = createServiceClient()

  // Fetch today's global word id via service role (bypasses RLS on words table)
  // The answer is never sent to the client — only the word id
  const today = israelToday()
  const { data: word } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  if (!word) {
    return (
      <div className="text-center py-20 text-gray-400">
        אין מילה יומית להיום. חזור מחר!
      </div>
    )
  }

  // Check if the user already played today (user client respects RLS on game_results)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: raw } = await supabase
    .from("game_results")
    .select("id, solved, guesses, guess_history, revealed_letters")
    .eq("user_id", user!.id)
    .eq("word_id", word.id)
    .single()

  // Supabase types JSONB columns as `Json`; cast to known shapes
  const existing = raw
    ? {
        ...raw,
        guess_history:    raw.guess_history    as unknown as GuessHistoryEntry[],
        revealed_letters: raw.revealed_letters as unknown as RevealedLetters,
      }
    : null

  // If the game is already over, fetch current streak to show in the status overlay
  let initialStreakData: { currentStreak: number; bestStreak: number } | null = null
  if (raw && (raw.solved || raw.guesses >= 6)) {
    const { data: userData } = await supabase
      .from("users")
      .select("current_streak, best_streak")
      .eq("id", user!.id)
      .single()
    if (userData) {
      initialStreakData = { currentStreak: userData.current_streak, bestStreak: userData.best_streak }
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-0.5">
        <h1 className="text-2xl font-bold">מילת היום</h1>
        <p className="text-xs text-gray-400">{formatHebrewDate(today)}</p>
      </div>
      <GameBoard wordId={word.id} existingResult={existing} initialStreakData={initialStreakData} />
    </div>
  )
}
