import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import GameBoard from "@/components/game/GameBoard"
import { notFound } from "next/navigation"
import type { GuessHistoryEntry, RevealedLetters } from "@/types/shared"

interface Props {
  params: Promise<{ wordId: string }>
}

export default async function WordGamePage({ params }: Props) {
  const { wordId } = await params

  const { data: word } = await createServiceClient()
    .from("words")
    .select("id, source")
    .eq("id", wordId)
    .single()

  if (!word) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: raw } = await supabase
    .from("game_results")
    .select("id, solved, guesses, guess_history, revealed_letters")
    .eq("user_id", user!.id)
    .eq("word_id", wordId)
    .single()

  const existing = raw
    ? {
        ...raw,
        guess_history:    raw.guess_history    as unknown as GuessHistoryEntry[],
        revealed_letters: raw.revealed_letters as unknown as RevealedLetters,
      }
    : null

  // If the game is already over and it's a daily word, fetch streak for the status overlay
  let initialStreakData: { currentStreak: number; bestStreak: number } | null = null
  if (raw && (raw.solved || raw.guesses >= 6) && word.source === "daily_global") {
    const { data: userData } = await supabase
      .from("users")
      .select("current_streak, best_streak")
      .eq("id", user!.id)
      .single()
    if (userData) {
      initialStreakData = { currentStreak: userData.current_streak, bestStreak: userData.best_streak }
    }
  }

  const labels: Record<string, string> = {
    nemesis:      "מילת הנמסיס",
    chevre:       "מילת החבר׳ה",
    daily_global: "מילת היום",
  }

  return (
    <div className="flex flex-1 min-h-0 flex-col items-center gap-6 overflow-hidden">
      <h1 className="shrink-0 text-2xl font-bold">{labels[word.source] ?? "שחק"}</h1>
      <div className="flex w-full flex-1 min-h-0 justify-center overflow-hidden">
        <GameBoard wordId={wordId} existingResult={existing} initialStreakData={initialStreakData} />
      </div>
    </div>
  )
}
