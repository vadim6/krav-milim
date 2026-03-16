import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/server"
import logo from "@/app/krav_milim_logo.png"

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <Image src={logo} alt="קרב מילים" width={350} priority />
        <h1 className="text-5xl font-bold tracking-tight">קרב מילים</h1>
        <p className="text-lg text-gray-500">משחק ניחוש מילים תחרותי בעברית</p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {user ? (
          <Link
            href="/game"
            className="rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700 transition-colors"
          >
            שחק עכשיו
          </Link>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700 transition-colors"
            >
              התחבר
            </Link>
            <Link
              href="/signup"
              className="rounded-xl border border-gray-300 px-6 py-3 text-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              הירשם
            </Link>
            <div className="flex flex-col items-center gap-2 mt-3">
              <span className="text-xs text-gray-400">או</span>
              <Link
                href="/demo"
                className="rounded-xl border border-gray-600 px-5 py-2 text-sm font-medium text-gray-400 hover:border-gray-400 hover:text-gray-200 transition-colors"
              >
                משחק נסיון ללא הרשמה
              </Link>
            </div>
          </>
        )}
      </div>

      <p className="text-sm text-gray-400">מילה יומית אחת לכולם · שלושה מצבי יריבות</p>
    </main>
  )
}
