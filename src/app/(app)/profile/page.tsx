import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: alltimeRow }] = await Promise.all([
    supabase.from("users").select("username, avatar_url, created_at").eq("id", user.id).single(),
    supabase.from("leaderboard_alltime").select("*").eq("user_id", user.id).single(),
  ])

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-green-200 flex items-center justify-center text-2xl font-bold text-green-700">
          {profile?.username?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{profile?.username}</h1>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>
      </div>

      {alltimeRow && (
        <div className="grid grid-cols-3 gap-4 text-center">
          <Stat label="סה״כ נצחונות" value={String(alltimeRow.total_wins)} />
          <Stat label="ממוצע ניחושים" value={String(alltimeRow.avg_guesses ?? "—")} />
          <Stat label="דירוג גלובלי" value={`#${alltimeRow.rank}`} />
        </div>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          התנתק
        </button>
      </form>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
