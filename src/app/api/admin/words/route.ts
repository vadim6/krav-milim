import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { normalizeWord } from "@/lib/game/hebrew"
import { WORD_LENGTH } from "@/lib/game/constants"

function isAdmin(email: string | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL
  return adminEmail && email === adminEmail
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Only return scheduled words (date IS NOT NULL) — the unscheduled pool can be 40k+ rows
  const { data, error } = await createServiceClient()
    .from("words")
    .select("id, word, date, source, created_at")
    .eq("source", "daily_global")
    .not("date", "is", null)
    .order("date", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const date: string | undefined = body.date
  const raw: string              = body.word ?? ""
  const word = normalizeWord(raw)

  if (word.length !== WORD_LENGTH) {
    return NextResponse.json({ error: `המילה חייבת להיות בת ${WORD_LENGTH} אותיות` }, { status: 400 })
  }

  const service = createServiceClient()
  const { error } = await service
    .from("words")
    .insert({ word, date: date ?? null, source: "daily_global" })

  if (error) {
    if (error.code === "23505" && error.message.includes("words_word_source_unique")) {
      // Word already exists in the pool — promote it to the requested date instead
      if (!date) {
        return NextResponse.json({ error: `המילה "${word}" כבר קיימת בבריכה` }, { status: 409 })
      }
      const { error: promoteErr } = await service
        .from("words")
        .update({ date })
        .eq("word", word)
        .eq("source", "daily_global")
        .is("date", null)
      if (promoteErr) {
        if (promoteErr.code === "23505") {
          return NextResponse.json({ error: "כבר קיימת מילה לתאריך הזה" }, { status: 409 })
        }
        return NextResponse.json({ error: promoteErr.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, promoted: true }, { status: 200 })
    }
    if (error.code === "23505") {
      return NextResponse.json({ error: "כבר קיימת מילה לתאריך הזה" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}

// POST ?action=pick_now — manually trigger daily word selection (assigns tomorrow's word)
export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const action = req.nextUrl.searchParams.get("action")
  const service = createServiceClient()
  const today   = new Date().toISOString().split("T")[0]

  if (action === "pick_today") {
    const { error } = await service.rpc("pick_word_for_date", { target_date: today })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "מילת היום נבחרה בהצלחה" })
  }

  if (action === "pick_now") {
    const { error } = await service.rpc("pick_daily_word")
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, message: "מילת מחר נבחרה בהצלחה" })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!isAdmin(user?.email)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { error } = await createServiceClient().from("words").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
