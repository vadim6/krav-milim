import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return <div className="p-8 text-red-500">ADMIN_EMAIL env var is not set.</div>
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")
  if (user.email !== adminEmail) redirect("/game")

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center gap-6">
        <a href="/admin" className="font-bold text-lg hover:opacity-80 transition-opacity">ניהול</a>
        <nav className="flex gap-5 text-sm text-gray-400">
          <a href="/admin/words"   className="hover:text-white transition-colors">מילים</a>
          <a href="/admin/users"   className="hover:text-white transition-colors">משתמשים</a>
          <a href="/admin/testing" className="hover:text-white transition-colors">בדיקות</a>
        </nav>
        <a href="/game" className="mr-auto text-xs text-gray-600 hover:text-gray-400 transition-colors">← למשחק</a>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
