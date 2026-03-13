import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"

interface Props {
  params: Promise<{ groupId: string }>
}

export default async function ChevreGroupPage({ params }: Props) {
  const { groupId } = await params
  const supabase = await createClient()

  const [{ data: group }, { data: members }, { data: todayScore }] = await Promise.all([
    supabase
      .from("chevre_groups")
      .select("id, name, threshold_pct, invite_code")
      .eq("id", groupId)
      .single(),
    supabase
      .from("chevre_members")
      .select("user_id, role, users(username, avatar_config)")
      .eq("group_id", groupId),
    supabase
      .from("chevre_scores")
      .select("hider_id, hider_won, seeker_results")
      .eq("group_id", groupId)
      .eq("date", new Date().toISOString().split("T")[0])
      .single(),
  ])

  if (!group) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-sm text-gray-400">קוד הזמנה: <span className="font-mono">{group.invite_code}</span></p>
      </div>

      {todayScore && (
        <div className="rounded-xl border p-4 space-y-2">
          <h2 className="font-semibold">היום</h2>
          {todayScore.hider_won === null ? (
            <p className="text-sm text-gray-400">הסיבוב עדיין פתוח</p>
          ) : todayScore.hider_won ? (
            <p className="text-sm text-red-500">המחביא ניצח — המילה הייתה קשה מדי!</p>
          ) : (
            <p className="text-sm text-green-600">המחפשים ניצחו!</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold">חברי הקבוצה ({members?.length ?? 0})</h2>
        {members?.map((m) => {
          const u = (m.users as unknown) as { username: string; avatar_config: AvatarConfig | null } | null
          return (
            <div key={m.user_id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <AvatarDisplay config={u?.avatar_config ?? null} username={u?.username ?? ""} size={32} />
              <span className="font-medium">{u?.username}</span>
              {m.role === "admin" && (
                <span className="text-xs bg-green-100 text-green-700 rounded px-1">מנהל</span>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 text-sm text-gray-500">
        סף ניצחון: {group.threshold_pct}% חייבים לפתור כדי שהמחפשים ינצחו
      </div>
    </div>
  )
}
