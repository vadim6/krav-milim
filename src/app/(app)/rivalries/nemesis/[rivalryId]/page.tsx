import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { notFound } from "next/navigation"
import Link from "next/link"

interface Props {
  params: Promise<{ rivalryId: string }>
}

export default async function NemesisRivalryPage({ params }: Props) {
  const { rivalryId } = await params
  const supabase  = await createClient()
  const service   = createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: summary } = await service
    .from("nemesis_summary")
    .select("*")
    .eq("rivalry_id", rivalryId)
    .single()

  if (!summary) notFound()

  // Verify the current user is a participant
  if (summary.challenger_id !== user!.id && summary.receiver_id !== user!.id) notFound()

  const iAmChallenger = summary.challenger_id === user!.id
  const myName        = iAmChallenger ? summary.challenger_username : summary.receiver_username
  const opponentName  = iAmChallenger ? summary.receiver_username  : summary.challenger_username
  const myWins        = iAmChallenger ? (summary.challenger_wins ?? 0) : (summary.receiver_wins ?? 0)
  const theirWins     = iAmChallenger ? (summary.receiver_wins ?? 0)  : (summary.challenger_wins ?? 0)

  // Load round history with result details
  const { data: rounds } = await service
    .from("nemesis_scores")
    .select(`
      id,
      date,
      word_id,
      winner_id,
      tiebreaker_applied,
      challenger_result:challenger_result_id ( guesses, solved ),
      receiver_result:receiver_result_id     ( guesses, solved )
    `)
    .eq("rivalry_id", rivalryId)
    .order("date", { ascending: false })
    .limit(30)

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/rivalries/nemesis" className="text-sm text-gray-400 hover:text-gray-200">← נמסיס</Link>
      </div>

      <h1 className="text-2xl font-bold">נמסיס: {opponentName}</h1>

      {/* Scorecard */}
      <div className="grid grid-cols-3 gap-4 rounded-2xl border border-gray-700 p-6 text-center">
        <div>
          <p className="text-3xl font-bold text-green-500">{myWins}</p>
          <p className="text-sm text-gray-400 mt-1 truncate">{myName}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-400">{summary.draws ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">תיקו</p>
        </div>
        <div>
          <p className="text-3xl font-bold text-red-500">{theirWins}</p>
          <p className="text-sm text-gray-400 mt-1 truncate">{opponentName}</p>
        </div>
      </div>
      <p className="text-center text-sm text-gray-500">{summary.rounds_played ?? 0} סיבובים</p>

      {/* Round history — only show rounds where both players have finished */}
      {rounds && rounds.filter(r => r.challenger_result && r.receiver_result).length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="font-semibold text-gray-300">היסטוריית סיבובים</h2>
          <div className="rounded-xl border border-gray-700 overflow-hidden">
            {rounds.filter(r => r.challenger_result && r.receiver_result).map((round, i) => {
              const myResult   = iAmChallenger ? round.challenger_result : round.receiver_result
              const theirResult = iAmChallenger ? round.receiver_result  : round.challenger_result
              const iWon = round.winner_id === user!.id
              const isDraw = round.winner_id === null && myResult && theirResult
              const pending = !myResult || !theirResult

              // Type assertions for joined rows
              type RoundResult = { guesses: number; solved: boolean } | null
              const myR    = myResult    as unknown as RoundResult
              const theirR = theirResult as unknown as RoundResult

              return (
                <div
                  key={round.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? "" : "bg-gray-900/50"}`}
                >
                  <span className="text-gray-400 text-xs w-24 shrink-0">
                    {new Date(round.date).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" })}
                  </span>

                  <div className="flex items-center gap-4 flex-1 justify-center">
                    {pending ? (
                      <span className="text-gray-500 text-xs">ממתין לתוצאות</span>
                    ) : (
                      <>
                        <span className={`tabular-nums ${iWon ? "text-green-400 font-semibold" : "text-gray-300"}`}>
                          {myR ? (myR.solved ? `${myR.guesses}/6` : "✗") : "—"}
                        </span>
                        <span className="text-gray-600">נגד</span>
                        <span className={`tabular-nums ${!iWon && !isDraw ? "text-red-400 font-semibold" : "text-gray-300"}`}>
                          {theirR ? (theirR.solved ? `${theirR.guesses}/6` : "✗") : "—"}
                        </span>
                      </>
                    )}
                  </div>

                  <span className={`text-xs w-12 text-left shrink-0 ${iWon ? "text-green-400" : isDraw ? "text-gray-400" : pending ? "text-gray-600" : "text-red-400"}`}>
                    {pending ? "" : iWon ? "ניצחת" : isDraw ? "תיקו" : "הפסדת"}
                    {round.tiebreaker_applied && !pending ? " *" : ""}
                  </span>
                </div>
              )
            })}
          </div>
          {rounds.some(r => r.tiebreaker_applied) && (
            <p className="text-xs text-gray-500">* הוכרע ע"י מחשבון תיקו</p>
          )}
        </section>
      )}
    </div>
  )
}
