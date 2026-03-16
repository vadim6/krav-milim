import { createServiceClient } from "@/lib/supabase/service"
import DemoGameBoard from "@/components/game/DemoGameBoard"
import Link from "next/link"

export default async function DemoPage() {
  const service = createServiceClient()
  const today = new Date().toISOString().split("T")[0]

  // Fetch today's word id so we can exclude it
  const { data: todayWord } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  // Pick a deterministic random word for today's demo (changes daily).
  // Excludes today's word so the demo doesn't spoil it — any other word is fine
  // since the answer is never sent to the client until game over.
  const { data: demoWord } = await service
    .from("words")
    .select("id")
    .eq("source", "daily_global")
    .not("id", "eq", todayWord?.id ?? "")
    .order(`id`) // stable base order
    .limit(100)
    .then(async ({ data }) => {
      // Pick deterministically by day-of-year mod count
      if (!data?.length) return { data: null }
      const doy = Math.floor(
        (new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
      )
      return { data: data[doy % data.length] }
    })

  if (!demoWord) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8 text-center">
        <p className="text-gray-400">אין מילת נסיון זמינה כרגע. חזור מחר!</p>
        <Link href="/" className="text-sm text-green-500 underline">חזרה לדף הבית</Link>
      </main>
    )
  }

  return (
    <main className="flex min-h-dvh flex-col items-center pt-8 pb-20 px-4 gap-6">
      <div className="w-full max-w-sm flex items-center justify-between">
        <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          ← חזרה
        </Link>
        <h1 className="text-xl font-bold">משחק נסיון</h1>
        <Link href="/signup" className="text-sm text-green-500 hover:text-green-400 transition-colors font-medium">
          הירשם
        </Link>
      </div>

      <p className="text-sm text-gray-500 text-center -mt-2">
        מצב נסיון - התוצאות לא נשמרות
      </p>

      <DemoGameBoard wordId={demoWord.id} />
    </main>
  )
}
