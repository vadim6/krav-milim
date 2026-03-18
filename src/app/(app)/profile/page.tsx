import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { redirect } from "next/navigation"
import UsernameEditor from "@/components/profile/UsernameEditor"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import AvatarBuilder from "@/components/avatar/AvatarBuilder"
import NotificationSettings from "@/components/profile/NotificationSettings"
import type { AvatarConfig } from "@/lib/avatar/styles"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const service = createServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const svc = service as any
  const [{ data: profile }, { data: alltimeRow }, { data: notifSettings }] = await Promise.all([
    supabase.from("users").select("username, avatar_url, created_at, username_changed_at, avatar_config").eq("id", user.id).single(),
    supabase.from("leaderboard_alltime").select("*").eq("user_id", user.id).single(),
    svc.from("notification_settings").select("telegram_chat_id, discord_webhook_url, slack_webhook_url, email_enabled, notify_daily_reminder, notify_rival_solved, reminder_hour").eq("user_id", user.id).maybeSingle(),
  ])

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/")
  }

  const avatarConfig = profile?.avatar_config as AvatarConfig | null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative group">
          <AvatarDisplay
            config={avatarConfig}
            username={profile?.username ?? ""}
            size={64}
          />
          <AvatarBuilder initialConfig={avatarConfig} username={profile?.username ?? ""} />
        </div>
        <div>
          <UsernameEditor
            initialUsername={profile?.username ?? ""}
            changedAt={profile?.username_changed_at ?? null}
          />
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

      <NotificationSettings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialSettings={(notifSettings as any) ?? null}
        userEmail={user.email ?? ""}
        botName={process.env.TELEGRAM_BOT_NAME ?? "KravMilimBot"}
      />

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
