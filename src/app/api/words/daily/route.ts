import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { israelToday } from "@/lib/dates"

/** GET /api/words/daily — returns today's word_id and metadata (no answer). */
export async function GET() {
  const supabase = await createClient()
  const today = israelToday()

  const { data, error } = await supabase
    .from("words")
    .select("id, date, language")
    .eq("source", "daily_global")
    .eq("date", today)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "No word scheduled for today" }, { status: 404 })
  }

  return NextResponse.json(data)
}
