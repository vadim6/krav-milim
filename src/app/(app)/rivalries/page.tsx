import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export default async function RivalriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: nemesisRivalries }, { data: chevreGroups }] = await Promise.all([
    supabase
      .from("nemesis_summary")
      .select("*")
      .or(`challenger_id.eq.${user!.id},receiver_id.eq.${user!.id}`),
    supabase
      .from("chevre_groups")
      .select("id, name, threshold_pct, invite_code, chevre_members(count)")
      .order("created_at", { ascending: false }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">יריבויות</h1>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">נֶמֶסִיס</h2>
          <Link href="/rivalries/nemesis" className="text-sm text-green-600 hover:underline">
            הכל ←
          </Link>
        </div>
        {nemesisRivalries?.length ? (
          nemesisRivalries.slice(0, 3).map((r) => (
            <Link
              key={r.rivalry_id}
              href={`/rivalries/nemesis/${r.rivalry_id}`}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium">
                {r.challenger_id === user!.id ? r.receiver_username : r.challenger_username}
              </span>
              <span className="text-sm text-gray-500">
                {r.challenger_id === user!.id
                  ? `${r.challenger_wins}–${r.receiver_wins}`
                  : `${r.receiver_wins}–${r.challenger_wins}`}
              </span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-400">אין יריבויות נמסיס עדיין</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">חבר׳ה</h2>
          <Link href="/rivalries/chevre" className="text-sm text-green-600 hover:underline">
            הכל ←
          </Link>
        </div>
        {chevreGroups?.length ? (
          chevreGroups.slice(0, 3).map((g) => (
            <Link
              key={g.id}
              href={`/rivalries/chevre/${g.id}`}
              className="flex items-center justify-between rounded-xl border p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="font-medium">{g.name}</span>
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-400">אין קבוצות חבר׳ה עדיין</p>
        )}
      </section>
    </div>
  )
}
