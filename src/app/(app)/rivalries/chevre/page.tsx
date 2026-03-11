import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function ChevreListPage() {
  const supabase = await createClient()

  const { data: groups } = await supabase
    .from("chevre_groups")
    .select("id, name, threshold_pct, invite_code")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">קבוצות חבר׳ה</h1>

      {groups?.length ? (
        groups.map((g) => (
          <Link
            key={g.id}
            href={`/rivalries/chevre/${g.id}`}
            className="flex items-center justify-between rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <div>
              <p className="font-semibold">{g.name}</p>
              <p className="text-xs text-gray-400">סף: {g.threshold_pct}%</p>
            </div>
            <span className="text-xs font-mono text-gray-400">{g.invite_code}</span>
          </Link>
        ))
      ) : (
        <p className="text-gray-400">אין קבוצות. צור קבוצה חדשה!</p>
      )}
    </div>
  )
}
