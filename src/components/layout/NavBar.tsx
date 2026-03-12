import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import ThemeToggle from "./ThemeToggle"
import AboutButton from "./AboutButton"

export default async function NavBar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  if (user) {
    const { data } = await supabase
      .from("users")
      .select("username")
      .eq("id", user.id)
      .single()
    username = data?.username ?? null
  }

  const isAdmin = !!process.env.ADMIN_EMAIL && user?.email === process.env.ADMIN_EMAIL

  return (
    <header className="border-b bg-white dark:bg-gray-900 sticky top-0 z-10">
      <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/game" className="text-lg font-bold">
          קרב מילים
        </Link>

        <div className="flex items-center gap-4 text-sm">
          {isAdmin && (
            <Link
              href="/admin"
              className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 hover:opacity-80 transition-opacity font-medium"
            >
              ניהול
            </Link>
          )}
          <Link href="/game"        className="hover:text-green-600 transition-colors">משחק</Link>
          <Link href="/leaderboard" className="hover:text-green-600 transition-colors">דירוג</Link>
          <Link href="/rivalries"   className="hover:text-green-600 transition-colors">יריבויות</Link>
          <Link href="/profile"     className="hover:text-green-600 transition-colors font-medium">
            {username ?? "פרופיל"}
          </Link>
          <ThemeToggle />
          <AboutButton />
        </div>
      </nav>
    </header>
  )
}
