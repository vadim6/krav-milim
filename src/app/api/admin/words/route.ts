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

  const { data, error } = await createServiceClient()
    .from("words")
    .select("id, word, date, source, created_at")
    .eq("source", "daily_global")
    .order("date", { ascending: false, nullsFirst: false })

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

  const { error } = await createServiceClient()
    .from("words")
    .insert({ word, date: date ?? null, source: "daily_global" })

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "כבר קיימת מילה לתאריך הזה" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true }, { status: 201 })
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
