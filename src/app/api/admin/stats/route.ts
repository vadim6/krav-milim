import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"

function isAdmin(email: string | undefined) {
  return !!process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const service = createServiceClient()
  const today   = new Date().toISOString().split("T")[0]

  const [wordRes, playsRes, usersRes, scheduledRes, poolRes] = await Promise.all([
    // Today's word
    service.from("words").select("word").eq("source", "daily_global").eq("date", today).single(),
    // Today's plays
    service
      .from("game_results")
      .select("solved, word_id, words!inner(date, source)")
      .eq("words.source", "daily_global")
      .eq("words.date", today),
    // Total users
    service.from("users").select("id", { count: "exact", head: true }),
    // Words scheduled from today onwards
    service
      .from("words")
      .select("id", { count: "exact", head: true })
      .eq("source", "daily_global")
      .gte("date", today),
    // Unscheduled word pool (date IS NULL)
    service
      .from("words")
      .select("id", { count: "exact", head: true })
      .eq("source", "daily_global")
      .is("date", null),
  ])

  // Total plays ever
  const { count: totalPlays } = await service
    .from("game_results")
    .select("id", { count: "exact", head: true })

  const plays      = playsRes.data ?? []
  const solvedToday = plays.filter(p => p.solved).length

  return NextResponse.json({
    today,
    todayWord:      wordRes.data?.word ?? null,
    playsToday:     plays.length,
    solvedToday,
    totalUsers:     usersRes.count ?? 0,
    totalPlays:     totalPlays ?? 0,
    wordsScheduled: scheduledRes.count ?? 0,
    poolRemaining:  poolRes.count ?? 0,
  })
}
