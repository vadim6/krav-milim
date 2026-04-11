import { createClient } from "@/lib/supabase/server"
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable"

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  const [
    { data: daily },
    { data: alltime },
    { data: weekly },
    { data: weeklyPrev },
    { data: monthly },
    { data: monthlyPrev },
  ] = await Promise.all([
    supabase.from("leaderboard_global").select("*").eq("date", today).order("rank", { ascending: true }).limit(50),
    supabase.from("leaderboard_alltime").select("*").order("rank", { ascending: true }).limit(50),
    supabase.from("leaderboard_weekly").select("*").order("rank", { ascending: true }).limit(50),
    supabase.from("leaderboard_weekly_prev").select("*").order("rank", { ascending: true }).limit(50),
    supabase.from("leaderboard_monthly").select("*").order("rank", { ascending: true }).limit(50),
    supabase.from("leaderboard_monthly_prev").select("*").order("rank", { ascending: true }).limit(50),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">לוח תוצאות</h1>
      <LeaderboardTable
        daily={daily ?? []}
        alltime={alltime ?? []}
        weekly={weekly ?? []}
        weeklyPrev={weeklyPrev ?? []}
        monthly={monthly ?? []}
        monthlyPrev={monthlyPrev ?? []}
      />
    </div>
  )
}
