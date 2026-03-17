import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import ThemeToggle from "./ThemeToggle"
import AboutButton from "./AboutButton"
import SettingsButton from "./SettingsButton"
import AvatarDisplay from "@/components/avatar/AvatarDisplay"
import type { AvatarConfig } from "@/lib/avatar/styles"
import logo from "@/app/krav_milim_logo.png"

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  let avatarConfig: AvatarConfig | null = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("username, avatar_config")
      .eq("id", user.id)
      .single()
    username = data?.username ?? null
    avatarConfig = (data?.avatar_config as AvatarConfig | null) ?? null
  }

  const isAdmin = !!process.env.ADMIN_EMAIL && user?.email === process.env.ADMIN_EMAIL

  const isDev = process.env.NODE_ENV === "development"

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
      {isDev && (
        <div className="bg-red-600 text-white text-xs font-bold text-center py-0.5 tracking-widest select-none">
          DEVELOPMENT INSTANCE
        </div>
      )}
      <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/game" className="flex items-center gap-2 shrink-0">
          <Image src={logo} alt="" height={44} priority />
          <span className="text-lg font-bold">קרב מילים</span>
        </Link>

        <div className="flex items-center gap-3 text-sm">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:opacity-80 transition-opacity font-medium"
            >
              ניהול
            </Link>
          )}
          <Link href="/game"        className="hidden sm:inline hover:text-green-600 transition-colors">משחק</Link>
          <Link href="/leaderboard" className="hidden sm:inline hover:text-green-600 transition-colors">דירוג</Link>
          <Link href="/rivalries"   className="hidden sm:inline hover:text-green-600 transition-colors">יריבויות</Link>
          <Link href="/profile" className="flex items-center gap-1.5 hover:text-green-600 transition-colors font-medium">
            <AvatarDisplay config={avatarConfig} username={username ?? ""} size={28} />
            <span className="hidden sm:inline">{username ?? "פרופיל"}</span>
          </Link>
          <SettingsButton />
          <ThemeToggle />
          <AboutButton />
        </div>
      </nav>
    </header>
  )
}
