export const dynamic = "force-dynamic"

import { createServiceClient } from "@/lib/supabase/service"
import DemoLeaderboardTable from "@/components/leaderboard/DemoLeaderboardTable"
import Link from "next/link"

export default async function DemoLeaderboardPage() {
  const service = createServiceClient()
  const today = new Date().toISOString().split("T")[0]

  const [{ data: daily }, { data: alltime }] = await Promise.all([
    service
      .from("leaderboard_global")
      .select("*")
      .eq("date", today)
      .order("rank", { ascending: true })
      .limit(50),
    service
      .from("leaderboard_alltime")
      .select("*")
      .order("rank", { ascending: true })
      .limit(50),
  ])

  return (
    <main className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/demo" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← חזרה למשחק
        </Link>
        <h1 className="text-xl font-bold">לוח תוצאות</h1>
        <Link href="/signup" className="text-sm text-green-500 hover:text-green-400 transition-colors font-medium">
          הירשם
        </Link>
      </div>

      <DemoLeaderboardTable daily={daily ?? []} alltime={alltime ?? []} />
    </main>
  )
}
