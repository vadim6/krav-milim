import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import NavBar from "@/components/layout/NavBar"
import MobileNav from "@/components/layout/MobileNav"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const isDev = process.env.NODE_ENV === "development"

  return (
    <div className="flex min-h-dvh flex-col">
      <NavBar />
      <main className="flex flex-1 min-h-0 flex-col px-4 py-6 max-w-2xl mx-auto w-full pb-20 sm:pb-6">
        {children}
      </main>
      <MobileNav isDev={isDev} />
    </div>
  )
}
